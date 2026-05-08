'use client';

import { memo, useEffect, useRef, useState } from 'react';

let mermaidReady = false;
let mermaidInstance = null;

async function getMermaid() {
  if (mermaidInstance) return mermaidInstance;

  const mod = await import('mermaid');
  mermaidInstance = mod.default;

  if (!mermaidReady) {
    mermaidInstance.initialize({
      startOnLoad: false,

      theme: 'base',

      flowchart: {
        padding: 24,
        nodeSpacing: 50,
        rankSpacing: 60,
        curve: 'basis',
      },

      themeVariables: {
        primaryColor: '#e8f5ee',
        primaryTextColor: '#1e3a34',
        primaryBorderColor: '#1f644e',

        secondaryColor: '#f0f5f2',
        tertiaryColor: '#fcfbf5',

        lineColor: '#1f644e',

        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',

        nodeBorder: '#1f644e',
      },
    });

    mermaidReady = true;
  }

  return mermaidInstance;
}

let uid = 0;

export const MermaidDiagram = memo(function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  const idRef = useRef(`mermaid-${++uid}`);

  useEffect(() => {
    let cancelled = false;

    setSvg('');
    setError(null);

    async function renderDiagram() {
      try {
        const mermaid = await getMermaid();

        const { svg: renderedSvg } = await mermaid.render(idRef.current, chart);

        if (!cancelled) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err?.message ?? err));
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <pre className="my-6 overflow-x-auto rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
        {error}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 rounded-2xl bg-[#f0f5f2] p-6 animate-pulse">
        {/* Top node */}
        <div className="flex justify-center mb-4">
          <div className="h-8 w-32 rounded-lg bg-[#d4e6db]" />
        </div>
        {/* Connector line */}
        <div className="flex justify-center mb-4">
          <div className="w-0.5 h-5 bg-[#c2d8ce]" />
        </div>
        {/* Middle row */}
        <div className="flex justify-center gap-8 mb-4">
          <div className="h-8 w-24 rounded-lg bg-[#d4e6db]" />
          <div className="h-8 w-24 rounded-lg bg-[#d4e6db]" />
        </div>
        {/* Connector lines */}
        <div className="flex justify-center gap-16 mb-4">
          <div className="w-0.5 h-5 bg-[#c2d8ce]" />
          <div className="w-0.5 h-5 bg-[#c2d8ce]" />
        </div>
        {/* Bottom row */}
        <div className="flex justify-center gap-8">
          <div className="h-8 w-20 rounded-lg bg-[#c2d8ce]" />
          <div className="h-8 w-20 rounded-lg bg-[#c2d8ce]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .mermaid-diagram svg {
          width: 100%;
          height: auto;
          overflow: visible;
        }

        /* Node shapes */
        .mermaid-diagram svg .node rect,
        .mermaid-diagram svg .node polygon,
        .mermaid-diagram svg .node path {
          rx: 12px;
          ry: 12px;
          stroke-width: 2px;
        }

        /* Label container */
        .mermaid-diagram svg .label {
          padding: 18px !important;
        }

        /* Fix clipped text */
        .mermaid-diagram svg .label text {
          dominant-baseline: central !important;
        }

        .mermaid-diagram svg tspan {
          dy: 0.35em;
          dominant-baseline: central;
        }

        /* Prevent SVG clipping */
        .mermaid-diagram svg text,
        .mermaid-diagram svg foreignObject {
          overflow: visible !important;
        }

        /* Better arrows */
        .mermaid-diagram svg .edgePath path {
          stroke-width: 2px;
        }
      `}</style>

      <div
        className="mermaid-diagram my-6 overflow-x-auto rounded-2xl bg-[#f0f5f2] p-6 shadow-sm"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </>
  );
});
