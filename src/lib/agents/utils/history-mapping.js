/**
 * @fileoverview Shared chat-history → LangChain message mapping for the streaming agents.
 *
 * The client flattens a whole assistant turn (tool call + eventual final reply) into a
 * single history entry carrying both `tool_calls` and `content`. That's not the shape the
 * model actually produced — it emitted the tool call as one turn with empty text, then
 * answered in a separate turn once the tool result came back. Replaying the flattened,
 * single-turn version confuses some providers: Gemini (via @langchain/google) returns an
 * empty completion (finishReason STOP, 0 output tokens) on the next turn when handed an
 * AIMessage that mixes tool_calls with non-empty content. Splitting it back into the two
 * turns the model actually emitted fixes this.
 */

import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';

function parseToolCalls(toolCalls, logger) {
  return toolCalls.map((tc) => {
    let parsedArgs = {};
    try {
      parsedArgs =
        typeof tc.function.arguments === 'string'
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments;
    } catch (e) {
      logger?.error?.('Failed to parse tool arguments in chat history:', e);
    }
    return {
      id: tc.id || `unknown-id-${Math.random()}`,
      name: tc.function.name || 'unknown_function',
      args: parsedArgs,
    };
  });
}

/**
 * Converts one client-side chat history entry into the one or two LangChain
 * messages it actually corresponds to.
 * @param {Object} msg - history entry ({ role, content, tool_calls?, tool_call_id?, name? })
 * @param {Object} [options]
 * @param {Object} [options.logger] - logger with an `.error()` method for parse failures
 * @param {string} [options.idPrefix] - base id to stamp onto the produced message(s)
 * @returns {Array} one or two LangChain message instances
 */
export function mapHistoryEntryToMessages(msg, { logger, idPrefix } = {}) {
  if (msg.role === 'user') {
    return [new HumanMessage({ content: msg.content || '', ...(idPrefix && { id: idPrefix }) })];
  }

  if (msg.role === 'assistant') {
    const hasToolCalls = Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0;
    const hasContent = Boolean(msg.content);
    const toolCalls = hasToolCalls ? parseToolCalls(msg.tool_calls, logger) : undefined;

    if (hasToolCalls && hasContent) {
      // Replay as the two separate turns the model actually generated.
      return [
        new AIMessage({
          content: '',
          tool_calls: toolCalls,
          ...(idPrefix && { id: `${idPrefix}-call` }),
        }),
        new AIMessage({ content: msg.content, ...(idPrefix && { id: idPrefix }) }),
      ];
    }

    return [
      new AIMessage({
        content: msg.content || '',
        ...(toolCalls && { tool_calls: toolCalls }),
        ...(idPrefix && { id: idPrefix }),
      }),
    ];
  }

  if (msg.role === 'tool') {
    return [
      new ToolMessage({
        content:
          typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content) || 'No content',
        name: msg.name || 'unknown',
        tool_call_id: msg.tool_call_id || 'unknown-id',
        ...(idPrefix && { id: idPrefix }),
      }),
    ];
  }

  return [new SystemMessage({ content: msg.content || '', ...(idPrefix && { id: idPrefix }) })];
}
