import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import {
  getUserQdrantClient,
  ensureUserCollection,
  generateEmbedding,
} from '@/lib/memoscribe-qdrant';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import {
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

export class MemoscribeAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.MEMOSCRIBE_AGENT, config = {}) {
    super(agentId, config);
  }

  getTools(params = {}) {
    return [
      tool(
        async ({ query }) => {
          try {
            if (!params.userId) {
              return JSON.stringify({ error: 'User ID is required to search memos.' });
            }

            const qdrantClient = await getUserQdrantClient(params.userId);
            if (!qdrantClient) {
              return JSON.stringify({
                error: 'Qdrant is not configured. Please configure it in the Settings tab.',
              });
            }

            const collectionName = await ensureUserCollection(qdrantClient);
            const vector = await generateEmbedding(query);

            const searchResults = await qdrantClient.search(collectionName, {
              vector: vector,
              limit: 5,
              filter: {
                must: [
                  {
                    key: 'userId',
                    match: {
                      value: params.userId,
                    },
                  },
                ],
              },
            });

            const formattedResults = searchResults.map((res) => ({
              score: res.score,
              title: res.payload.title,
              description: res.payload.description,
              text: res.payload.text,
            }));

            return JSON.stringify({ results: formattedResults });
          } catch (error) {
            this.logger.error('Error in search_memos tool:', error);
            return JSON.stringify({ error: 'Failed to search memos: ' + error.message });
          }
        },
        {
          name: 'search_memos',
          description:
            "Search the user's saved notes/memos for relevant information based on a semantic query.",
          schema: z.object({
            query: z.string().describe('The search query or question to find relevant notes for.'),
          }),
        }
      ),
    ];
  }

  async _onExecute(input) {
    // For simplicity, we just use the stream version and collect results
    let finalContent = '';
    for await (const chunk of this._onStreamExecute(input)) {
      if (chunk.type === 'content') {
        finalContent += chunk.message;
      }
    }
    return { content: finalContent };
  }

  async *_onStreamExecute(input) {
    const { userMessage, chatHistory = [], userId } = input;

    const llm = await this.createChatModel();
    const tools = this.getTools({ userId });

    const messages = [
      new SystemMessage(
        "You are Memo Scribe AI, a helpful assistant that helps users manage and query their personal notes and memos. Use the 'search_memos' tool to find relevant information from the user's saved content when asked a question. If no relevant information is found, inform the user clearly."
      ),
      ...chatHistory.map((msg) => {
        if (msg.role === 'user') return new HumanMessage({ content: msg.content || '' });
        if (msg.role === 'assistant') return new AIMessage({ content: msg.content || '' });
        return new SystemMessage({ content: msg.content || '' });
      }),
      new HumanMessage({ content: userMessage }),
    ];

    const agent = createReactAgent({
      llm,
      tools,
      messageModifier: async (msgs) => sanitizeMessages(msgs),
    });

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

    for await (const event of eventStream) {
      const { event: type, data, name } = event;

      if (type === 'on_chat_model_stream') {
        if (data.chunk?.content) {
          yield { type: 'content', message: data.chunk.content };
        }
      } else if (type === 'on_tool_start' && name !== 'agent') {
        yield { type: 'tool_start', tool: name, input: data.input };
      } else if (type === 'on_tool_end' && name !== 'agent') {
        const output = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
        yield {
          type: 'tool_result',
          tool_call_id: event.run_id,
          name: name,
          content: output,
        };

        // If this was a search_memos tool, also yield a UI block
        if (name === 'search_memos') {
          try {
            const results = JSON.parse(output);
            if (results && results.results && results.results.length > 0) {
              yield {
                type: 'ui_block',
                block: {
                  kind: 'search_results',
                  data: results.results,
                },
              };
            }
          } catch (e) {
            this.logger.error('Failed to parse tool output for UI block:', e);
          }
        }
      }
    }
  }
}

export const memoscribeAgent = new MemoscribeAgent();
