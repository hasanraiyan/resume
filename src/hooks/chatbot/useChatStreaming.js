import { useState, useCallback } from 'react';
import getAnalytics from '@/lib/analytics';

function parseToolFromStatus(statusMsg) {
  if (!statusMsg) return null;
  if (statusMsg.includes('Loading all projects')) return 'listAllProjects';
  if (statusMsg.includes('project details')) return 'getProjectDetails';
  if (statusMsg.includes('blog articles')) return 'listAllArticles';
  if (statusMsg.includes('Reading')) return 'getArticleDetails';
  if (statusMsg.includes('Searching')) {
    if (statusMsg.includes('internet')) return 'search_the_internet';
    return 'searchPortfolio';
  }
  if (statusMsg.includes('Drafting contact form')) return 'draftContactLead';
  return null;
}

import { FileText, FolderOpen, BookOpen, Search, Globe, Wrench } from 'lucide-react';

function getToolMetadata(toolName, content) {
  // Parse args from status message content if needed
  const queryMatch = content?.match(/"([^"]+)"/);
  const extracted = queryMatch ? queryMatch[1] : '';

  switch (toolName) {
    case 'listAllProjects':
      return { label: 'Loading all projects', Icon: FolderOpen };
    case 'getProjectDetails':
      return {
        label: extracted ? `Getting details for "${extracted}"` : 'Getting project details',
        Icon: FileText,
      };
    case 'listAllArticles':
      return { label: 'Loading all articles', Icon: BookOpen };
    case 'getArticleDetails':
      return { label: 'Reading article', Icon: FileText };
    case 'searchPortfolio':
      return {
        label: extracted ? `Searching for "${extracted}"` : 'Searching portfolio',
        Icon: Search,
      };
    case 'search_the_internet':
      return {
        label: extracted ? `Searching the internet for "${extracted}"` : 'Searching the internet',
        Icon: Globe,
      };
    case 'draftContactLead':
      return { label: 'Drafting contact form', Icon: FileText };
    default:
      return { label: content || 'Processing', Icon: Wrench };
  }
}

export function useChatStreaming() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const streamChatResponse = async ({
    content,
    history,
    setMessages,
    setStatus,
    activeMCPs = [],
    selectedAgentId,
  }) => {
    const analytics = getAnalytics();
    console.log('[useChatStreaming] Raw history:', history);

    const chatHistory = history
      .filter((msg) => {
        const isValid = msg && msg.role !== 'system' && msg.role !== 'tool_action';
        console.log('[useChatStreaming] Filter check:', { msg: msg?.role, isValid });
        return isValid;
      })
      .map((msg) => {
        if (!msg) {
          console.log('[useChatStreaming] NULL message encountered!');
          return null;
        }
        const m = { role: msg.role, content: msg.content };
        if (msg.tool_calls) m.tool_calls = msg.tool_calls;
        if (msg.tool_call_id) m.tool_call_id = msg.tool_call_id;
        if (msg.name) m.name = msg.name;
        console.log('[useChatStreaming] Mapped message:', m);
        return m;
      })
      .filter(Boolean);

    console.log('[useChatStreaming] Final chatHistory to send:', chatHistory);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage: content,
        chatHistory,
        sessionId: analytics.sessionId,
        path: window.location.pathname,
        activeMCPs: activeMCPs, // Pass array of IDs directly
        agentId: selectedAgentId,
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const assistantMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      steps: [], // interleaved list of tool actions and UI blocks
      timestamp: new Date(),
      agentId: selectedAgentId, // Track which agent is responding
    };
    let messageAdded = false;
    let buffer = '';
    // Track the currently-active tool_action message id
    let activeToolMsgId = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          let data;
          try {
            data = JSON.parse(line);
          } catch {
            // Skip raw text for blog_writer agent
            if (selectedAgentId === 'blog_writer') {
              continue;
            }
            // Raw text fallback for other agents
            assistantMessage.content += line;
            if (!messageAdded) {
              setMessages((prev) => [
                ...prev,
                { ...assistantMessage, steps: [...assistantMessage.steps] },
              ]);
              messageAdded = true;
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id ? { ...m, content: assistantMessage.content } : m
                )
              );
            }
            continue;
          }

          // Skip progress events - blog_writer runs silently
          if (data.type === 'progress') {
            continue;
          }

          if (data.type === 'status' || data.type === 'node_status') {
            // Skip tool actions for blog_writer agent (only show progress)
            if (assistantMessage.agentId === 'blog_writer') {
              continue;
            }

            // Detect which tool this is
            const toolName = parseToolFromStatus(data.message);
            const { label, Icon } = getToolMetadata(toolName, data.message);

            // ✅ Mark the PREVIOUS tool as done before starting the next one
            if (activeToolMsgId !== null) {
              // Update local assistantMessage too
              assistantMessage.steps = assistantMessage.steps.map((s) =>
                s.id === activeToolMsgId ? { ...s, done: true } : s
              );

              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id === activeToolMsgId) {
                    return { ...m, done: true };
                  }
                  // Also mark as done in assistant message steps
                  if (m.role === 'assistant' && m.steps) {
                    return {
                      ...m,
                      steps: m.steps.map((s) =>
                        s.id === activeToolMsgId ? { ...s, done: true } : s
                      ),
                    };
                  }
                  return m;
                })
              );
            }

            // Only add tool steps for non-blog_writer agents
            if (selectedAgentId !== 'blog_writer') {
              const toolMsgId = Date.now() + Math.random();
              activeToolMsgId = toolMsgId;

              setMessages((prev) => [
                ...prev,
                {
                  id: toolMsgId,
                  role: 'tool_action',
                  toolName, // Track the machine name for later
                  label,
                  Icon,
                  done: false,
                  timestamp: new Date(),
                },
              ]);

              // Save metadata into ordered steps
              assistantMessage.steps.push({
                type: 'tool',
                id: toolMsgId,
                label,
                Icon,
                done: false,
              });
            }
            // Save tool_calls to the assistant message so it can be sent in history later
            if (!assistantMessage.tool_calls) {
              assistantMessage.tool_calls = [];
            }
            // Overwrite incoming tool calls to support multi-turn in LangGraph
            // Langgraph sends the full list of tool calls for that specific AIMessage at the end of the generation step.
            if (data.tool_calls) {
              assistantMessage.tool_calls = data.tool_calls;
            }

            if (messageAdded) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, tool_calls: assistantMessage.tool_calls }
                    : m
                )
              );
            } else {
              // Ensure we actually add this turn to the history state immediately
              setMessages((prev) => [...prev, { ...assistantMessage }]);
              messageAdded = true;
            }
          } else if (data.type === 'tool_result') {
            // Add the tool result to history (hidden from UI but present for next turn)
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                role: 'tool',
                tool_call_id: data.tool_call_id,
                name: data.name,
                content: data.content,
                hidden: true,
              },
            ]);
          } else if (data.type === 'content') {
            setStatus('');

            // ✅ Fix: mark ALL pending tool_action messages as done (not just the last one)
            // Update local assistantMessage too
            assistantMessage.steps = assistantMessage.steps.map((s) =>
              s.type === 'tool' && !s.done ? { ...s, done: true } : s
            );

            setMessages((prev) =>
              prev.map((m) => {
                if (m.role === 'tool_action' && !m.done) {
                  return { ...m, done: true };
                }
                // Also mark all pending tools as done in assistant message steps
                if (m.role === 'assistant' && m.steps) {
                  return {
                    ...m,
                    steps: m.steps.map((s) =>
                      s.type === 'tool' && !s.done ? { ...s, done: true } : s
                    ),
                  };
                }
                return m;
              })
            );
            activeToolMsgId = null;

            // Skip content from blog_writer agent (only show progress UI)
            if (assistantMessage.agentId !== 'blog_writer') {
              assistantMessage.content += data.message;

              if (!messageAdded) {
                setMessages((prev) => [
                  ...prev,
                  { ...assistantMessage, steps: [...assistantMessage.steps] },
                ]);
                messageAdded = true;
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? {
                          ...m,
                          content: assistantMessage.content,
                          steps: [...assistantMessage.steps],
                        }
                      : m
                  )
                );
              }
            } else {
              // For blog_writer, ensure message is added but keep content empty
              if (!messageAdded) {
                setMessages((prev) => [
                  ...prev,
                  { ...assistantMessage, steps: [...assistantMessage.steps] },
                ]);
                messageAdded = true;
              }
            }
          }
        } // end for lines
      } // end while
    } finally {
      setStatus('');
      // ✅ Post-stream cleanup: Mark tool action as done (IF it's not a pending draft)
      if (activeToolMsgId !== null) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === activeToolMsgId) {
              const isDrafting = m.toolName === 'draftContactLead';
              return { ...m, done: !isDrafting };
            }
            if (m.id === assistantMessage.id) {
              return {
                ...m,
                steps: m.steps.map((s) => {
                  if (s.id === activeToolMsgId) {
                    const isDrafting = s.toolName === 'draftContactLead';
                    return { ...s, done: !isDrafting };
                  }
                  return s;
                }),
              };
            }
            return m;
          })
        );
      }
      reader.releaseLock();
    }
  };

  const send = useCallback(
    async (content, activeQuote, activeMCPs, selectedAgentId, hidden = false) => {
      if ((!content.trim() && !activeQuote) || isLoading) return;

      const currentQuote = activeQuote;
      let finalContent = content.trim();

      if (currentQuote) {
        finalContent = `> "${currentQuote.trim()}"\n\n${finalContent}`;
      }

      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: finalContent,
        timestamp: new Date(),
        hidden,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        await streamChatResponse({
          content: userMessage.content,
          history: messages,
          activeMCPs,
          selectedAgentId,
          setMessages,
          setStatus: setStatusMessage,
        });
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'assistant',
            content:
              "⚠️ **Connection Error**\n\nI'm having trouble connecting to the server right now. Please try sending your message again, or reach out directly [via the contact form](#contact).",
            steps: [],
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  return { messages, setMessages, isLoading, statusMessage, send };
}
