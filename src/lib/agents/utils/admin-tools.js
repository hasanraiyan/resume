import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import agentRegistry from '../AgentRegistry';
import { AGENT_IDS } from '../../constants/agents';

// Note: This tool is meant to be executed within a streaming context like chat-assistant-agent.
// It relies on the chat agent handling the resulting `metadata` stream to propagate `status` updates
// from the inner agent back to the client. Since `tool` calls return a string, we return a
// descriptive response, but side-effects (like streaming status) are handled by directly calling
// the registry if we pass a callback, or by the chat agent handling it.
// Wait, the chat agent intercepts `type: 'status'` events. If this tool executes a stream
// we need a way to bubble those events up. In LangChain tools, you can't easily yield events
// unless you use LangChain's internal callback system.
// Alternatively, we can let this tool just START the background process and return immediately,
// OR since the user wants LIVE status updates, the best way is to not make it a standard LangChain tool,
// but rather handle it inside the chat agent's tool execution block.
// However, the instructions state: "Add a new tool in ... admin-tools.js: Name: create_blog ... Logic: Calls agentRegistry.execute"
// Let's create it as a standard tool, and we will update `chat-assistant-agent` to specially handle its stream.

import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch';

export const createAdminTools = () => {
  return [
    tool(
      async ({ topic }) => {
        try {
          const blogAgentId = AGENT_IDS.BLOG_WRITER;
          const blogAgent = agentRegistry.get(blogAgentId);

          if (!blogAgent) {
            return JSON.stringify({ error: `Agent ${blogAgentId} not found.` });
          }

          // Execute as a stream so we can intercept the status updates and dispatch them
          const stream = agentRegistry.streamExecute(blogAgentId, { topic });

          let finalContent = null;

          for await (const event of stream) {
            if (event.type === 'status') {
              // Dispatch custom event to LangGraph/LangChain stream handler
              await dispatchCustomEvent('blog_status', { message: event.message });
            } else if (event.type === 'content') {
              finalContent = event.message;
            }
          }

          return finalContent || `Successfully created blog post draft for topic: ${topic}`;
        } catch (error) {
          console.error('[admin-tools] Error in create_blog:', error);
          return JSON.stringify({ error: error.message });
        }
      },
      {
        name: 'create_blog',
        description:
          'Starts the autonomous blog writing process for a given topic. It researches, writes, generates images, and saves a draft.',
        schema: z.object({
          topic: z.string().describe('The topic for the new blog post.'),
        }),
      }
    ),
  ];
};
