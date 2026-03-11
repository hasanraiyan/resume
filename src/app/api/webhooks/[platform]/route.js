import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import IntegrationSettings from '@/models/IntegrationSettings';
import { IntegrationFactory } from '@/lib/integrations/IntegrationFactory';
import AgentRegistry from '@/lib/agents/AgentRegistry';
import {
  decryptSensitiveIntegrationCredentials,
  integrationMapToObject,
  integrationMetadataToObject,
  normalizeTelegramAuthorizedChats,
} from '@/lib/integrations/credentials';

// Ensure agents are imported and registered before processing any webhooks
import '@/lib/agents';

const TELEGRAM_AUTH_COMMAND = /^auth\s*:\s*(.+)$/i;

function getAuthorizedChats(integration) {
  const metadata = integrationMetadataToObject(integration.metadata);
  return normalizeTelegramAuthorizedChats(metadata.authorizedChats);
}

function setAuthorizedChats(integration, authorizedChats) {
  integration.metadata = {
    ...integrationMetadataToObject(integration.metadata),
    authorizedChats: normalizeTelegramAuthorizedChats(authorizedChats),
  };
}

function upsertAuthorizedChat(integration, chatId, username) {
  const normalizedChatId = String(chatId);
  const now = new Date().toISOString();
  const authorizedChats = getAuthorizedChats(integration);
  const existingIndex = authorizedChats.findIndex((entry) => entry.chatId === normalizedChatId);

  if (existingIndex >= 0) {
    const existingEntry = authorizedChats[existingIndex];
    authorizedChats[existingIndex] = {
      ...existingEntry,
      ...(username ? { username } : {}),
      firstAuthorizedAt: existingEntry.firstAuthorizedAt || now,
      lastAuthorizedAt: now,
    };
  } else {
    authorizedChats.push({
      chatId: normalizedChatId,
      ...(username ? { username } : {}),
      firstAuthorizedAt: now,
      lastAuthorizedAt: now,
    });
  }

  setAuthorizedChats(integration, authorizedChats);
}

async function authorizeTelegramChat(integration, adapter, credentials, parsedData) {
  const telegramAuthToken = credentials.telegramAuthToken?.trim();

  if (!telegramAuthToken) {
    return true;
  }

  if (parsedData.chatType !== 'private') {
    await adapter.sendMessage(
      parsedData.chatId,
      'Please use this bot in a private chat to authenticate access.'
    );
    return false;
  }

  const authorizedChats = getAuthorizedChats(integration);
  const normalizedChatId = String(parsedData.chatId);
  const isAuthorized = authorizedChats.some((entry) => entry.chatId === normalizedChatId);
  const authMatch = parsedData.userMessage.match(TELEGRAM_AUTH_COMMAND);

  if (authMatch) {
    const submittedToken = authMatch[1].trim();

    if (submittedToken === telegramAuthToken) {
      upsertAuthorizedChat(integration, parsedData.chatId, parsedData.username);
      await integration.save();
      await adapter.sendMessage(
        parsedData.chatId,
        isAuthorized
          ? 'Access confirmed. You can continue chatting with the bot.'
          : 'Authentication successful. You can now chat with the bot.'
      );
    } else {
      await adapter.sendMessage(
        parsedData.chatId,
        'Invalid access code. Send `auth:<code>` to try again.'
      );
    }

    return false;
  }

  if (!isAuthorized) {
    await adapter.sendMessage(
      parsedData.chatId,
      'Access is restricted. Send `auth:<code>` in this private chat to enable the bot.'
    );
    return false;
  }

  return true;
}

/**
 * Generic Webhook Endpoint for all Integrations
 * Routes incoming payloads to the correct adapter, parses the message,
 * passes it to the AI Agent, and sends the response back to the channel.
 */
export async function POST(request, { params }) {
  const { platform } = await params; // e.g., 'telegram', 'whatsapp'

  try {
    // 1. Resolve Platform Integration Configuration
    await dbConnect();
    // Assuming there is only one active integration per platform type right now.
    // If you support multiple bots per platform, you might need to route via URL parameter
    // e.g. /api/webhooks/[platform]/[integrationId]
    const integration = await IntegrationSettings.findOne({
      platform: platform.toLowerCase(),
      isActive: true,
    });

    if (!integration) {
      console.warn(`Webhook received for unregistered/inactive platform: ${platform}`);
      return NextResponse.json({ status: 'Ignored' }, { status: 200 });
    }

    // 2. Decrypt Credentials
    const rawCredentials = integrationMapToObject(integration.credentials);
    const credentials = decryptSensitiveIntegrationCredentials(rawCredentials);

    // 3. Instantiate specific adapter via Factory
    const adapter = IntegrationFactory.getAdapter(platform, credentials);
    if (!adapter) {
      console.error(`Missing or invalid adapter for platform: ${platform}`);
      // Always return 200 to webhooks so they don't retry incessantly
      return NextResponse.json({ status: 'Adapter Missing' }, { status: 200 });
    }

    // 4. Verify Request (if required by platform)
    const isValid = await adapter.verifyWebhook(request);
    if (!isValid) {
      console.warn(`Webhook verification failed for platform: ${platform}`);
      return NextResponse.json({ error: 'Verification failed' }, { status: 401 });
    }

    // 5. Parse Generic Message
    // Note: Some webhooks send form data (Twilio), some send json (Telegram).
    let rawBody;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      rawBody = Object.fromEntries(formData.entries());
    } else {
      try {
        rawBody = await request.json();
      } catch (e) {
        // Fallback to text if JSON parsing fails
        const text = await request.text();
        console.warn(
          `[Webhook] Failed to parse JSON, falling back to text. Body starting with: ${text.substring(0, 20)}`
        );
        rawBody = text;
      }
    }

    const parsedData = await adapter.parseMessage(rawBody);

    if (!parsedData) {
      // Just an event we don't care about (e.g. read receipt, typing indicator)
      return NextResponse.json({ status: 'Event Ignored' }, { status: 200 });
    }

    const { chatId, userMessage } = parsedData;

    if (platform.toLowerCase() === 'telegram') {
      const isAuthorized = await authorizeTelegramChat(
        integration,
        adapter,
        credentials,
        parsedData
      );

      if (!isAuthorized) {
        return NextResponse.json({ status: 'Handled' }, { status: 200 });
      }
    }

    // Optional: send typing indicator immediately so the user knows we got it
    await adapter.sendTypingAction(chatId);

    // 6. Execute AI Agent
    try {
      console.log(
        `[Platform Webhook] Routing message from ${platform}:${chatId} to Agent:${integration.agentId}`
      );

      // Use our secure, robust AgentRegistry to get the configured agent
      const agent = AgentRegistry.get(integration.agentId);

      // Standard execution context: Try streamExecute as some agents only support that
      let textResponse = '';
      try {
        const stream = await agent.streamExecute({
          userMessage: userMessage,
          sessionId: `${platform}-${chatId}`, // Pass stable session ID for history
          activeMCPs: agent.config.activeMCPs || [],
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content' && chunk.message) {
            textResponse += chunk.message;
          } else if (chunk.type === 'text' && chunk.content) {
            textResponse += chunk.content;
          } else if (typeof chunk === 'string') {
            textResponse += chunk;
          }
        }
      } catch (streamError) {
        // Fallback to standard execute if streaming fails entirely
        const aiResponse = await agent.execute({
          userMessage: userMessage,
          sessionId: `${platform}-${chatId}`,
        });
        textResponse =
          aiResponse?.text || aiResponse || "I'm sorry, I couldn't process that response.";
      }

      // 7. Send Response back via the adapter
      await adapter.sendMessage(chatId, textResponse);
    } catch (agentError) {
      console.error(`Agent execution error for integration ${platform}:`, agentError);
      await adapter.sendMessage(
        chatId,
        'Sorry, I am currently experiencing technical difficulties.'
      );
    }

    return NextResponse.json({ status: 'Success' }, { status: 200 });
  } catch (error) {
    console.error(`Unhandled webhook error for platform ${platform}:`, error);
    // Still return 200 to avoid webhook sender retrying infinitely for a fatal bug
    return NextResponse.json({ status: 'Internal Server Error (Captured)' }, { status: 200 });
  }
}

// Telegram specifically requires GET for setting up the webhook
// (or you can use a separate script, this handles simple ping checking)
export async function GET(request, { params }) {
  const { platform } = await params;

  try {
    await dbConnect();
    const integration = await IntegrationSettings.findOne({
      platform: platform.toLowerCase(),
      isActive: true,
    });

    if (integration && platform.toLowerCase() === 'whatsapp') {
      // 2. Decrypt Credentials
      const credentials = decryptSensitiveIntegrationCredentials(
        integrationMapToObject(integration.credentials)
      );

      const adapter = IntegrationFactory.getAdapter(platform, credentials);
      if (adapter && typeof adapter.handleVerification === 'function') {
        const challenge = await adapter.handleVerification(request);
        if (challenge) {
          return new Response(challenge, { status: 200 });
        }
      }
    }
  } catch (error) {
    console.error(`[Webhook GET Error] Platform: ${platform}`, error);
  }

  return NextResponse.json({ message: `Webhook endpoint for ${platform} is active.` });
}
