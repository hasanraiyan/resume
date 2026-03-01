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
  Bot,
  User,
  Sparkles,
  CornerDownRight,
  Plus,
  Settings2,
  Globe,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import getAnalytics from '@/lib/analytics';
import StaticGenUI from './StaticGenUI';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helper: Get icon for specific MCP/Tool ID
// ---------------------------------------------------------------------------
function getMCPIcon(mcpId) {
  if (mcpId?.includes('search') || mcpId?.includes('tavily')) return Globe;
  if (mcpId?.includes('pdf') || mcpId?.includes('file')) return FileText;
  return Wrench;
}

// Parse tool name from the emoji status string emitted by getToolStatusMessage
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

function MdContent({ content, onLinkClick, isUser = false }) {
  return (
    <div className="w-full max-w-full overflow-hidden break-words text-wrap">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-1.5 last:mb-0 leading-relaxed max-w-full break-words">{children}</p>
          ),
          code({ node, inline, className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) return <CodeBlock language={match[1]}>{children}</CodeBlock>;
            if (!inline && !match) return <CodeBlock language="text">{children}</CodeBlock>;
            return (
              <code className="bg-black/10 rounded px-1 py-0.5 font-mono text-[10px]">
                {children}
              </code>
            );
          },
          a: ({ node, href, children, ...props }) => {
            let cleanHref = href || '';
            // Ensure it has a protocol if it looks like an external domain but lacks one
            if (cleanHref.startsWith('www.')) {
              cleanHref = `https://${cleanHref}`;
            }

            return (
              <a
                href={cleanHref}
                className={`relative z-50 pointer-events-auto hover:text-current underline underline-offset-2 transition-colors break-words ${isUser ? 'text-white decoration-white/30' : 'text-blue-600 decoration-blue-300'}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation(); // Stop event bubbling to prevent global selection / layout listeners from firing
                  console.log('🔗 Markdown link clicked:', cleanHref);
                  if (onLinkClick) {
                    onLinkClick(e, cleanHref);
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                {...props}
              >
                {children}
                {cleanHref?.startsWith('http') && (
                  <ExternalLink className="w-2.5 h-2.5 inline-block ml-0.5 mb-0.5 align-middle" />
                )}
              </a>
            );
          },
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <p className="font-bold text-sm mb-1">{children}</p>,
          h2: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
          h3: ({ children }) => <p className="font-medium mb-1">{children}</p>,
          blockquote: ({ children }) => (
            <div
              className={`flex gap-2 items-start mb-3 border-l-2 ${isUser ? 'border-white/20 bg-white/5' : 'border-neutral-200 bg-neutral-50/50'} py-1.5 px-3 rounded-r-lg italic`}
            >
              <CornerDownRight
                className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isUser ? 'text-white/40' : 'text-neutral-400'}`}
              />
              <div
                className={`text-[12px] leading-relaxed ${isUser ? 'text-white/70' : 'text-neutral-500'}`}
              >
                {children}
              </div>
            </div>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWelcomeMessage(settings) {
  const name = settings?.aiName || 'Kiro';
  return `Hi! I'm ${name}, the AI assistant. I can help you learn about the projects and experience here. What would you like to know?`;
}

function getDefaultPrompts(settings) {
  // Return generic/dynamic prompts if the user hasn't set custom ones
  return [
    { text: 'Tell me about the portfolio projects' },
    { text: 'Book an appointment' },
    { text: "What's the tech stack?" },
    { text: 'How can I get in touch?' },
    { text: 'Show me the latest blog post' },
  ];
}

// ---------------------------------------------------------------------------
// Core streaming helper
// ---------------------------------------------------------------------------

async function streamChatResponse({
  content,
  imageBase64,
  history,
  setMessages,
  setStatus,
  activeMCPs = [],
}) {
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
      activeMCPs: activeMCPs, // Pass array of IDs directly
      imageBase64: imageBase64,
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
  const [selection, setSelection] = useState({ text: '', x: 0, y: 0, show: false });
  const [activeQuote, setActiveQuote] = useState('');
  const [activeMCPs, setActiveMCPs] = useState([]); // Stores IDs like ['mcp-tavily']
  const [availableMCPs, setAvailableMCPs] = useState([]); // Fetched from backend
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close tools menu on background click
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (isToolsMenuOpen && !e.target.closest('.tools-menu-container')) {
        setIsToolsMenuOpen(false);
      }
      if (isPlusMenuOpen && !e.target.closest('.plus-menu-container')) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [isToolsMenuOpen, isPlusMenuOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle global text selection for Contextual AI
  useEffect(() => {
    const updateSelectionPos = () => {
      const activeSelection = window.getSelection();
      if (!activeSelection || activeSelection.rangeCount === 0) return;

      const text = activeSelection.toString().trim();
      if (!text) {
        setSelection((prev) => ({ ...prev, show: false }));
        return;
      }

      const range = activeSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Check if selection is inside the chatbot
      if (activeSelection.anchorNode?.parentElement?.closest('.chatbot-widget-container')) {
        setSelection((prev) => ({ ...prev, show: false }));
        return;
      }

      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 10, // Viewport relative
        show: true,
      });
    };

    const handleMouseUp = () => {
      setTimeout(updateSelectionPos, 10);
    };

    const handleMouseDown = (e) => {
      if (!e.target.closest('.ai-selection-tooltip')) {
        setSelection((prev) => ({ ...prev, show: false }));
      }
    };

    // Keep tooltip anchored during scroll
    const handleScroll = () => {
      if (window.getSelection().toString().trim()) {
        updateSelectionPos();
      } else {
        setSelection((prev) => ({ ...prev, show: false }));
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fetch backend-configured MCP tools on load
  useEffect(() => {
    async function loadMCPs() {
      try {
        const res = await fetch('/api/mcps');
        if (res.ok) {
          const data = await res.json();
          setAvailableMCPs(data);
        }
      } catch (err) {
        console.error('Failed to load available tools:', err);
      }
    }
    loadMCPs();
  }, []);

  // Handle Escape key to close widget
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      if ((!content.trim() && !activeQuote && !attachedImage) || isLoading) return;

      const currentQuote = activeQuote;
      let finalContent = content.trim();

      if (currentQuote) {
        finalContent = `> "${currentQuote.trim()}"\n\n${finalContent}`;
        setActiveQuote(''); // Clear UI immediately
      }

      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: finalContent,
        imageBase64: attachedImage,
        timestamp: new Date(),
        hidden,
      };

      const imageToSend = attachedImage;
      setAttachedImage(null);

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        await streamChatResponse({
          content: userMessage.content,
          imageBase64: imageToSend,
          history: messages.filter((m) => !m.hidden),
          activeMCPs,
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
    [isLoading, messages, activeQuote, activeMCPs, attachedImage]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    send(inputMessage);
    setInputMessage('');
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachedImage(e.target.result);
      setIsPlusMenuOpen(false);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handlePromptClick = useCallback((text) => send(text), [send]);

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
    toast.success('Chat history cleared');
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
      : getDefaultPrompts(chatbotSettings);

  const handleAskKiroContext = useCallback(() => {
    if (!selection.text) return;
    setActiveQuote(selection.text);
    if (!isOpen) {
      setIsOpen(true);
      if (!settingsFetched) fetchSettings();
    }
    setSelection((prev) => ({ ...prev, show: false }));
    window.getSelection()?.removeAllRanges();
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [selection.text, isOpen, settingsFetched, fetchSettings]);

  const renderContextualButton = () => {
    if (!selection.show) return null;
    return (
      <div
        className="fixed z-[100] animate-in zoom-in-95 duration-200 pointer-events-auto"
        style={{
          left: `${selection.x}px`,
          top: `${selection.y}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <button
          onClick={handleAskKiroContext}
          className="ai-selection-tooltip flex items-center gap-2 px-3 py-1.5 bg-black text-white text-[11px] font-medium rounded-lg shadow-xl hover:bg-neutral-800 transition-colors border border-white/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          Ask {chatbotSettings?.aiName || 'Kiro'}
        </button>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-black" />
      </div>
    );
  };

  // 1. FAB (closed state)
  if (!isOpen) {
    return (
      <>
        {renderContextualButton()}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group flex flex-col items-end gap-2 chatbot-widget-container">
          {/* Tooltip */}
          <div className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg shadow-lg pointer-events-none whitespace-nowrap">
            Chat with {chatbotSettings?.aiName || 'Kiro'}
          </div>

          <button
            onClick={handleOpenChat}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-black to-neutral-900 hover:from-neutral-900 hover:to-black text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center border border-white/20 backdrop-blur-sm"
            aria-label="Open chat"
          >
            {/* Notification Badge */}
            <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-theme-bg shadow-sm z-20">
              <div className="absolute inset-0 w-full h-full bg-red-500 rounded-full animate-ping opacity-75" />
            </div>

            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />
          </button>
        </div>
      </>
    );
  }

  // 2. Offline state
  if (settingsFetched && (!chatbotSettings || !chatbotSettings.isActive)) {
    return (
      <>
        {renderContextualButton()}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-300 chatbot-widget-container">
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
                {chatbotSettings?.aiName || 'Kiro'} is taking a break right now. You can still reach
                out directly via the contact form for any inquiries or project requests.
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
                Contact Me
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 3. Active Chat Window
  return (
    <>
      {renderContextualButton()}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-300 chatbot-widget-container">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl w-[calc(100vw-2rem)] sm:w-96 h-[80vh] max-h-[800px] sm:h-[40rem] flex flex-col border border-white/20 shadow-black/10">
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
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-gradient-to-b from-white/50 to-neutral-50/50 custom-chat-scrollbar">
            {messages.map((message, index) => {
              if (message.role === 'tool_action') {
                if (message.done) return null;
                return (
                  <div
                    key={message.id}
                    className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-300 w-full"
                  >
                    <div className="w-7 h-7 shrink-0 mt-1" />
                    <div className="flex-1 min-w-0 max-w-[95%]">
                      <ToolCard label={message.label} Icon={message.Icon} pending={true} />
                    </div>
                  </div>
                );
              }

              if (message.hidden) return null;
              const isAssistant = message.role === 'assistant';

              let isConsecutive = false;
              for (let i = index - 1; i >= 0; i--) {
                const prevMsg = messages[i];
                if (prevMsg.hidden) continue;
                if (prevMsg.role === 'tool_action' && prevMsg.done) continue;
                isConsecutive = prevMsg.role === message.role;
                break;
              }

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300 w-full`}
                >
                  <div className="relative w-7 h-7 shrink-0 mt-1 flex items-center justify-center">
                    {!isConsecutive && (
                      <div
                        className={`w-full h-full rounded-full flex items-center justify-center shadow-sm ${message.role === 'user' ? 'bg-black ring-2 ring-black/10' : 'bg-neutral-100 border border-neutral-200/60'}`}
                      >
                        {message.role === 'user' ? (
                          <User className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-neutral-600" />
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex-1 min-w-0 ${message.role === 'user' ? 'max-w-[85%]' : 'max-w-[95%]'} flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {isAssistant && message.steps?.length > 0 && (
                      <StepHistory
                        steps={message.steps}
                        onInteract={(block, action) => handleUIInteract(message.id, block, action)}
                      />
                    )}

                    {message.content && (
                      <div
                        className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-sm text-[13px] overflow-hidden ${message.role === 'user' ? 'bg-gradient-to-br from-black to-neutral-900 text-white shadow-black/20 rounded-tr-sm' : 'bg-white/90 backdrop-blur-sm text-neutral-900 shadow-neutral-200/50 border border-neutral-200/50 rounded-tl-sm'}`}
                      >
                        {message.imageBase64 && (
                          <div className="mb-2 max-w-[200px] rounded-lg overflow-hidden border border-white/20">
                            <img
                              src={message.imageBase64}
                              alt="Uploaded"
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        )}
                        {message.role === 'assistant' ? (
                          <MdContent content={message.content} onLinkClick={handleLinkClick} />
                        ) : (
                          <MdContent content={message.content} isUser={true} />
                        )}
                        <p className={`text-[10px] mt-1.5 text-neutral-400`}>
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

            {isLoading && !messages.some((m) => m.role === 'tool_action' && !m.done) && (
              <div className="flex gap-3 flex-row animate-in slide-in-from-bottom-2 duration-300 w-full mt-1">
                <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[1.5px] border-neutral-200" />
                  <div className="absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-neutral-800 border-r-neutral-800 animate-spin" />
                  <Bot className="w-3.5 h-3.5 text-neutral-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts / Active Quote */}
          {!isLoading && (
            <div className="border-t border-neutral-200/50 bg-white/80 backdrop-blur-sm">
              {activeQuote ? (
                <div className="px-3 sm:px-4 py-3 bg-neutral-50 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-2 group">
                    <CornerDownRight className="w-3.5 h-3.5 text-neutral-400 mt-1 shrink-0" />
                    <div className="flex-1 min-w-0 pr-6 relative">
                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed italic border-l-2 border-neutral-300 pl-3">
                        "{activeQuote.trim()}"
                      </p>
                      <button
                        onClick={() => setActiveQuote('')}
                        className="absolute -top-1 -right-1 p-1 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove quote"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                activeMCPs.length === 0 && (
                  <div className="px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                )
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-neutral-200/50 bg-white shrink-0">
            {attachedImage && (
              <div className="flex items-center gap-2 mb-2 px-2">
                <div className="relative group rounded-lg overflow-hidden border border-neutral-200 w-16 h-16 shrink-0 bg-neutral-100">
                  <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}

            {activeMCPs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 px-1">
                {activeMCPs.map((mcpId) => {
                  const mcp = availableMCPs.find((p) => p.id === mcpId);
                  if (!mcp) return null;
                  return (
                    <div
                      key={mcp.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/80 border border-blue-200/60 rounded-full text-blue-700 text-[11px] font-medium"
                    >
                      {(() => {
                        const Icon = getMCPIcon(mcp.id);
                        return <Icon className="w-3 h-3 text-blue-500" />;
                      })()}
                      {mcp.name}
                      <button
                        onClick={() => setActiveMCPs((prev) => prev.filter((id) => id !== mcp.id))}
                        className="ml-1 p-0.5 hover:bg-blue-100/80 rounded-full transition-colors"
                        title="Remove Tool"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="rounded-3xl border border-neutral-200/80 bg-neutral-50/50 focus-within:border-black/50 focus-within:ring-1 focus-within:ring-black/20 transition-all flex flex-col">
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
                    if (!isLoading && (inputMessage.trim() || activeQuote || attachedImage)) {
                      handleSubmit(e);
                    }
                  }
                }}
                placeholder={`Ask ${chatbotSettings?.aiName || 'Kiro'} a question...`}
                rows={1}
                disabled={isLoading}
                className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[13px] leading-relaxed outline-none placeholder:text-neutral-400 disabled:opacity-50 max-h-40 overflow-hidden text-neutral-900 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ height: '44px' }}
              />

              <div className="flex justify-between items-center px-2 pb-2 mt-auto">
                {/* Left: Settings Menu & Image Upload */}
                <div className="flex items-center gap-1">
                  {chatbotSettings?.imageInputEnabled && (
                    <div className="relative plus-menu-container">
                      <button
                        onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                        disabled={isLoading}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isPlusMenuOpen ? 'bg-neutral-200 text-neutral-800' : 'bg-transparent text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-700'} disabled:opacity-50`}
                        title="Add attachment"
                      >
                        <Plus className="w-5 h-5" />
                      </button>

                      {isPlusMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-200/50 overflow-hidden text-left animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                          <div className="p-1">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full text-left px-3 py-2.5 text-xs rounded-lg transition-colors flex items-center gap-2.5 hover:bg-neutral-100 text-neutral-700"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Upload files</span>
                            </button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative tools-menu-container">
                    <button
                      onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                      disabled={isLoading}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isToolsMenuOpen ? 'bg-neutral-200 text-neutral-800' : 'bg-transparent text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-700'} disabled:opacity-50`}
                      title="Tools"
                    >
                      <Settings2 className="w-[18px] h-[18px]" />
                    </button>

                    {isToolsMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-200/50 overflow-hidden text-left animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                        <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50/80">
                          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                            Available Tools
                          </span>
                        </div>
                        <div className="p-1">
                          {availableMCPs.map((mcp) => {
                            const isActive = activeMCPs.includes(mcp.id);
                            return (
                              <button
                                key={mcp.id}
                                onClick={() => {
                                  if (isActive) {
                                    setActiveMCPs([]);
                                  } else {
                                    setActiveMCPs([mcp.id]);
                                  }
                                  setIsToolsMenuOpen(false);
                                  setTimeout(() => inputRef.current?.focus(), 50);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-xs rounded-lg transition-colors flex items-center gap-2.5 ${isActive ? 'bg-blue-50/50 text-blue-700 font-medium' : 'hover:bg-neutral-100 text-neutral-700'}`}
                              >
                                {(() => {
                                  const Icon = getMCPIcon(mcp.id);
                                  return (
                                    <Icon
                                      className={`w-3.5 h-3.5 ${isActive ? 'text-blue-500' : 'text-neutral-400'}`}
                                    />
                                  );
                                })()}
                                <div className="flex flex-col">
                                  <span>{mcp.name}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Submit Button */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || (!inputMessage.trim() && !activeQuote && !attachedImage)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-black text-white hover:opacity-90 active:scale-95"
                  >
                    {isLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
