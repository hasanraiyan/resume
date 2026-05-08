'use client';

import { useEffect, useRef, useState } from 'react';

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
      themeVariables: {
        primaryColor: '#e8f5ee',
        primaryTextColor: '#1e3a34',
        primaryBorderColor: '#1f644e',
        lineColor: '#1f644e',
        secondaryColor: '#f0f5f2',
        tertiaryColor: '#fcfbf5',
        fontFamily: 'inherit',
        fontSize: '13px',
      },
    });
    mermaidReady = true;
  }
  return mermaidInstance;
}

let uid = 0;

export function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const idRef = useRef(`mermaid-${++uid}`);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setSvg('');

    getMermaid()
      .then((m) => m.render(idRef.current, chart))
      .then(({ svg: rendered }) => {
        if (!cancelled) setSvg(rendered);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err?.message ?? err));
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <pre className="rounded-xl overflow-x-auto p-4 text-xs bg-[#fff3f3] text-red-700 border border-red-200 my-6">
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 flex items-center justify-center h-24 rounded-xl bg-[#f0f5f2] text-[#7c8e88] text-xs animate-pulse">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className="my-6 overflow-x-auto rounded-xl bg-[#f0f5f2] p-4 flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
