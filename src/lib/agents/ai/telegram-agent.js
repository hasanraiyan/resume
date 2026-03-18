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
import { StateGraph, START, END, Annotation, messagesStateReducer } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import mongoose from 'mongoose';
import {
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
  AIMessage,
  ToolMessage,
  RemoveMessage,
} from '@langchain/core/messages';
import LongTermMemoryService from '../memory/LongTermMemoryService';

const StateAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  summary: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
});

// Filter out AIMessageChunk messages - they don't have .role and cause trimMessages to fail
function sanitizeMessages(messages) {
  return messages.filter((msg) => !(msg instanceof AIMessageChunk));
}

function getThreadStateApp(checkpointer) {
  return new StateGraph(StateAnnotation)
    .addNode('summarize', async () => ({}))
    .addNode('agent', async () => ({}))
    .addNode('tools', async () => ({}))
    .addEdge(START, 'agent')
    .addEdge('agent', 'summarize')
    .addEdge('summarize', 'tools')
    .addEdge('tools', END)
    .compile({ checkpointer });
}

function truncateTelegramDebugOutput(text, maxLength = 3800) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 32)}\n\n... output truncated ...`;
}

function formatLongTermMemoryReport(longTermSnapshot) {
  const profile = longTermSnapshot?.profile || null;
  const longTermEntries = Array.isArray(longTermSnapshot?.entries) ? longTermSnapshot.entries : [];

  if (!longTermSnapshot?.config?.enabled) {
    return (
      'Long-term memory is disabled.\n\n' +
      'Enable it here:\n' +
      '/admin/agents -> Telegram Assistant -> Engine -> Long-Term Memory\n\n' +
      'Turn it on and save the agent configuration.'
    );
  }

  if (!longTermSnapshot?.namespaceKey) {
    return 'Long-term memory is not available for this chat. It only works in Telegram private chats.';
  }

  const lines = ['Long-Term Memory', `Profile summary: ${profile?.summary || '(empty)'}`];

  const profileLists = [
    ['Facts', profile?.facts || []],
    ['Preferences', profile?.preferences || []],
    ['Goals', profile?.goals || []],
    ['Constraints', profile?.constraints || []],
    ['Topics', profile?.topics || []],
  ];

  profileLists.forEach(([label, values]) => {
    lines.push(`${label}: ${values.length > 0 ? values.join('; ') : '(empty)'}`);
  });

  if (longTermEntries.length === 0) {
    lines.push('Entries: (empty)');
  } else {
    lines.push('Entries:');
    longTermEntries.forEach((entry, index) => {
      lines.push(
        `${index + 1}. [${entry.category}] ${entry.content} (salience: ${entry.salience}, mentions: ${entry.mentionCount})`
      );
    });
  }

  return truncateTelegramDebugOutput(lines.join('\n'));
}

class TelegramAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.TELEGRAM_ASSISTANT, config = {}) {
    super(agentId, config);
    this.longTermMemoryService = new LongTermMemoryService({ logger: this.logger });
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
      memoryContext = {},
    } = input;
    const resolvedMemoryContext = {
      platform: 'telegram',
      ...memoryContext,
    };
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
    const summaryModel = {
      providerId: this.config.summaryProviderId || this.config.providerId || '',
      model: this.config.summaryModel || this.config.model || '',
    };

    try {
      const llm = await this.createChatModel();
      const summaryLlm = await this.createSummaryChatModel({ temperature: 0.2 });
      this.logger.info(
        `Summary engine ready. Provider: ${summaryModel.providerId || 'default'}, Model: ${summaryModel.model || 'provider-default'}`
      );

      // Persona is purely driven from the UI config. If empty, fallback to a basic assistant.
      const persona = this.config.persona || 'You are a helpful assistant on Telegram.';

      const filteredHistory = chatHistory.filter((msg) => msg && msg.role);
      const mappedHistory = filteredHistory.map((msg, idx) => {
        const id = msg.id || `historic-${idx}-${Math.random()}`;
        if (msg.role === 'user') return new HumanMessage({ content: msg.content || '', id });
        if (msg.role === 'assistant') {
          const params = { content: msg.content || '', id };
          if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
            params.tool_calls = msg.tool_calls.map((tc) => {
              let parsedArgs = {};
              try {
                parsedArgs =
                  typeof tc.function.arguments === 'string'
                    ? JSON.parse(tc.function.arguments)
                    : tc.function.arguments;
              } catch (e) {
                this.logger.error('Failed to parse tool arguments in chat history:', e);
              }
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
            id,
          });
        }
        return new SystemMessage({ content: msg.content || '', id });
      });

      // Load MCP tools strictly based on activeMCPs
      const backendMCPs = await getBackendMCPConfig(isAdmin);
      // We do not auto-include default MCPs here to keep it strictly UI-driven
      const selectedMCPConfigs = backendMCPs.filter((m) => activeMCPs.includes(m.id));

      console.log(
        'activeMCPs names:',
        selectedMCPConfigs.map((m) => m.name)
      );

      if (selectedMCPConfigs.length > 0) {
        yield { type: 'status', message: '🔌 Connecting to tools...' };

        const mcpServerConfig = {};
        for (const cfg of selectedMCPConfigs) {
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

      const finalTools = this.config.provider?.supportsTools !== false ? allTools : [];

      this.logger.info(
        `Tools passed to AI: ${finalTools.length}, Names: [${finalTools.map((t) => t.name).join(', ')}]`
      );

      // Initialize MongoDBSaver using existing mongoose connection
      const mongoClient = mongoose.connection.getClient();
      const checkpointer = new MongoDBSaver({
        client: mongoClient,
        dbName: mongoose.connection.name,
      });

      const adminCommands = ['/start', '/help', '/new', '/clear', '/memory', '/resetmemory'];

      const isCommand = adminCommands.includes(userMessage.trim().toLowerCase());

      if (isCommand) {
        const cmd = userMessage.trim().toLowerCase();
        if (cmd === '/start') {
          yield {
            type: 'content',
            message: 'Hi there! I am your AI assistant. Type /help to see what I can do for you!',
          };
          return;
        }
        if (cmd === '/help') {
          yield {
            type: 'content',
            message:
              'Here are the commands you can use:\n/new or /clear - Start a fresh conversation and clear memory.\n/memory - Show the stored long-term memory for this chat.\n/resetmemory - Delete the stored long-term memory for this chat.\n/help - Show this message.',
          };
          return;
        }
        if (cmd === '/memory') {
          try {
            const longTermSnapshot = await this.longTermMemoryService.getDebugSnapshot({
              metadata: this.config.metadata,
              memoryContext: resolvedMemoryContext,
            });

            yield {
              type: 'content',
              message: formatLongTermMemoryReport(longTermSnapshot),
            };
          } catch (memoryDebugError) {
            this.logger.error('Failed to build /memory snapshot:', memoryDebugError);
            yield {
              type: 'content',
              message: 'Unable to load memory snapshot right now.',
            };
          }
          return;
        }
        if (cmd === '/resetmemory') {
          try {
            const resetResult = await this.longTermMemoryService.resetMemory({
              metadata: this.config.metadata,
              memoryContext: resolvedMemoryContext,
            });

            if (!resetResult.namespaceKey) {
              yield {
                type: 'content',
                message: 'Long-term memory reset is only available in Telegram private chats.',
              };
            } else if (!resetResult.deletedProfile && resetResult.deletedEntries === 0) {
              yield {
                type: 'content',
                message: 'No stored long-term memory was found for this chat.',
              };
            } else {
              this.logger.info(
                `Long-term memory reset. Session: ${sessionId}, Namespace: ${resetResult.namespaceKey}, Deleted profile: ${resetResult.deletedProfile}, Deleted entries: ${resetResult.deletedEntries}`
              );
              yield {
                type: 'content',
                message: 'Long-term memory cleared for this chat.',
              };
            }
          } catch (resetError) {
            this.logger.error('Failed to reset long-term memory:', resetError);
            yield {
              type: 'content',
              message: 'Unable to clear long-term memory right now.',
            };
          }
          return;
        }
        if (cmd === '/new' || cmd === '/clear') {
          // Delete from DB ChatLog
          await ChatLog.deleteMany({ sessionId });

          // Clear global memory graph state for this thread
          const config = { configurable: { thread_id: sessionId } };

          try {
            const app = getThreadStateApp(checkpointer);
            const currentState = await app.getState(config);

            if (currentState?.values?.messages?.length > 0) {
              const deleteMessages = currentState.values.messages.map(
                (m) => new RemoveMessage({ id: m.id || m.id_ })
              );
              await app.updateState(config, { messages: deleteMessages, summary: '' });
            }
          } catch (e) {
            this.logger.error('Failed to clear MongoDBSaver state:', e);
          }

          yield { type: 'content', message: 'Context cleared. Starting a fresh conversation!' };
          return;
        }
      }

      let recalledMemory = {
        enabled: false,
        config: null,
        namespaceKey: '',
        profile: null,
        entries: [],
      };
      try {
        recalledMemory = await this.longTermMemoryService.recall({
          metadata: this.config.metadata,
          memoryContext: resolvedMemoryContext,
          userMessage,
        });
        if (recalledMemory.enabled) {
          this.logger.info(
            `Long-term memory recall completed. Namespace: ${recalledMemory.namespaceKey}, Profile loaded: ${Boolean(recalledMemory.profile?.summary || recalledMemory.profile?.facts?.length || recalledMemory.profile?.preferences?.length || recalledMemory.profile?.goals?.length || recalledMemory.profile?.constraints?.length || recalledMemory.profile?.topics?.length)}, Entries loaded: ${recalledMemory.entries.length}`
          );
        }
      } catch (memoryError) {
        this.logger.error('Failed to recall long-term memory:', memoryError);
      }
      const longTermMemoryContext = this.longTermMemoryService.formatForPrompt(recalledMemory);

      const llmWithTools = finalTools.length > 0 ? llm.bindTools(finalTools) : llm;

      const summarizeConversation = async (state) => {
        const { messages, summary } = state;
        const nonSystemMessages = messages.filter((m) => m._getType() !== 'system');
        if (nonSystemMessages.length <= 5) {
          return { messages: [] };
        }

        const messagesToSummarize = nonSystemMessages.slice(0, nonSystemMessages.length - 5);
        this.logger.info(
          `Summary engine invoked. Session: ${sessionId}, Messages to summarize: ${messagesToSummarize.length}, Existing summary: ${summary ? 'yes' : 'no'}`
        );
        let summaryStr = summary || '';
        let summaryPrompt = `Distill the following chat messages into a single concise summary. Include any key facts, names, or context.`;
        if (summaryStr) {
          summaryPrompt += `\n\nExisting summary: ${summaryStr}`;
        }

        const res = await summaryLlm.invoke([
          new SystemMessage({ content: summaryPrompt }),
          ...messagesToSummarize,
        ]);
        this.logger.info(
          `Summary engine completed. Session: ${sessionId}, Summary length: ${String(res.content || '').length}`
        );

        const deleteMessages = messagesToSummarize.map(
          (m) => new RemoveMessage({ id: m.id || m.id_ })
        );

        return {
          summary: res.content,
          messages: deleteMessages,
        };
      };

      const callModel = async (state) => {
        const { messages, summary } = state;
        let combinedSystemContent = persona;

        if (longTermMemoryContext) {
          combinedSystemContent += `\n\n${longTermMemoryContext}`;
        }

        if (summary) {
          combinedSystemContent += `\n\nSummary of previous conversation:\n${summary}`;
        }

        const sysMessage = new SystemMessage({ content: combinedSystemContent });

        const currentMessages = messages.filter((m) => m._getType() !== 'system');

        const response = await llmWithTools.invoke([sysMessage, ...currentMessages]);
        return { messages: [response] };
      };

      const shouldContinue = (state) => {
        const { messages } = state;
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
          return 'tools';
        }
        return 'summarize';
      };

      const workflow = new StateGraph(StateAnnotation)
        .addNode('summarize', summarizeConversation)
        .addNode('agent', callModel)
        .addEdge(START, 'agent');

      if (finalTools.length > 0) {
        const toolNode = new ToolNode(finalTools);
        workflow.addNode('tools', toolNode);
        workflow.addConditionalEdges('agent', shouldContinue, {
          tools: 'tools',
          summarize: 'summarize',
        });
        workflow.addEdge('tools', 'agent');
      } else {
        workflow.addConditionalEdges('agent', shouldContinue, { summarize: 'summarize' });
      }

      workflow.addEdge('summarize', END);

      const app = workflow.compile({ checkpointer });

      const config = { configurable: { thread_id: sessionId } };
      const currentState = await app.getState(config);

      let inputMessages = [];
      const userMsg = new HumanMessage({ content: userMessage, id: `user-${Date.now()}` });

      if (!currentState?.values?.messages || currentState.values.messages.length === 0) {
        inputMessages = [...mappedHistory, userMsg];
      } else {
        inputMessages = [userMsg];
      }

      const eventStream = await app.streamEvents(
        { messages: inputMessages },
        { ...config, version: 'v2' }
      );

      for await (const event of eventStream) {
        const { event: type, data, name, metadata } = event;
        const langgraphNode = metadata?.langgraph_node || '';

        if (type === 'on_chat_model_stream' && langgraphNode === 'agent') {
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
        } else if (type === 'on_chat_model_end' && langgraphNode === 'agent') {
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

      if (assistantContent?.trim()) {
        this.logger.info(
          `Long-term memory extraction queued. Session: ${sessionId}, Namespace: ${recalledMemory.namespaceKey || 'disabled'}, Assistant chars: ${assistantContent.length}`
        );

        void (async () => {
          try {
            const latestState = await app.getState(config);
            const latestThreadSummary = latestState?.values?.summary || '';
            this.logger.info(
              `Long-term memory extraction started. Session: ${sessionId}, Namespace: ${recalledMemory.namespaceKey || 'disabled'}, Thread summary chars: ${latestThreadSummary.length}`
            );

            const persistenceResult = await this.longTermMemoryService.extractAndPersist({
              metadata: this.config.metadata,
              memoryContext: resolvedMemoryContext,
              userMessage,
              assistantMessage: assistantContent,
              threadSummary: latestThreadSummary,
              llm: summaryLlm,
            });

            if (persistenceResult.enabled) {
              this.logger.info(
                `Long-term memory updated. Session: ${sessionId}, Namespace: ${recalledMemory.namespaceKey}, Profile updated: ${persistenceResult.profileUpdated}, Entries upserted: ${persistenceResult.entriesUpserted}, Entries pruned: ${persistenceResult.entriesPruned}`
              );
            }
          } catch (memoryError) {
            this.logger.error('Failed to persist long-term memory:', memoryError);
          }
        })();
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
