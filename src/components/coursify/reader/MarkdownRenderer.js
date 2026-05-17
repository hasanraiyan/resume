'use client';

import { memo, useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MermaidDiagram } from './MermaidDiagram';
import { ExternalLink, Quote, Globe, Link2, ChevronLeft, ChevronRight } from 'lucide-react';

// ==============================
// ASCII Detection
// ==============================

const ASCII_ART_RE = /[┌┐└┘│─├┤┬┴┼╔╗╚╝║═╠╣╦╩╬▲▼◄►]/;
const ASCII_PIPE_RE = /^[\s|+\-=*#.oO@:~^<>\\/()[\]{}_,.'"]+$/;

function isAsciiArt(code) {
  if (ASCII_ART_RE.test(code)) return true;
  const lines = code.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return false;
  return lines.every((l) => ASCII_PIPE_RE.test(l));
}

// ==============================
// Helpers
// ==============================

function getSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractTextContent(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractTextContent).join('');
  if (children?.props?.children) return extractTextContent(children.props.children);
  return '';
}

function createHeading(Level) {
  return ({ children, ...props }) => {
    const text = extractTextContent(children).trim();
    const slug = getSlug(text);
    return (
      <Level id={slug} data-heading={text} className="scroll-mt-24" {...props}>
        {children}
      </Level>
    );
  };
}

// ==============================
// FOOTNOTE POPOVER
// ==============================

// Rehype plugin to group adjacent footnotes
const rehypeGroupFootnotes = () => (tree) => {
  const isFootnoteSup = (node) => {
    if (node.tagName !== 'sup') return false;
    const link = node.children?.find((c) => c.tagName === 'a');
    return link?.properties?.dataFootnoteRef !== undefined;
  };

  const getFootnoteId = (node) => {
    const link = node.children?.find((c) => c.tagName === 'a');
    return link?.properties?.href?.replace('#', '');
  };

  const traverse = (node) => {
    if (!node.children) return;

    const newChildren = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      if (isFootnoteSup(child)) {
        const group = [child];
        let j = i + 1;
        while (j < node.children.length) {
          const next = node.children[j];
          if (isFootnoteSup(next)) {
            group.push(next);
            j++;
          } else if (next.type === 'text' && /^\s+$/.test(next.value)) {
            j++;
          } else {
            break;
          }
        }

        if (group.length > 1) {
          const ids = group.map(getFootnoteId);
          newChildren.push({
            type: 'element',
            tagName: 'grouped-footnote',
            properties: {
              identifiers: ids.join(','),
            },
            children: [],
          });
          i = j - 1;
        } else {
          newChildren.push(child);
        }
      } else {
        if (child.children) traverse(child);
        newChildren.push(child);
      }
    }
    node.children = newChildren;
  };

  traverse(tree);
};

function FootnotePopover({ href, identifiers, children, ...props }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sources, setSources] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [popoverStyle, setPopoverStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});

  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  const isGrouped = !!identifiers;
  const isFootnote = isGrouped || props['data-footnote-ref'] !== undefined;

  const targetIds = isGrouped ? identifiers.split(',') : [href?.replace('#', '')];

  // ------------------------------
  // Content Extraction
  // ------------------------------
  useEffect(() => {
    if (!isFootnote) return;

    const attemptExtraction = () => {
      const fetchedSources = [];
      targetIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          const link = element.querySelector('a');
          let sourceUrl = '';
          let favicon = null;
          if (link) {
            try {
              sourceUrl = link.href;
              const domain = new URL(sourceUrl).hostname;
              favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } catch (e) {}
          }

          // Pre-cache content
          const clone = element.cloneNode(true);

          // Remove ALL backlink icons (handles multiple citations: ↩1, ↩2, etc.)
          const backlinks = clone.querySelectorAll('[data-footnote-backref]');
          backlinks.forEach((b) => b.remove());

          // Regex cleanup to strip any lingering return symbols or superscript numbers
          let cleanText = clone.textContent.trim();
          cleanText = cleanText.replace(/[↩\u21a9]\d*/g, '').trim();

          fetchedSources.push({
            content: cleanText,
            url: sourceUrl,
            favicon,
          });
        }
      });

      if (fetchedSources.length > 0) {
        setSources(fetchedSources);
        return true;
      }
      return false;
    };

    let attempts = 0;
    const interval = setInterval(() => {
      if (attemptExtraction() || attempts > 10) clearInterval(interval);
      attempts++;
    }, 100);

    return () => clearInterval(interval);
  }, [identifiers, href, isFootnote]);

  // ------------------------------
  // Calculate Position (Portal)
  // ------------------------------
  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 256;
    const padding = 16;
    const viewportWidth = window.innerWidth;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;

    if (left + popoverWidth > viewportWidth - padding) {
      left = viewportWidth - popoverWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    setPopoverStyle({
      top: rect.top + window.scrollY - 8,
      left: left + window.scrollX,
      width: popoverWidth,
    });

    const triggerCenterRelative = rect.left + rect.width / 2 - left;
    setArrowStyle({
      left: triggerCenterRelative,
    });
  };

  const handleMouseEnter = () => {
    if (!isFootnote) return;
    clearTimeout(timeoutRef.current);
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const currentSource = sources[currentIndex] || sources[0];

  if (isFootnote) {
    return (
      <span className="relative inline-block">
        <a
          ref={triggerRef}
          href={isGrouped ? undefined : href}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`mx-0.5 inline-flex h-4 items-center justify-center rounded-sm transition-all px-1 gap-1 cursor-pointer ${
            isOpen ? 'bg-[#1f644e] shadow-md scale-110' : 'bg-[#f0f5f2] hover:bg-[#e8f0ed]'
          } ${isGrouped ? 'w-auto min-w-[1rem]' : 'w-4'}`}
          {...props}
        >
          <Quote className={`w-2 h-2 ${isOpen ? 'text-white' : 'text-[#1f644e]'}`} />
          {isGrouped && (
            <span
              className={`text-[8px] font-bold leading-none ${isOpen ? 'text-white' : 'text-[#1f644e]'}`}
            >
              {targetIds.length}
            </span>
          )}
        </a>

        {isOpen &&
          currentSource &&
          typeof document !== 'undefined' &&
          ReactDOM.createPortal(
            <div
              className="absolute z-[999999] -translate-y-full pb-2 animate-in fade-in zoom-in-95 duration-200"
              style={popoverStyle}
              onMouseEnter={() => {
                clearTimeout(timeoutRef.current);
                setIsOpen(true);
              }}
              onMouseLeave={handleMouseLeave}
            >
              <div className="overflow-hidden rounded-xl border border-[#e5e3d8] bg-white p-3 shadow-2xl">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-1.5">
                      <Quote className="h-2.5 w-2.5 text-[#1f644e]" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#7c8e88]">
                        Source Details
                      </span>
                    </div>

                    {sources.length > 1 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-[#7c8e88]">
                          {currentIndex + 1} / {sources.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sources.length - 1));
                            }}
                            className="rounded p-0.5 transition-colors hover:bg-[#f0f5f2]"
                          >
                            <ChevronLeft className="h-2.5 w-2.5 text-[#1f644e]" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentIndex((prev) => (prev < sources.length - 1 ? prev + 1 : 0));
                            }}
                            className="rounded p-0.5 transition-colors hover:bg-[#f0f5f2]"
                          >
                            <ChevronRight className="h-2.5 w-2.5 text-[#1f644e]" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] leading-relaxed text-[#1e3a34] line-clamp-4 italic">
                    "{currentSource.content}"
                  </p>

                  {currentSource.url && (
                    <div className="mt-1 flex items-center justify-between border-t border-[#f0f5f2] pt-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="flex h-4 w-4 items-center justify-center overflow-hidden rounded bg-[#f0f5f2]">
                          {currentSource.favicon ? (
                            <img
                              src={currentSource.favicon}
                              className="h-2.5 w-2.5 object-contain"
                              alt=""
                            />
                          ) : (
                            <Globe className="h-2.5 w-2.5 text-[#1f644e]" />
                          )}
                        </div>
                        <span className="truncate text-[10px] font-medium text-[#1f644e]">
                          {new URL(currentSource.url).hostname.replace('www.', '')}
                        </span>
                      </div>
                      <a
                        href={currentSource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#1f644e] hover:underline"
                      >
                        View source
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Pointer arrow */}
              <div
                className="absolute top-full -mt-3 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-[#e5e3d8] bg-white"
                style={arrowStyle}
              />
            </div>,
            document.body
          )}
      </span>
    );
  }

  // Standard link
  return (
    <a
      href={href}
      className="text-[#1f644e] font-semibold underline underline-offset-4 decoration-[#1f644e]/30 hover:decoration-[#1f644e] transition-all"
      {...props}
    >
      {children}
    </a>
  );
}

// ==============================
// MAIN MARKDOWN RENDERER
// ==============================

export const MarkdownRenderer = memo(function MarkdownRenderer({ content, isInline = false }) {
  return (
    <div
      className={`coursify-md prose prose-sm max-w-none min-w-0 overflow-visible font-[family-name:var(--font-lora)] prose-headings:font-bold prose-headings:text-[#1e3a34] prose-p:text-[#1e3a34] prose-p:leading-relaxed prose-code:bg-[#f0f5f2] prose-code:rounded prose-code:px-1 prose-code:text-[#1f644e] prose-pre:bg-[#1e3a34] prose-pre:rounded-xl prose-blockquote:border-[#1f644e] prose-a:text-[#1f644e] prose-li:text-[#1e3a34] prose-strong:text-[#1e3a34] prose-table:text-sm [&_section[data-footnotes]]:hidden ${
        isInline ? 'prose-p:my-0 prose-headings:my-0 prose-ul:my-0 prose-ol:my-0' : ''
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex, rehypeGroupFootnotes]}
        components={{
          h1: createHeading('h1'),
          h2: createHeading('h2'),
          h3: createHeading('h3'),
          h4: createHeading('h4'),
          a: FootnotePopover,
          'grouped-footnote': FootnotePopover,
          table({ children }) {
            return (
              <div className="coursify-table-scroll overflow-x-auto my-7 rounded-xl border border-[#e5e3d8]">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          code({ className, children, ...props }) {
            const lang = /language-(\w+)/.exec(className || '')?.[1];
            const codeStr = String(children);
            const isBlock = codeStr.endsWith('\n') || codeStr.includes('\n');
            const raw = codeStr.replace(/\n$/, '');

            if (lang === 'mermaid') {
              return <MermaidDiagram chart={raw} />;
            }

            if (isBlock && (lang === 'ascii' || (!lang && isAsciiArt(raw)))) {
              return (
                <div className="my-6 overflow-x-auto rounded-xl border border-[#d4e6db] bg-[#f7faf8]">
                  <pre className="p-4 text-[0.78rem] leading-relaxed font-mono text-[#1e3a34] whitespace-pre">
                    {raw}
                  </pre>
                </div>
              );
            }

            if (isBlock && lang) {
              return (
                <div className="overflow-x-auto my-3 rounded-xl">
                  <SyntaxHighlighter
                    style={oneDark}
                    language={lang}
                    PreTag="div"
                    customStyle={{
                      borderRadius: '0.75rem',
                      fontSize: '0.82rem',
                      margin: 0,
                      padding: '0.6em 0.9em',
                    }}
                    showLineNumbers
                    {...props}
                  >
                    {raw}
                  </SyntaxHighlighter>
                </div>
              );
            }

            if (isBlock) {
              return (
                <div
                  className="rounded-xl overflow-x-auto my-3 w-full"
                  style={{ background: '#18181b' }}
                >
                  <pre
                    className="p-4 text-[0.82rem] leading-relaxed font-mono whitespace-pre"
                    style={{ background: 'transparent' }}
                  >
                    <code className="font-mono" style={{ color: '#e4e4e7' }}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className="bg-[#f0f5f2] text-[#1f644e] rounded px-1.5 py-0.5 text-[0.82em] font-mono font-semibold"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
