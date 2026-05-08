'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function MarkdownRenderer({ content }) {
  if (!content) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[#7c8e88]">No content yet for this section.</p>
      </div>
    );
  }

  return (
    <div className="coursify-md prose prose-sm max-w-none font-[family-name:var(--font-lora)] prose-headings:font-bold prose-headings:text-[#1e3a34] prose-p:text-[#1e3a34] prose-p:leading-relaxed prose-code:bg-[#f0f5f2] prose-code:rounded prose-code:px-1 prose-code:text-[#1f644e] prose-pre:bg-[#1e3a34] prose-pre:rounded-xl prose-blockquote:border-[#1f644e] prose-a:text-[#1f644e] prose-li:text-[#1e3a34] prose-strong:text-[#1e3a34] prose-table:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
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
            const match = /language-(\w+)/.exec(className || '');
            const isBlock = String(children).includes('\n');

            if (isBlock && match) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    borderRadius: '0.75rem',
                    fontSize: '0.82rem',
                    margin: '0.75em 0',
                    padding: '0.6em 0.9em',
                    maxHeight: '480px',
                    overflowY: 'auto',
                  }}
                  showLineNumbers
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            if (isBlock) {
              return (
                <div
                  className="rounded-xl overflow-hidden my-3 w-full flex justify-center"
                  style={{ background: '#18181b' }}
                >
                  <pre
                    className="overflow-x-auto overflow-y-auto max-h-[480px] p-4 text-[0.82rem] leading-relaxed font-mono whitespace-pre"
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
}
