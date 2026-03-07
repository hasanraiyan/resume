import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import IntegrationSettings from '@/models/IntegrationSettings';
import { IntegrationFactory } from '@/lib/integrations/IntegrationFactory';
import { decrypt } from '@/lib/crypto';
import AgentRegistry from '@/lib/agents/AgentRegistry';

// Ensure agents are imported and registered before processing any webhooks
import '@/lib/agents';

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
    const credentials = {};
    if (integration.credentials instanceof Map) {
      for (const [key, value] of integration.credentials.entries()) {
        credentials[key] = decrypt(value);
      }
    } else {
      for (const [key, value] of Object.entries(integration.credentials || {})) {
        credentials[key] = decrypt(value);
      }
    }

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
    // Note: Some webhooks send form data, some send json. We clone/read raw.
    // Assuming JSON payloads for now (e.g., Telegram).
    const rawBody = await request.json();
    const parsedData = await adapter.parseMessage(rawBody);

    if (!parsedData) {
      // Just an event we don't care about (e.g. read receipt, typing indicator)
      return NextResponse.json({ status: 'Event Ignored' }, { status: 200 });
    }

    const { chatId, userMessage } = parsedData;

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
  return NextResponse.json({ message: `Webhook endpoint for ${params.platform} is active.` });
}
