'use client';

import { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
      flowchart: { padding: 24, nodeSpacing: 50, rankSpacing: 60, curve: 'basis' },
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

const btnCls =
  'flex items-center justify-center rounded-lg bg-white/90 hover:bg-white text-[#1f644e] font-bold shadow-sm border border-[#d4e6db] transition-colors select-none cursor-pointer';

function Controls({ onExpand }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
      <button
        onClick={() => zoomOut(0.25)}
        className={`${btnCls} w-7 h-7 text-base`}
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        onClick={() => zoomIn(0.25)}
        className={`${btnCls} w-7 h-7 text-base`}
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => resetTransform()}
        className={`${btnCls} h-7 px-2 text-xs font-medium`}
        aria-label="Reset"
      >
        Reset
      </button>
      <button onClick={onExpand} className={`${btnCls} w-7 h-7`} aria-label="Fullscreen">
        <svg
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M1 5V1h4M8 1h4v4M12 8v4H8M5 12H1V8" />
        </svg>
      </button>
    </div>
  );
}

function FullscreenControls({ onClose }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
      <button
        onClick={() => zoomOut(0.5)}
        className={`${btnCls} w-7 h-7 text-base`}
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        onClick={() => zoomIn(0.5)}
        className={`${btnCls} w-7 h-7 text-base`}
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => resetTransform()}
        className={`${btnCls} h-7 px-2 text-xs font-medium`}
        aria-label="Reset"
      >
        Reset
      </button>
      <button onClick={onClose} className={`${btnCls} w-7 h-7 text-lg`} aria-label="Close">
        ×
      </button>
    </div>
  );
}

function parseSvgDims(svgString) {
  // Mermaid v10+ sets style="max-width: Xpx;" — this is the true rendered width
  const mw = svgString.match(/max-width:\s*([\d.]+)px/)?.[1];
  const vbNums = svgString
    .match(/viewBox="([^"]+)"/)?.[1]
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  if (mw && vbNums?.length >= 4 && vbNums[2] && vbNums[3]) {
    const w = parseFloat(mw);
    const h = w * (vbNums[3] / vbNums[2]);
    return { w, h };
  }
  if (vbNums?.length >= 4 && vbNums[2] && vbNums[3]) {
    return { w: vbNums[2], h: vbNums[3] };
  }
  return null;
}

function FullscreenModal({ svg, onClose }) {
  const containerRef = useRef(null);
  const dims = useMemo(() => parseSvgDims(svg), [svg]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleInit = useCallback(
    (ref) => {
      requestAnimationFrame(() => {
        if (!ref || !containerRef.current) return;
        const pad = 48;
        const cw = containerRef.current.clientWidth - pad * 2;
        const ch = containerRef.current.clientHeight - pad * 2;
        if (!dims?.w || !dims?.h) {
          ref.centerView(1, 0);
          return;
        }
        const scale = Math.min(cw / dims.w, ch / dims.h, 2);
        ref.centerView(scale, 0);
      });
    },
    [dims]
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-7xl rounded-2xl bg-[#f0f5f2] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <TransformWrapper
          initialScale={1}
          minScale={0.05}
          maxScale={10}
          limitToBounds={false}
          wheel={{ step: 0.08 }}
          doubleClick={{ step: 0.7 }}
          panning={{ velocityDisabled: true }}
          onInit={handleInit}
        >
          <FullscreenControls onClose={onClose} />
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%', cursor: 'grab' }}
            contentStyle={{ padding: '48px' }}
          >
            {/* Explicit pixel size so centerView has accurate content dimensions */}
            <div
              className="mermaid-diagram-fs"
              style={dims ? { width: dims.w, height: dims.h } : {}}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </TransformComponent>
        </TransformWrapper>

        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-[#7c8e88] pointer-events-none select-none">
          Scroll to zoom · Drag to pan · Esc to close
        </p>
      </div>
    </div>,
    document.body
  );
}

const DIAGRAM_STYLES = `
  .mermaid-diagram { width: 100%; display: flex; justify-content: center; }
  .mermaid-diagram svg { max-width: 100%; height: auto; overflow: visible; display: block; }
  .mermaid-diagram-fs svg { width: 100%; height: 100%; max-width: none !important; overflow: visible; display: block; }
  .mermaid-diagram svg .node rect,
  .mermaid-diagram svg .node polygon,
  .mermaid-diagram svg .node path { rx: 12px; ry: 12px; stroke-width: 2px; }
  .mermaid-diagram svg .label { padding: 18px !important; }
  .mermaid-diagram svg .label text { dominant-baseline: central !important; }
  .mermaid-diagram svg tspan { dy: 0.35em; dominant-baseline: central; }
  .mermaid-diagram svg text,
  .mermaid-diagram svg foreignObject { overflow: visible !important; }
  .mermaid-diagram svg .edgePath path { stroke-width: 2px; }
`;

const VALID_TYPES = [
  'graph',
  'flowchart',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram',
  'erDiagram',
  'gantt',
  'pie',
  'gitGraph',
  'mindmap',
  'timeline',
];

function sanitize(code) {
  if (!code) return '';
  let s = code.replace(/\\"/g, "'").replace(/\\n/g, '<br/>');
  if (!VALID_TYPES.some((t) => s.trim().startsWith(t))) s = 'graph TD\n' + s;
  return s;
}

export const MermaidDiagram = memo(function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const idRef = useRef(`mermaid-${++uid}`);

  useEffect(() => {
    let cancelled = false;
    setSvg('');
    setError(null);
    (async () => {
      try {
        const mermaid = await getMermaid();
        const { svg: out } = await mermaid.render(idRef.current, sanitize(chart));
        if (!cancelled) setSvg(out);
      } catch (err) {
        if (!cancelled) setError(String(err?.message ?? err));
      }
    })();
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
      <div className="my-6 rounded-2xl bg-[#f0f5f2] p-6 animate-pulse space-y-3">
        <div className="flex justify-center">
          <div className="h-8 w-32 rounded-lg bg-[#d4e6db]" />
        </div>
        <div className="flex justify-center">
          <div className="w-0.5 h-5 bg-[#c2d8ce]" />
        </div>
        <div className="flex justify-center gap-8">
          <div className="h-8 w-24 rounded-lg bg-[#d4e6db]" />
          <div className="h-8 w-24 rounded-lg bg-[#d4e6db]" />
        </div>
        <div className="flex justify-center gap-16">
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
      <style jsx global>
        {DIAGRAM_STYLES}
      </style>

      {/* Inline view — wheel DISABLED so page scroll works normally */}
      <div className="relative my-6 rounded-2xl bg-[#f0f5f2] shadow-sm overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={0.25}
          maxScale={4}
          limitToBounds={false}
          wheel={{ disabled: true }}
          doubleClick={{ disabled: true }}
          panning={{ velocityDisabled: true }}
        >
          <Controls onExpand={() => setFullscreen(true)} />
          <TransformComponent
            wrapperStyle={{ width: '100%', cursor: 'grab' }}
            contentStyle={{ width: '100%', padding: '24px', boxSizing: 'border-box' }}
          >
            <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />
          </TransformComponent>
        </TransformWrapper>
        <p className="text-center text-[10px] text-[#b0bdb9] pb-2 select-none">
          Use + / − to zoom · drag to pan · ⤢ for fullscreen
        </p>
      </div>

      {fullscreen && <FullscreenModal svg={svg} onClose={() => setFullscreen(false)} />}
    </>
  );
});
