'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  ChevronDown,
  ExternalLink,
  Search,
  FileText,
  FolderOpen,
  BookOpen,
  Wrench,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import getAnalytics from '@/lib/analytics';
import StaticGenUI from './StaticGenUI';

// ---------------------------------------------------------------------------
// Tool metadata — maps tool names to labels + icons
// ---------------------------------------------------------------------------

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
    case 'draftContactLead':
      return { label: 'Drafting contact form', Icon: FileText };
    default:
      return { label: content || 'Processing', Icon: Wrench };
  }
}

// Parse tool name from the emoji status string emitted by getToolStatusMessage
function parseToolFromStatus(statusMsg) {
  if (!statusMsg) return null;
  if (statusMsg.includes('Loading all projects')) return 'listAllProjects';
  if (statusMsg.includes('project details')) return 'getProjectDetails';
  if (statusMsg.includes('blog articles')) return 'listAllArticles';
  if (statusMsg.includes('Reading')) return 'getArticleDetails';
  if (statusMsg.includes('Searching')) return 'searchPortfolio';
  if (statusMsg.includes('Drafting contact form')) return 'draftContactLead';
  return null;
}

// ---------------------------------------------------------------------------
// StepHistory — Perplexity-style collapsible completed-tools summary
// ---------------------------------------------------------------------------

function StepHistory({ steps, onInteract }) {
  const [expanded, setExpanded] = useState(true);
  if (!steps || steps.length === 0) return null;

  const tools = steps.filter((s) => s.type === 'tool');
  const uniqueIcons = [...new Set(tools.map((t) => t.Icon).filter(Boolean))];

  return (
    <div className="flex flex-col w-full mb-3 group/history">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex fit-content items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 transition-all duration-200 w-fit"
      >
        <div className="flex -space-x-1">
          {uniqueIcons.slice(0, 3).map((Icon, idx) => (
            <Icon key={idx} className="w-3.5 h-3.5" />
          ))}
        </div>
        <span className="text-[11px] font-medium">
          Performed {tools.length} action{tools.length > 1 ? 's' : ''}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? '' : 'rotate-180'}`}
        />
      </button>

      {expanded && (
        <div className="mt-2 ml-4 pl-4 border-l-2 border-dashed border-neutral-200 space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
          {steps.map((step, idx) => {
            if (step.type === 'tool') {
              return (
                <div
                  key={`step-${idx}`}
                  className="flex items-center justify-between text-[13px] text-neutral-600"
                >
                  <div className="flex items-center gap-2">
                    {step.Icon && <step.Icon className="w-3.5 h-3.5 text-neutral-400" />}
                    <span>{step.label}</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-neutral-100 text-[10px] font-bold text-neutral-400">
                    {step.done ? 'DONE' : 'RUNNING'}
                  </div>
                </div>
              );
            }
            if (step.type === 'ui') {
              return (
                <div key={`step-${idx}`} className="w-full">
                  <StaticGenUI block={step} onInteract={onInteract} />
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToolCard — shown while a tool is actively running (pending) or just done
// ---------------------------------------------------------------------------

function ToolCard({ label, Icon, pending }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-300 ${
        pending
          ? 'border-neutral-300/80 bg-neutral-50 text-neutral-600'
          : 'border-green-200/80 bg-green-50/80 text-green-700'
      }`}
    >
      <div className="relative shrink-0">
        <Icon className={`w-3.5 h-3.5 ${pending ? 'text-neutral-500' : 'text-green-600'}`} />
        {pending && (
          <span className="absolute inset-0 rounded-full bg-neutral-400 animate-ping opacity-30" />
        )}
      </div>
      <span>{label}</span>
      {!pending && <span className="text-green-500 text-xs">✓</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MdContent — markdown with GFM + syntax-highlighted code blocks
// ---------------------------------------------------------------------------

function CodeBlock({ language, children }) {
  const code = String(children).replace(/\n$/, '');
  const lang = language?.toLowerCase() || 'text';

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-neutral-200 text-[11px]">
      <div className="flex items-center justify-between px-3 py-1 bg-neutral-100 border-b border-neutral-200">
        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
          {lang}
        </span>
      </div>
      <SyntaxHighlighter
        language={lang}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: '8px 12px',
          fontSize: '11px',
          lineHeight: '1.6',
          background: '#fafafa',
          borderRadius: 0,
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function MdContent({ content, onLinkClick }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          if (!inline && match) return <CodeBlock language={match[1]}>{children}</CodeBlock>;
          if (!inline && !match) return <CodeBlock language="text">{children}</CodeBlock>;
          return (
            <code className="bg-black/10 rounded px-1 py-0.5 font-mono text-[10px]" {...props}>
              {children}
            </code>
          );
        },
        a: ({ node, href, children, ...props }) => (
          <a
            {...props}
            href={href}
            className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-2 transition-colors break-words"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => onLinkClick?.(e, href)}
          >
            {children}
            {href?.startsWith('http') && (
              <ExternalLink className="w-2.5 h-2.5 inline-block ml-0.5 mb-0.5 align-middle" />
            )}
          </a>
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => <p className="font-bold text-sm mb-1">{children}</p>,
        h2: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
        h3: ({ children }) => <p className="font-medium mb-1">{children}</p>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-neutral-300 pl-2 italic opacity-70 my-1">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="text-[10px] border-collapse w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-neutral-200 px-2 py-1 bg-neutral-50 font-semibold text-left">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="border border-neutral-200 px-2 py-1">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWelcomeMessage(settings) {
  const name = settings?.aiName || 'Kiro';
  return `Hi! I'm ${name}, Raiyan's AI assistant. I can help you learn about his projects and experience. What would you like to know?`;
}

const DEFAULT_PROMPTS = [
  { text: "Tell me about Raiyan's projects" },
  { text: "What's his tech stack?" },
  { text: 'How can I get in touch?' },
  { text: 'Show me his latest blog post' },
];

// ---------------------------------------------------------------------------
// Core streaming helper
// ---------------------------------------------------------------------------

async function streamChatResponse({ content, history, setMessages, setStatus }) {
  const analytics = getAnalytics();
  const chatHistory = history
    .filter((msg) => msg.role !== 'system' && msg.role !== 'tool_action')
    .map(({ role, content: c }) => ({ role, content: c }));

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userMessage: content,
      chatHistory,
      sessionId: analytics.sessionId,
      path: window.location.pathname,
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
  };
  let messageAdded = false;
  let buffer = '';
  // Track the currently-active tool_action message id
  let activeToolMsgId = null;
  // Accumulate completed tool metadata for this turn
  const turnCompletedTools = [];

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
          // Raw text fallback
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

        if (data.type === 'status' || data.type === 'node_status') {
          // Detect which tool this is
          const toolName = parseToolFromStatus(data.message);
          const { label, Icon } = getToolMetadata(toolName, data.message);

          // If the AI already streamed some text before calling this tool (e.g.
          // "I'll fetch all the available info..."), close that bubble and prepare
          // a fresh one for the post-tool response — avoids merged text.
          if (messageAdded && assistantMessage.content.trim().length > 0) {
            assistantMessage.id = Date.now() + Math.random();
            assistantMessage.content = '';
            assistantMessage.steps = [];
            messageAdded = false;
          }

          // ✅ Mark the PREVIOUS tool as done before starting the next one
          if (activeToolMsgId !== null) {
            setMessages((prev) =>
              prev.map((m) => (m.id === activeToolMsgId ? { ...m, done: true } : m))
            );
          }

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
        } else if (data.type === 'ui') {
          // Add the Generative UI block to the assistant message
          // Prevent duplicates if the exact same block payload is already there
          const isDuplicate = assistantMessage.steps.some(
            (s) =>
              s.type === 'ui' &&
              s.component === data.component &&
              JSON.stringify(s.payload) === JSON.stringify(data.payload)
          );

          if (!isDuplicate) {
            // Attach the current tool action ID to the UI block
            // This allows the UI interaction to mark the tool as 'done' later
            assistantMessage.steps.push({
              type: 'ui',
              ...data,
              toolActionId: activeToolMsgId,
            });
          }

          if (!messageAdded) {
            setMessages((prev) => [
              ...prev,
              {
                ...assistantMessage,
                steps: [...assistantMessage.steps],
              },
            ]);
            messageAdded = true;
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? {
                      ...m,
                      steps: [...assistantMessage.steps],
                    }
                  : m
              )
            );
          }
        } else if (data.type === 'metadata') {
          // Save tool_calls to the assistant message so it can be sent in history later
          assistantMessage.tool_calls = data.tool_calls;
          if (messageAdded) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id ? { ...m, tool_calls: data.tool_calls } : m
              )
            );
          }
        } else if (data.type === 'tool_result') {
          // Add the tool result to history (hidden from UI but present for next turn)
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              role: 'tool',
              tool_call_id: data.tool_call_id,
              content: data.content,
              hidden: true,
            },
          ]);
        } else if (data.type === 'content') {
          setStatus('');

          // ✅ Fix: mark ALL pending tool_action messages as done (not just the last one)
          setMessages((prev) =>
            prev.map((m) => (m.role === 'tool_action' && !m.done ? { ...m, done: true } : m))
          );
          activeToolMsgId = null;

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
}

// ---------------------------------------------------------------------------
// ChatbotWidget component
// ---------------------------------------------------------------------------

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [chatbotSettings, setChatbotSettings] = useState(null);
  const [settingsFetched, setSettingsFetched] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Lazy settings fetch
  const fetchSettings = useCallback(async () => {
    if (settingsFetched) return;
    setSettingsFetched(true);
    try {
      const response = await fetch('/api/admin/chatbot');
      if (response.ok) {
        const settings = await response.json();
        setChatbotSettings(settings);
        if (settings.isActive) {
          setMessages([
            {
              id: 1,
              role: 'assistant',
              content: buildWelcomeMessage(settings),
              steps: [],
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        setChatbotSettings({ isActive: false });
      }
    } catch {
      setChatbotSettings({ isActive: false });
    }
  }, [settingsFetched]);

  const handleOpenChat = useCallback(async () => {
    setIsOpen(true);
    if (!settingsFetched) {
      await fetchSettings();
    }
  }, [fetchSettings, settingsFetched]);

  // Pre-fetch settings on load so the chatbot is ready instantly without a 3-second delay,
  // and so we can hide the FAB button if the chatbot is disabled by the admin.
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const send = useCallback(
    async (content, hidden = false) => {
      if (!content.trim() || isLoading) return;

      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        hidden,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        await streamChatResponse({
          content: userMessage.content,
          history: messages.filter((m) => !m.hidden), // Send all messages (except hidden flag, but content IS sent) to API
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
              "Sorry, I'm having trouble responding right now. However, you can reach out directly via [the contact form](#contact) instead!",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    send(inputMessage);
    setInputMessage('');
  };

  const handlePromptClick = (text) => send(text);

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: buildWelcomeMessage(chatbotSettings),
        steps: [],
        timestamp: new Date(),
      },
    ]);
  };

  const handleLinkClick = (e, href) => {
    const analytics = getAnalytics();
    analytics.trackCustomEvent('reference_link_clicked', window.location.pathname, {
      linkUrl: href,
      linkType: href?.includes('/projects/')
        ? 'project'
        : href?.includes('/blog/')
          ? 'article'
          : 'external',
      chatbotSession: analytics.sessionId,
    });
  };

  const handleUIInteract = (messageId, block, action) => {
    // 1. Remove the active UI block from the assistant's message
    // 2. Add a completed tool summary to the StepHistory
    let label = 'Interacted with form';
    if (action === 'sent') label = 'Sent contact message';
    if (action === 'edit') label = 'Prefilled contact form';
    if (action === 'discard') label = 'Discarded contact draft';

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            steps: m.steps.map((s) => (s === block ? { ...s, resolved: true, action: label } : s)),
          };
        }
        // Also find the associated tool_action and mark it done
        if (m.id === block.toolActionId) {
          return { ...m, done: true };
        }
        return m;
      })
    );

    // 3. Send a hidden message to the AI so it knows what the user did
    let prompt = '';
    if (action === 'sent') {
      prompt = 'I have submitted the contact form successfully.';
    } else if (action === 'edit') {
      prompt = 'I decided to edit the contact form details myself before sending.';
    } else if (action === 'discard') {
      prompt = 'I cancelled the contact form draft.';
    }

    if (prompt) {
      send(prompt, true);
    }
  };

  const suggestedPrompts =
    chatbotSettings?.suggestedPrompts?.length > 0
      ? chatbotSettings.suggestedPrompts.map((t) => ({ text: t }))
      : DEFAULT_PROMPTS;

  // FAB (closed state)
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          onClick={handleOpenChat}
          className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-black to-neutral-900 hover:from-neutral-900 hover:to-black text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center border border-white/20 backdrop-blur-sm"
          aria-label="Open chat"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />
        </button>
      </div>
    );
  }

  if (settingsFetched && (!chatbotSettings || !chatbotSettings.isActive)) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 flex flex-col border border-neutral-200/50 shadow-black/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200/50 bg-neutral-50/80">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-neutral-400 rounded-full border-2 border-white shadow-sm" />
              <div>
                <h3 className="font-semibold text-neutral-900 text-base">Offline</h3>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          {/* Content */}
          <div className="p-6 text-center bg-white space-y-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="w-6 h-6 text-neutral-400" />
            </div>
            <h4 className="font-medium text-neutral-900">AI Assistant is currently away</h4>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Kiro is taking a break right now. You can still reach Raiyan directly via the contact
              form for any inquiries or project requests.
            </p>
            <a
              href="#contact"
              className="mt-4 inline-flex items-center justify-center w-full px-4 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors shadow-sm font-medium text-sm"
              onClick={(e) => {
                setIsOpen(false);
                if (window.location.pathname !== '/') {
                  e.preventDefault();
                  window.location.href = '/#contact';
                }
              }}
            >
              Contact Raiyan
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Chat window
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 h-[36rem] sm:h-[40rem] flex flex-col border border-white/20 shadow-black/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50/80 to-white/80 rounded-t-2xl">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 text-base">
                {chatbotSettings?.aiName || 'Kiro'}
              </h3>
              <p className="text-[10px] text-neutral-500 -mt-0.5 hidden sm:block">AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={clearChat}
              className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all duration-200 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-gradient-to-b from-white/50 to-neutral-50/50">
          {messages.map((message) => {
            // ── Tool action card ────────────────────────────────────────────
            // Only render while the tool is still running (pending).
            // Once done, StepHistory on the assistant bubble takes over — no duplication.
            if (message.role === 'tool_action') {
              if (message.done) return null;
              return (
                <div
                  key={message.id}
                  className="flex justify-start animate-in slide-in-from-bottom-2 duration-300"
                >
                  <ToolCard label={message.label} Icon={message.Icon} pending={true} />
                </div>
              );
            }

            // ── Regular message bubble ──────────────────────────────────────
            if (message.hidden) return null;

            const isAssistant = message.role === 'assistant';

            return (
              <div
                key={message.id}
                className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300 w-full`}
              >
                <div className={`max-w-full sm:max-w-[90%]`}>
                  {/* StepHistory above assistant bubble */}
                  {isAssistant && message.steps?.length > 0 && (
                    <StepHistory
                      steps={message.steps}
                      onInteract={(block, action) => handleUIInteract(message.id, block, action)}
                    />
                  )}

                  {message.content && (
                    <div
                      className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-sm text-sm overflow-hidden ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-black to-neutral-900 text-white shadow-black/20 rounded-tr-sm'
                          : 'bg-white/90 backdrop-blur-sm text-neutral-900 shadow-neutral-200/50 border border-neutral-200/50 rounded-tl-sm'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <MdContent content={message.content} onLinkClick={handleLinkClick} />
                      ) : (
                        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      )}

                      <p
                        className={`text-[10px] ${message.content ? 'mt-1.5' : ''} ${message.role === 'user' ? 'text-neutral-400' : 'text-neutral-400'}`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator (only when loading and no tool_action visible yet) */}
          {isLoading && !messages.some((m) => m.role === 'tool_action' && !m.done) && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-tl-sm shadow-neutral-200/50 border border-neutral-200/50">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500">
                    {statusMessage || `${chatbotSettings?.aiName || 'Kiro'} is thinking...`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {!isLoading && (
          <div className="px-3 sm:px-4 pt-2 border-t border-neutral-200/50 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt.text)}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200/80 rounded-full text-xs text-neutral-700 font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-200"
                >
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-neutral-200/50 bg-white shrink-0">
          <div className="relative rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus-within:border-black/50 focus-within:ring-1 focus-within:ring-black/20 transition-all">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading && inputMessage.trim()) {
                    handleSubmit(e);
                  }
                }
              }}
              placeholder={`Ask ${chatbotSettings?.aiName || 'Kiro'} a question...`}
              rows={1}
              disabled={isLoading}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-10 text-[13px] leading-relaxed outline-none placeholder:text-neutral-400 disabled:opacity-50 max-h-40 overflow-hidden text-neutral-900"
              style={{ height: '44px' }}
            />
            {/* Bottom row: send button right */}
            <div className="absolute bottom-2 right-2 flex items-center justify-end pointer-events-none">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !inputMessage.trim()}
                className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-black text-white hover:opacity-90 active:scale-95"
              >
                {isLoading ? (
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
