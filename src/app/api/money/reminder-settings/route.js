import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAdminAuth } from '@/lib/money-auth';
import PocketlyReminderSettings from '@/models/PocketlyReminderSettings';

const REMINDER_MODES = new Set(['if_no_transactions', 'always']);

function serializeSettings(settings) {
  return {
    id: settings._id.toString(),
    isEnabled: Boolean(settings.isEnabled),
    reminderTime: settings.reminderTime || '21:00',
    timezone: settings.timezone || 'Asia/Kolkata',
    reminderMode: settings.reminderMode || 'if_no_transactions',
    lastReminderSentAt: settings.lastReminderSentAt
      ? new Date(settings.lastReminderSentAt).toISOString()
      : null,
    lastReminderSentDate: settings.lastReminderSentDate || null,
    updatedAt: settings.updatedAt ? new Date(settings.updatedAt).toISOString() : null,
  };
}

function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function validatePayload(payload) {
  const errors = [];
  const next = {};

  if (typeof payload.isEnabled === 'boolean') {
    next.isEnabled = payload.isEnabled;
  }

  if (typeof payload.reminderTime === 'string') {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(payload.reminderTime)) {
      errors.push('Reminder time must use HH:mm format.');
    } else {
      next.reminderTime = payload.reminderTime;
    }
  }

  if (typeof payload.timezone === 'string') {
    const timezone = payload.timezone.trim();
    if (!timezone || !isValidTimezone(timezone)) {
      errors.push('Timezone is invalid.');
    } else {
      next.timezone = timezone;
    }
  }

  if (typeof payload.reminderMode === 'string') {
    if (!REMINDER_MODES.has(payload.reminderMode)) {
      errors.push('Reminder mode is invalid.');
    } else {
      next.reminderMode = payload.reminderMode;
    }
  }

  return { errors, next };
}

export async function GET(request) {
  const session = await requireAdminAuth(request);
  if (session instanceof NextResponse) return session;

  try {
    await dbConnect();
    const settings = await PocketlyReminderSettings.getSettings();
    return NextResponse.json({ success: true, settings: serializeSettings(settings) });
  } catch (error) {
    console.error('[PocketlyReminderSettings] Failed to load settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load reminder settings' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await requireAdminAuth(request);
  if (session instanceof NextResponse) return session;

  try {
    await dbConnect();
    const payload = await request.json();
    const { errors, next } = validatePayload(payload || {});

    if (errors.length > 0) {
      return NextResponse.json({ success: false, message: errors[0], errors }, { status: 400 });
    }

    const settings = await PocketlyReminderSettings.getSettings();
    Object.assign(settings, next);
    await settings.save();

    return NextResponse.json({ success: true, settings: serializeSettings(settings) });
  } catch (error) {
    console.error('[PocketlyReminderSettings] Failed to save settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save reminder settings' },
      { status: 500 }
    );
  }
}
