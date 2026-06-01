import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PocketlyWidget, getToolNameForKind } from './PocketlyWidget.jsx';

const rootElement = document.getElementById('pocketly-root');
const preferredKind = rootElement?.dataset.kind || 'summary';
const assetBaseUrl = window.__POCKETLY_WIDGET_CONFIG__?.assetBaseUrl || '';

function syncHostMaxHeight() {
  const value = Number(window.openai?.maxHeight);
  const maxHeight = Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
  if (maxHeight) {
    document.documentElement.style.setProperty('--pocketly-host-max-height', `${maxHeight}px`);
  } else {
    document.documentElement.style.removeProperty('--pocketly-host-max-height');
  }
}

function notifyIntrinsicHeight() {
  syncHostMaxHeight();
  const shell = rootElement?.querySelector('.shell');
  const height = Math.ceil(
    Math.max(
      rootElement?.scrollHeight || 0,
      shell?.scrollHeight || 0,
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      280
    )
  );
  window.openai?.notifyIntrinsicHeight?.(height);
}

function extractStructuredData(resultOrParams) {
  if (!resultOrParams) return null;

  // 1. Prioritize _meta.structuredContent (contains the exact raw array/object output)
  if (resultOrParams._meta?.structuredContent) {
    return resultOrParams._meta.structuredContent;
  }

  // 2. Check direct structuredContent (and unwrap if it was defensively wrapped as `{ items: [...] }`)
  if (resultOrParams.structuredContent) {
    const data = resultOrParams.structuredContent;
    if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
      return data.items;
    }
    return data;
  }

  // 3. Fallback: Parse from text content
  const content = resultOrParams.content || resultOrParams.result?.content;
  if (Array.isArray(content) && content.length > 0) {
    const textBlock = content.find((c) => c && c.type === 'text');
    if (textBlock?.text) {
      try {
        return JSON.parse(textBlock.text);
      } catch (e) {
        // ignore
      }
    }
  }

  return null;
}

function App() {
  const [data, setData] = useState(() => {
    const initial = window.openai?.toolOutput;
    return extractStructuredData(initial) || initial;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const frameRef = useRef(null);
  const renderedKind = data?.kind || preferredKind;

  const scheduleHeight = useCallback(() => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      notifyIntrinsicHeight();
    });
  }, []);

  const refreshCurrentView = useCallback(async () => {
    const toolName = getToolNameForKind(renderedKind);
    setIsRefreshing(true);
    try {
      if (window.openai?.callTool) {
        const result = await window.openai.callTool(toolName, {});
        const extracted = extractStructuredData(result);
        setData(extracted || result);
        return;
      }
      window.parent.postMessage(
        {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: toolName, arguments: {} },
        },
        '*'
      );
    } finally {
      setIsRefreshing(false);
      scheduleHeight();
    }
  }, [renderedKind, scheduleHeight]);

  useLayoutEffect(() => {
    scheduleHeight();
  }, [data, isRefreshing, scheduleHeight]);

  useEffect(() => {
    const handleResize = () => scheduleHeight();
    const handleLoad = () => scheduleHeight();
    const handleGlobals = (event) => {
      syncHostMaxHeight();
      const nextData = event.detail?.globals?.toolOutput || window.openai?.toolOutput;
      setData(extractStructuredData(nextData) || nextData);
    };
    const handleMessage = (event) => {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== '2.0') return;
      if (message.method === 'ui/notifications/tool-result') {
        const extracted =
          extractStructuredData(message.params) || extractStructuredData(message.params?.result);
        setData(extracted || message.params);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('openai:set_globals', handleGlobals, { passive: true });
    window.addEventListener('message', handleMessage, { passive: true });
    rootElement?.addEventListener('load', handleLoad, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('openai:set_globals', handleGlobals);
      window.removeEventListener('message', handleMessage);
      rootElement?.removeEventListener('load', handleLoad, true);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [scheduleHeight]);

  return (
    <PocketlyWidget
      data={data}
      preferredKind={preferredKind}
      onRefresh={refreshCurrentView}
      isRefreshing={isRefreshing}
      assetBaseUrl={assetBaseUrl}
    />
  );
}

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
