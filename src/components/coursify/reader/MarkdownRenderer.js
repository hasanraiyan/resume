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
const ASCII_PIPE_RE = /^[\s|+\-=*#.oO@:~^<>]+$/;

function isAsciiArt(code) {
  if (ASCII_ART_RE.test(code)) return true;
  // Treat as ASCII art if every non-empty line is made of pipe/dash/plus chars
  const lines = code.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return false;
  return lines.every((l) => ASCII_PIPE_RE.test(l));
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ content }) {
  return (
    <div className="coursify-md prose prose-sm max-w-none font-[family-name:var(--font-lora)] prose-headings:font-bold prose-headings:text-[#1e3a34] prose-p:text-[#1e3a34] prose-p:leading-relaxed prose-code:bg-[#f0f5f2] prose-code:rounded prose-code:px-1 prose-code:text-[#1f644e] prose-pre:bg-[#1e3a34] prose-pre:rounded-xl prose-blockquote:border-[#1f644e] prose-a:text-[#1f644e] prose-li:text-[#1e3a34] prose-strong:text-[#1e3a34] prose-table:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          h2({ children, ...props }) {
            const text = typeof children === 'string' ? children : '';
            const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <h2 id={slug} data-heading={text} className="scroll-mt-20" {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            const text = typeof children === 'string' ? children : '';
            const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <h3 id={slug} data-heading={text} className="scroll-mt-20" {...props}>
                {children}
              </h3>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-7 rounded-xl border border-[#e5e3d8]">
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
            if (isBlock && !lang && isAsciiArt(raw)) {
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
                <SyntaxHighlighter
                  style={oneDark}
                  language={lang}
                  PreTag="div"
                  customStyle={{
                    borderRadius: '0.75rem',
                    fontSize: '0.82rem',
                    margin: '0.75em 0',
                    padding: '0.6em 0.9em',
                  }}
                  showLineNumbers
                  {...props}
                >
                  {raw}
                </SyntaxHighlighter>
              );
            }

            // Fenced code without language
            if (isBlock) {
              return (
                <div
                  className="rounded-xl overflow-hidden my-3 w-full flex justify-center"
                  style={{ background: '#18181b' }}
                >
                  <pre
                    className="overflow-x-auto p-4 text-[0.82rem] leading-relaxed font-mono whitespace-pre"
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
