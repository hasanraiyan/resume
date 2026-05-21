import dbConnect from '@/lib/dbConnect';
import Transaction from '@/models/Transaction';
import PocketlyReminderSettings from '@/models/PocketlyReminderSettings';
import { escapeTelegramMarkdownV2, sendTelegramMessageFromSettings } from '@/lib/telegram';

function getBaseUrl(request) {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(request.url).origin;
}

function getLocalParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    dateKey: `${values.year}-${values.month}-${values.day}`,
  };
}

function getTimezoneOffsetMs(date, timezone) {
  const parts = getLocalParts(date, timezone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return localAsUtc - date.getTime();
}

function zonedTimeToUtc(parts, timezone) {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour || 0,
    parts.minute || 0,
    parts.second || 0,
    parts.millisecond || 0
  );

  let utcDate = new Date(localAsUtc - getTimezoneOffsetMs(new Date(localAsUtc), timezone));
  utcDate = new Date(localAsUtc - getTimezoneOffsetMs(utcDate, timezone));
  return utcDate;
}

function getLocalDayRangeUtc(date, timezone) {
  const local = getLocalParts(date, timezone);
  const start = zonedTimeToUtc(
    {
      year: local.year,
      month: local.month,
      day: local.day,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    timezone
  );
  const nextLocalDay = new Date(Date.UTC(local.year, local.month - 1, local.day + 1));
  const nextLocal = {
    year: nextLocalDay.getUTCFullYear(),
    month: nextLocalDay.getUTCMonth() + 1,
    day: nextLocalDay.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  };
  const end = zonedTimeToUtc(nextLocal, timezone);
  return { start, end, dateKey: local.dateKey, local };
}

function hasReminderTimeArrived(local, reminderTime) {
  const [hour, minute] = reminderTime.split(':').map(Number);
  return local.hour * 60 + local.minute >= hour * 60 + minute;
}

function createReminderMessage({ transactionCount, reminderMode, baseUrl, isTest }) {
  const modeLine =
    reminderMode === 'always'
      ? 'Daily check\\-in for your Pocketly records'
      : 'No transactions logged today';

  const transactionLine =
    reminderMode === 'always'
      ? `Transactions today: ${escapeTelegramMarkdownV2(transactionCount)}`
      : 'Add them before you forget';

  const testLine = isTest ? '\n_Test run from Pocketly settings_\n' : '';

  return `
*Pocketly Reminder*
${testLine}
${modeLine}
${transactionLine}

Quick check:
\\- Food, tea, or groceries?
\\- UPI or card payment?
\\- Travel or shopping?
\\- Income or transfer?

Open Pocketly:
${escapeTelegramMarkdownV2(`${baseUrl}/apps/pocketly`)}
  `.trim();
}

export async function runPocketlyReminder({ request, force = false, persistLastSent = true } = {}) {
  await dbConnect();

  const settings = await PocketlyReminderSettings.getSettings();
  if (!settings.isEnabled && !force) {
    return { success: true, skipped: true, reason: 'Reminder disabled' };
  }

  const now = new Date();
  const timezone = settings.timezone || 'Asia/Kolkata';
  const reminderTime = settings.reminderTime || '21:00';
  const reminderMode = settings.reminderMode || 'if_no_transactions';
  const { start, end, dateKey, local } = getLocalDayRangeUtc(now, timezone);

  if (!force && !hasReminderTimeArrived(local, reminderTime)) {
    return {
      success: true,
      skipped: true,
      reason: 'Reminder time has not arrived',
      localDate: dateKey,
      reminderTime,
      timezone,
    };
  }

  if (!force && settings.lastReminderSentDate === dateKey) {
    return {
      success: true,
      skipped: true,
      reason: 'Reminder already sent today',
      localDate: dateKey,
    };
  }

  const transactionCount = await Transaction.countDocuments({
    deletedAt: null,
    date: { $gte: start, $lt: end },
  });

  if (!force && reminderMode === 'if_no_transactions' && transactionCount > 0) {
    return {
      success: true,
      skipped: true,
      reason: 'Transactions already logged today',
      transactionCount,
      localDate: dateKey,
    };
  }

  const result = await sendTelegramMessageFromSettings(
    createReminderMessage({
      transactionCount,
      reminderMode,
      baseUrl: getBaseUrl(request),
      isTest: force,
    })
  );

  if (!result.ok) {
    return {
      success: false,
      message: result.description || 'Failed to send Telegram reminder',
      skipped: result.skipped || false,
      status: result.skipped ? 200 : 500,
    };
  }

  if (persistLastSent) {
    settings.lastReminderSentAt = now;
    settings.lastReminderSentDate = dateKey;
    await settings.save();
  }

  return {
    success: true,
    sent: true,
    localDate: dateKey,
    reminderMode,
    transactionCount,
    test: force,
  };
}
