import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ExternalLink, CornerDownRight } from 'lucide-react';

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

export default function MdContent({ content, onLinkClick, isUser = false }) {
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
          img: ({ src, alt, ...props }) => {
            // If the AI mistakenly uses an image tag for a YouTube video, render an iframe instead
            if (src && (src.includes('youtube.com') || src.includes('youtu.be'))) {
              let videoId = '';
              if (src.includes('youtube.com/watch?v=')) {
                videoId = src.split('v=')[1].split('&')[0];
              } else if (src.includes('youtu.be/')) {
                videoId = src.split('youtu.be/')[1].split('?')[0];
              }

              if (videoId) {
                return (
                  <div className="my-2 w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-neutral-200">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={alt || 'YouTube video'}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                );
              }
            }

            return (
              <span className="block my-2 w-full rounded-xl overflow-hidden border border-neutral-200/60 bg-neutral-100 relative">
                <img
                  src={src}
                  alt={alt || 'Image'}
                  className="w-full h-auto object-cover max-h-96"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                  {...props}
                />
                <span className="hidden flex-col items-center justify-center p-4 text-center text-neutral-400 text-[11px] w-full min-h-[160px] bg-neutral-50/50">
                  <span className="font-medium text-neutral-500 mb-1">Image not available</span>
                  {alt && alt !== 'Offline' && <span className="italic line-clamp-2">"{alt}"</span>}
                </span>
              </span>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
