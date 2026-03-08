/**
 * Telegram Assistant Agent
 *
 * Dedicated agent for handling Telegram interactions using LangGraph.
 * Pure React Agent base, entirely driven by UI configuration (Persona & MCP Tools).
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import Analytics from '@/models/Analytics';
import ChatLog from '@/models/ChatLog';
import { getBackendMCPConfig } from '@/lib/mcpConfig';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import {
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
  AIMessage,
  ToolMessage,
} from '@langchain/core/messages';

// Filter out AIMessageChunk messages - they don't have .role and cause trimMessages to fail
function sanitizeMessages(messages) {
  return messages.filter((msg) => !(msg instanceof AIMessageChunk));
}

class TelegramAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.TELEGRAM_ASSISTANT, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Telegram Assistant initialized');
  }

  async _validateInput(input) {
    if (!input || !input.userMessage) {
      throw new Error('userMessage is required for Telegram Assistant');
    }
  }

  async *_onStreamExecute(input) {
    const {
      userMessage,
      chatHistory = [],
      sessionId,
      activeMCPs: inputMCPs,
      isAdmin = false,
    } = input;
    const activeMCPs = inputMCPs || this.config.activeMCPs || [];

    const startTime = Date.now();
    let toolsUsed = [];
    let assistantContent = '';
    let allTools = [];
    let mcpClient = null;

    const actualModel = {
      providerId: this.config.providerId,
      model: this.config.model,
    };

    try {
      const llm = await this.createChatModel();

      // Persona is purely driven from the UI config. If empty, fallback to a basic assistant.
      const persona = this.config.persona || 'You are a helpful assistant on Telegram.';
      const systemMessages = [new SystemMessage({ content: persona })];

      const filteredHistory = chatHistory.filter((msg) => msg && msg.role);
      const messages = [
        ...systemMessages,
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
                  id: tc.id || `unknown-id-${Math.random()}`,
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

      // Load MCP tools strictly based on activeMCPs
      const backendMCPs = await getBackendMCPConfig(isAdmin);
      // We do not auto-include default MCPs here to keep it strictly UI-driven
      const selectedMCPConfigs = backendMCPs.filter((m) => activeMCPs.includes(m.id));

      if (selectedMCPConfigs.length > 0) {
        yield { type: 'status', message: '🔌 Connecting to tools...' };

        const mcpServerConfig = {};
        for (const cfg of selectedMCPConfigs) {
          if (cfg && cfg.type !== 'rest' && cfg.url) {
            mcpServerConfig[cfg.id] = {
              transport: cfg.type === 'http' ? 'http' : 'sse',
              headers: cfg.type === 'http' ? cfg.headers || {} : undefined,
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

      const finalTools = this.config.provider?.supportsTools !== false ? allTools : [];

      this.logger.info(
        `Tools passed to AI: ${finalTools.length}, Names: [${finalTools.map((t) => t.name).join(', ')}]`
      );

      const safeMessageModifier = async (msgs) => sanitizeMessages(msgs);

      const agent = createReactAgent({
        llm: llm,
        tools: finalTools,
        messageModifier: safeMessageModifier,
      });

      const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

      for await (const event of eventStream) {
        const { event: type, data, name } = event;

        if (type === 'on_chat_model_stream') {
          if (data.chunk?.content) {
            assistantContent += data.chunk.content;
            yield { type: 'content', message: data.chunk.content };
          }
        } else if (type === 'on_tool_start' && name !== 'agent') {
          yield { type: 'status', message: `⚙️ Running ${name}...` };
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
        // MultiServerMCPClient currently doesn't require explicit cleanup in this context,
        // but leaving space here in case adapter API changes.
      }
    }

    if (assistantContent?.trim()) {
      new Analytics({
        eventType: 'telegram_interaction',
        path: 'telegram',
        sessionId,
        properties: { userQuestion: userMessage, toolsCount: toolsUsed.length, toolsUsed },
      })
        .save()
        .catch((e) => this.logger.error('Failed to save Analytics:', e));

      new ChatLog({
        sessionId,
        path: 'telegram',
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

  async _onExecute(input) {
    throw new Error('TelegramAgent only supports streamExecute');
  }
}

export default TelegramAgent;
