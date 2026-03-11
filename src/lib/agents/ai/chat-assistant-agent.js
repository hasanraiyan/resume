/**
 * Chat Assistant Agent
 *
 * Handles conversational AI interactions using LangGraph, including Tool integration
 * and Multi-Server MCP Client routing. Extends BaseAgent.
 */

import crypto from 'node:crypto';
import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { buildDynamicContext } from '../utils/context-builder';
import Analytics from '@/models/Analytics';
import ChatLog from '@/models/ChatLog';
import { getToolStatusMessage } from '../utils/chatbot-utils';
import { getBackendMCPConfig } from '@/lib/mcpConfig';
import { portfolioTools } from '../utils/portfolio-tools';
import { createAdminTools } from '../utils/admin-tools';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import {
  trimMessages,
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';

// Filter out AIMessageChunk messages - they don't have .role and cause trimMessages to fail
function sanitizeMessages(messages) {
  return messages.filter((msg) => !(msg instanceof AIMessageChunk));
}

// System message builder moved to a static or instance method if preferred,
// but keeping it as a standalone function for now.

export function buildSystemMessages(context, path) {
  const { chatbotSettings } = context || {};
  if (!chatbotSettings) return [];

  const settings = {
    aiName: chatbotSettings.aiName || 'Assistant',
    persona: chatbotSettings.persona || '',
    callToAction: chatbotSettings.callToAction || '',
    rules: chatbotSettings.rules || [],
  };

  return [
    {
      role: 'system',
      content: `You are ${settings.aiName}. ${settings.persona}. Your knowledge of projects and articles is limited; you must use tools to get information.

CRITICAL INSTRUCTIONS:
1. Do not make up information. If you don't know, use a tool.
2. Always be professional, confident, and exceptionally helpful.
3. You represent Raiyan's professional portfolio.
4. When you call tools (projects, articles, contact), the system automatically intercepts the data and displays beautiful UI cards to the user below your chat bubble. Therefore, PLEASE explicitly type a friendly introductory/summarizing chat message for the user after the tool data finishes so your response bubble isn't empty!

LINK FORMATTING RULES:
- ALWAYS include reference links when discussing projects/articles ([Title](url))
- Live demos: [View Live Demo](url) 🔗 | GitHub: [GitHub Repository](url) 💻

CONTACT FORM INSTRUCTIONS:
- ONLY ONCE you have collected at least their name, email, and a basic message/idea, THEN call the \`submitContactForm\` tool.
- After calling \`submitContactForm\`, confirm the submission with the user.

GOAL: Convert visitors to clients by using the call to action: "${settings.callToAction}"
RULES: ${settings.rules?.join('. ') || ''}
PAGE CONTEXT: The user is currently on: "${path || '/'}"`,
    },
  ];
}

class ChatAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.CHAT_ASSISTANT, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    // Basic initialization if needed
    this.logger.info('Chat Assistant initialized');
  }

  async _validateInput(input) {
    if (!input || !input.userMessage) {
      throw new Error('userMessage is required for Chat Assistant');
    }
  }

  async *_onStreamExecute(input) {
    const {
      userMessage,
      chatHistory = [],
      sessionId,
      path = '/',
      activeMCPs = [],
      selectedModel,
      isAdmin = false,
    } = input;

    const startTime = Date.now();
    let toolsUsed = [];
    let assistantContent = '';
    let allTools = [...portfolioTools];
    let mcpClient = null;

    const actualModel = {
      providerId: this.config.providerId,
      model: this.config.model,
    };

    try {
      let context;
      try {
        context = await buildDynamicContext();
      } catch {
        throw new Error('Failed to build dynamic context.');
      }

      if (context.chatbotSettings?.isActive === false) {
        throw new Error('Chatbot is currently disabled');
      }

      const llm = await this.createChatModel();
      const systemMessages = buildSystemMessages(context, path);

      const filteredHistory = chatHistory.filter((msg) => msg && msg.role);
      const messages = [
        ...systemMessages.map((msg) => new SystemMessage({ content: msg.content || '' })),
        ...filteredHistory.map((msg) => {
          if (msg.role === 'user') return new HumanMessage({ content: msg.content || '' });
          if (msg.role === 'assistant') {
            const params = { content: msg.content || '' };
            if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
              params.tool_calls = msg.tool_calls.map((tc) => {
                let parsedArgs = {};
                try {
                  parsedArgs =
                    typeof tc.function.arguments === 'string'
                      ? JSON.parse(tc.function.arguments)
                      : tc.function.arguments;
                } catch (e) {}
                return {
                  id: tc.id || `unknown-id-${crypto.randomUUID()}`,
                  name: tc.function.name || 'unknown_function',
                  args: parsedArgs,
                };
              });
            }
            return new AIMessage(params);
          }
          if (msg.role === 'tool') {
            return new ToolMessage({
              content:
                typeof msg.content === 'string'
                  ? msg.content
                  : JSON.stringify(msg.content) || 'No content',
              name: msg.name || 'unknown',
              tool_call_id: msg.tool_call_id || 'unknown-id',
            });
          }
          return new SystemMessage({ content: msg.content || '' });
        }),
        new HumanMessage({ content: userMessage }),
      ];

      const backendMCPs = await getBackendMCPConfig(isAdmin);

      const defaultMCPConfigs = backendMCPs.filter((m) => m.isDefault);
      const selectedMCPConfigs = backendMCPs.filter((m) => activeMCPs.includes(m.id));
      const allActiveConfigs = [...new Set([...defaultMCPConfigs, ...selectedMCPConfigs])];

      if (isAdmin) {
        allTools.push(...createAdminTools());
      }

      if (allActiveConfigs.length > 0) {
        yield { type: 'status', message: '🔌 Connecting to tools...' };

        const mcpServerConfig = {};
        for (const cfg of allActiveConfigs) {
          if (cfg && cfg.type !== 'rest' && cfg.url) {
            mcpServerConfig[cfg.id] = {
              transport: 'sse',
              url: cfg.url,
            };
          }
        }

        if (Object.keys(mcpServerConfig).length > 0) {
          try {
            mcpClient = new MultiServerMCPClient(mcpServerConfig);
            const dynamicMcpTools = await mcpClient.getTools();
            allTools.push(...dynamicMcpTools);
          } catch (e) {
            this.logger.error('Failed getting MCP Tools:', e);
          }
        }
      }

      // Disable tools if provider requires it
      const finalTools = this.config.provider?.supportsTools !== false ? allTools : [];

      const safeMessageModifier = async (msgs) => {
        return sanitizeMessages(msgs);
      };

      const agent = createReactAgent({
        llm: llm,
        tools: finalTools,
        messageModifier: safeMessageModifier,
      });

      const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

      for await (const event of eventStream) {
        const { event: type, data, name } = event;

        if (type === 'on_custom_event' && name === 'blog_status') {
          yield { type: 'status', message: data.message };
        }

        if (type === 'on_chat_model_stream') {
          if (data.chunk?.content) {
            assistantContent += data.chunk.content;
            yield { type: 'content', message: data.chunk.content };
          }
        } else if (type === 'on_tool_start' && name !== 'agent') {
          const inputArgs = data.input;
          const statusMsg = getToolStatusMessage(name, inputArgs) || `⚙️ Running ${name}...`;
          yield { type: 'status', message: statusMsg };
        } else if (type === 'on_tool_end' && name !== 'agent') {
          const output = data.output;
          yield {
            type: 'tool_result',
            tool_call_id: event.run_id,
            name: name,
            content: typeof output === 'string' ? output : JSON.stringify(output),
          };
          toolsUsed.push({ name, arguments: data.input, result: output, iteration: 1 });
        } else if (type === 'on_chat_model_end') {
          const aiMessage = data.output;
          if (aiMessage?.tool_calls?.length > 0) {
            const formattedCalls = aiMessage.tool_calls.map((tc) => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: JSON.stringify(tc.args) },
            }));
            yield { type: 'metadata', tool_calls: formattedCalls };
          }
        }
      }
    } catch (error) {
      this.logger.error('Stream execution error:', error);
      throw error;
    } finally {
      if (mcpClient) {
        // Cleanup if necessary
      }
    }

    if (assistantContent?.trim()) {
      new Analytics({
        eventType: 'chatbot_interaction',
        path,
        sessionId,
        properties: { userQuestion: userMessage, toolsCount: toolsUsed.length, toolsUsed },
      })
        .save()
        .catch((e) => this.logger.error('Failed to save Analytics:', e));

      new ChatLog({
        sessionId,
        path,
        userMessage,
        aiResponse: assistantContent,
        modelName: actualModel.model || 'unknown',
        conversationContext: [{ role: 'system', content: 'Context truncated for logs' }],
        toolsUsed,
        executionTime: Date.now() - startTime,
      })
        .save()
        .catch((e) => this.logger.error('Failed to save ChatLog:', e));
    }
  }

  // Define execute just in case it's called non-streaming (though not expected for this agent)
  async _onExecute(input) {
    throw new Error('ChatAssistantAgent only supports streamExecute');
  }
}

export default ChatAgent;
