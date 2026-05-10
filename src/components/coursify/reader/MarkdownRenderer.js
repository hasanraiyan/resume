'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MermaidDiagram } from './MermaidDiagram';

// Box-drawing unicode block + common ASCII art patterns
const ASCII_ART_RE = /[┌┐└┘│─├┤┬┴┼╔╗╚╝║═╠╣╦╩╬▲▼◄►]/;
const ASCII_PIPE_RE = /^[\s|+\-=*#.oO@:~^<>\\/()[\]{}_,.'"]+$/;

function isAsciiArt(code) {
  if (ASCII_ART_RE.test(code)) return true;
  // Treat as ASCII art if every non-empty line is made of pipe/dash/plus/symbol chars
  const lines = code.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return false;
  return lines.every((l) => ASCII_PIPE_RE.test(l));
}

/**
 * Standardizes slug generation for TOC anchors.
 */
function getSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Flattens React children into a plain string.
 */
function extractTextContent(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractTextContent).join('');
  if (children?.props?.children) return extractTextContent(children.props.children);
  return '';
}

/**
 * Helper to create heading components with ID and data-heading.
 */
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

export const MarkdownRenderer = memo(function MarkdownRenderer({ content }) {
  return (
    <div className="coursify-md prose prose-sm max-w-none min-w-0 overflow-x-hidden font-[family-name:var(--font-lora)] prose-headings:font-bold prose-headings:text-[#1e3a34] prose-p:text-[#1e3a34] prose-p:leading-relaxed prose-code:bg-[#f0f5f2] prose-code:rounded prose-code:px-1 prose-code:text-[#1f644e] prose-pre:bg-[#1e3a34] prose-pre:rounded-xl prose-blockquote:border-[#1f644e] prose-a:text-[#1f644e] prose-li:text-[#1e3a34] prose-strong:text-[#1e3a34] prose-table:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          h1: createHeading('h1'),
          h2: createHeading('h2'),
          h3: createHeading('h3'),
          h4: createHeading('h4'),
          table({ children }) {
            return (
              <div className="coursify-table-scroll overflow-x-auto my-7 rounded-xl border border-[#e5e3d8]">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          code({ node, className, children, ...props }) {
            const lang = /language-(\w+)/.exec(className || '')?.[1];
            const codeStr = String(children);
            // Fenced blocks always have a trailing \n added by ReactMarkdown;
            // inline code never does — check before stripping.
            const isBlock = codeStr.endsWith('\n') || codeStr.includes('\n');
            const raw = codeStr.replace(/\n$/, '');

            // Mermaid diagrams
            if (lang === 'mermaid') {
              return <MermaidDiagram chart={raw} />;
            }

            // ASCII art / box diagrams
            if (isBlock && (lang === 'ascii' || (!lang && isAsciiArt(raw)))) {
              return (
                <div className="my-6 overflow-x-auto rounded-xl border border-[#d4e6db] bg-[#f7faf8]">
                  <pre className="p-4 text-[0.78rem] leading-relaxed font-mono text-[#1e3a34] whitespace-pre">
                    {raw}
                  </pre>
                </div>
              );
            }

            // Fenced code with language → syntax highlight
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

            // Fenced code without language
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

            // Inline code
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
