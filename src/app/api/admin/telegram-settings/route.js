// src/app/api/admin/telegram-settings/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TelegramSettings from '@/models/TelegramSettings';
import { encrypt, decrypt } from '@/lib/crypto';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

async function sendTelegramMessage(botToken, chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2',
    };

    console.log('[Telegram][sendTelegramMessage] Request details', {
      url,
      botToken,
      chatId,
      textPreview: text.slice(0, 100),
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    console.log('[Telegram][sendTelegramMessage] Response payload', {
      status: response.status,
      ok: response.ok,
      result,
    });
    return result;
  } catch (error) {
    console.error('[Telegram][sendTelegramMessage] Telegram API Error:', error);
    return { ok: false, description: 'Failed to send message.' };
  }
}

// GET settings
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const settings = await TelegramSettings.getSettings();

  return NextResponse.json({
    isEnabled: settings.isEnabled,
    botToken: decrypt(settings.botToken), // Decrypt for admin UI
    chatId: settings.chatId,
  });
}

// POST to update or test settings
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { action, ...data } = await request.json();
  console.log('[Telegram][POST] Incoming request', { action, data });

  if (action === 'test') {
    const { botToken, chatId } = data;
    if (!botToken || !chatId) {
      return NextResponse.json(
        { success: false, message: 'Bot Token and Chat ID are required to send a test message.' },
        { status: 400 }
      );
    }
    console.log('[Telegram][POST] Sending test message', { botToken, chatId });
    const result = await sendTelegramMessage(
      botToken,
      chatId,
      '✅ Your Telegram integration is working\\!'
    );
    console.log('[Telegram][POST] Test result', result);
    if (result.ok) {
      return NextResponse.json({ success: true, message: 'Test message sent successfully!' });
    } else {
      return NextResponse.json(
        { success: false, message: `Failed to send message: ${result.description}` },
        { status: 400 }
      );
    }
  }

  // Default action is to save
  const settings = await TelegramSettings.getSettings();
  settings.isEnabled = data.isEnabled;
  settings.chatId = data.chatId;
  console.log('[Telegram][POST] Saving settings before encryption', {
    isEnabled: data.isEnabled,
    chatId: data.chatId,
    botToken: data.botToken,
  });
  const encryptedToken = encrypt(data.botToken); // Encrypt before saving
  console.log('[Telegram][POST] Encrypted bot token', { encryptedToken });
  settings.botToken = encryptedToken;

  await settings.save();
  console.log('[Telegram][POST] Settings saved successfully', settings);

  return NextResponse.json({ success: true, message: 'Settings saved successfully.' });
}
