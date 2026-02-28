// src/components/ui/MarkdownRenderer.js
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Medium-style Markdown Renderer.
 * Beautiful prose typography with Georgia/serif fonts, proper spacing,
 * and enhanced code blocks.
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="medium-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1
              className="text-[28px] sm:text-[32px] font-bold text-neutral-900 mt-12 mb-4 leading-tight"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="text-[22px] sm:text-[26px] font-bold text-neutral-900 mt-10 mb-3 leading-snug"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="text-[18px] sm:text-[20px] font-bold text-neutral-900 mt-8 mb-2 leading-snug"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className="text-[16px] sm:text-[18px] font-bold text-neutral-900 mt-6 mb-2"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children, node }) => {
            // Check if the paragraph contains only an image
            const hasOnlyImage =
              node?.children?.length === 1 && node.children[0]?.tagName === 'img';
            if (hasOnlyImage) {
              return <>{children}</>;
            }
            return (
              <p
                className="text-[18px] sm:text-[20px] text-neutral-700 leading-[1.8] mb-6"
                style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
              >
                {children}
              </p>
            );
          },

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-neutral-900 underline underline-offset-2 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-[3px] border-neutral-900 pl-5 my-8"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              <div className="text-[20px] sm:text-[22px] text-neutral-600 italic leading-[1.6]">
                {children}
              </div>
            </blockquote>
          ),

          // Lists
          ul: ({ children }) => (
            <ul
              className="list-disc pl-6 mb-6 space-y-2 text-[18px] sm:text-[20px] text-neutral-700 leading-[1.7]"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className="list-decimal pl-6 mb-6 space-y-2 text-[18px] sm:text-[20px] text-neutral-700 leading-[1.7]"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,

          // Horizontal rule
          hr: () => (
            <div className="my-10 flex justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            </div>
          ),

          // Images
          img: ({ src, alt }) => (
            <figure className="my-8 -mx-5 sm:mx-0">
              <img src={src} alt={alt || ''} className="w-full rounded-sm" loading="lazy" />
              {alt && (
                <figcaption
                  className="text-center text-[13px] text-neutral-400 mt-3 px-5 sm:px-0"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {alt}
                </figcaption>
              )}
            </figure>
          ),

          // Code blocks
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-6 -mx-5 sm:mx-0 rounded-none sm:rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 text-neutral-400 text-[11px] font-mono">
                  <span>{match[1]}</span>
                </div>
                <SyntaxHighlighter
                  style={atomDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    padding: '1.25rem',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[0.9em] font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Tables
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto -mx-5 sm:mx-0">
              <table className="w-full text-[15px] border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b-2 border-neutral-200 text-left text-neutral-900 font-bold text-[13px] uppercase tracking-wider">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-neutral-100">{children}</tbody>
          ),
          th: ({ children }) => <th className="px-4 py-3">{children}</th>,
          td: ({ children }) => <td className="px-4 py-3 text-neutral-600">{children}</td>,

          // Strong / Em
          strong: ({ children }) => (
            <strong className="font-bold text-neutral-900">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
