'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

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

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
      <button
        onClick={() => zoomIn(0.25)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/80 hover:bg-white text-[#1f644e] font-bold text-base shadow-sm border border-[#d4e6db] transition-colors"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => zoomOut(0.25)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/80 hover:bg-white text-[#1f644e] font-bold text-base shadow-sm border border-[#d4e6db] transition-colors"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        onClick={() => resetTransform()}
        className="h-7 px-2 flex items-center justify-center rounded-lg bg-white/80 hover:bg-white text-[#1f644e] text-xs font-medium shadow-sm border border-[#d4e6db] transition-colors"
        aria-label="Reset zoom"
      >
        Reset
      </button>
    </div>
  );
}

export const MermaidDiagram = memo(function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  const idRef = useRef(`mermaid-${++uid}`);

  const sanitizeMermaid = (code) => {
    if (!code) return '';
    let sanitized = code;

    sanitized = sanitized.replace(/\\"/g, "'");
    sanitized = sanitized.replace(/\\n/g, '<br/>');

    if (
      !sanitized.trim().startsWith('graph') &&
      !sanitized.trim().startsWith('flowchart') &&
      !sanitized.trim().startsWith('sequenceDiagram') &&
      !sanitized.trim().startsWith('classDiagram') &&
      !sanitized.trim().startsWith('stateDiagram') &&
      !sanitized.trim().startsWith('erDiagram') &&
      !sanitized.trim().startsWith('gantt') &&
      !sanitized.trim().startsWith('pie') &&
      !sanitized.trim().startsWith('gitGraph') &&
      !sanitized.trim().startsWith('mindmap') &&
      !sanitized.trim().startsWith('timeline')
    ) {
      sanitized = 'graph TD\n' + sanitized;
    }

    return sanitized;
  };

  useEffect(() => {
    let cancelled = false;

    setSvg('');
    setError(null);

    async function renderDiagram() {
      try {
        const mermaid = await getMermaid();
        const sanitizedChart = sanitizeMermaid(chart);

        const { svg: renderedSvg } = await mermaid.render(idRef.current, sanitizedChart);

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
        <div className="flex justify-center mb-4">
          <div className="h-8 w-32 rounded-lg bg-[#d4e6db]" />
        </div>
        <div className="flex justify-center mb-4">
          <div className="w-0.5 h-5 bg-[#c2d8ce]" />
        </div>
        <div className="flex justify-center gap-8 mb-4">
          <div className="h-8 w-24 rounded-lg bg-[#d4e6db]" />
          <div className="h-8 w-24 rounded-lg bg-[#d4e6db]" />
        </div>
        <div className="flex justify-center gap-16 mb-4">
          <div className="w-0.5 h-5 bg-[#c2d8ce]" />
          <div className="w-0.5 h-5 bg-[#c2d8ce]" />
        </div>
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

        .mermaid-diagram svg .node rect,
        .mermaid-diagram svg .node polygon,
        .mermaid-diagram svg .node path {
          rx: 12px;
          ry: 12px;
          stroke-width: 2px;
        }

        .mermaid-diagram svg .label {
          padding: 18px !important;
        }

        .mermaid-diagram svg .label text {
          dominant-baseline: central !important;
        }

        .mermaid-diagram svg tspan {
          dy: 0.35em;
          dominant-baseline: central;
        }

        .mermaid-diagram svg text,
        .mermaid-diagram svg foreignObject {
          overflow: visible !important;
        }

        .mermaid-diagram svg .edgePath path {
          stroke-width: 2px;
        }
      `}</style>

      <div className="relative my-6 rounded-2xl bg-[#f0f5f2] shadow-sm overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={0.25}
          maxScale={3}
          doubleClick={{ disabled: false, step: 0.5 }}
          wheel={{ step: 0.1 }}
          panning={{ velocityDisabled: true }}
        >
          <ZoomControls />
          <TransformComponent
            wrapperStyle={{ width: '100%', cursor: 'grab' }}
            contentStyle={{ padding: '24px' }}
          >
            <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />
          </TransformComponent>
        </TransformWrapper>
      </div>
    </>
  );
});
