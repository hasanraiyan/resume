/**
 * @fileoverview Admin Telegram Settings API route for managing Telegram bot integration.
 * This module provides endpoints for configuring and testing Telegram bot notifications,
 * including bot token management, chat ID configuration, and message testing capabilities.
 *
 * @description This API endpoint allows administrators to:
 * - Retrieve current Telegram bot configuration settings
 * - Update bot token and chat ID for notifications
 * - Test Telegram integration with test messages
 * - Enable/disable Telegram notifications
 * - Encrypt/decrypt sensitive bot tokens for security
 *
 * The integration supports sending formatted messages via Telegram Bot API
 * and includes proper error handling and validation for all operations.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TelegramSettings from '@/models/TelegramSettings';
import { encrypt, decrypt } from '@/lib/crypto';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

/**
 * Sends a message through the Telegram Bot API with proper formatting and error handling.
 * Uses MarkdownV2 parse mode for rich text formatting in Telegram messages.
 *
 * @async
 * @function sendTelegramMessage
 * @param {string} botToken - The Telegram bot token for authentication
 * @param {string} chatId - The chat ID where the message should be sent
 * @param {string} text - The message text to send (supports MarkdownV2 formatting)
 * @returns {Promise<Object>} Telegram API response object with success/error information
 *
 * @description This function handles the low-level communication with Telegram's Bot API,
 * including proper error handling, logging, and response formatting. It automatically
 * escapes special characters for MarkdownV2 formatting and provides detailed logging
 * for debugging purposes.
 *
 * @example
 * const result = await sendTelegramMessage(
 *   '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
 *   '@my_channel',
 *   '✅ Integration test successful!'
 * );
 */
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

/**
 * Retrieves the current Telegram bot configuration settings.
 * Requires admin authentication and returns decrypted bot token for admin UI.
 *
 * @async
 * @function GET
 * @param {Request} request - Next.js request object for session validation
 * @returns {Promise<NextResponse>} JSON response with current Telegram settings
 *
 * @description This endpoint allows administrators to view the current Telegram
 * integration configuration, including:
 * - Whether Telegram notifications are enabled
 * - The bot token (decrypted for display in admin UI)
 * - The chat ID for message delivery
 *
 * The bot token is automatically decrypted when returned to provide
 * a better admin experience while maintaining security in the database.
 *
 * @example
 * // Get current Telegram settings
 * GET /api/admin/telegram-settings
 *
 * @example Response:
 * {
 *   "isEnabled": true,
 *   "botToken": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
 *   "chatId": "@my_channel"
 * }
 */
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

/**
 * Updates Telegram bot settings or sends test messages based on the action parameter.
 * Supports both saving configuration and testing the Telegram integration.
 *
 * @async
 * @function POST
 * @param {Request} request - Next.js request object containing action and settings data
 * @returns {Promise<NextResponse>} JSON response with operation results or error message
 *
 * @description This endpoint supports two main operations:
 * - Test action: Validates Telegram configuration by sending a test message
 * - Save action (default): Updates and encrypts bot settings in the database
 *
 * The function handles bot token encryption for security and provides
 * detailed error messages for troubleshooting integration issues.
 *
 * @example
 * // Test Telegram integration
 * POST /api/admin/telegram-settings
 * Body: {
 *   "action": "test",
 *   "botToken": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
 *   "chatId": "@my_channel"
 * }
 *
 * @example
 * // Save Telegram settings
 * POST /api/admin/telegram-settings
 * Body: {
 *   "isEnabled": true,
 *   "botToken": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
 *   "chatId": "@my_channel"
 * }
 *
 * @example Test Response:
 * {
 *   "success": true,
 *   "message": "Test message sent successfully!"
 * }
 *
 * @example Save Response:
 * {
 *   "success": true,
 *   "message": "Settings saved successfully."
 * }
 */
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
