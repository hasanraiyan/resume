import { SNAPLINKS_WIDGET_DOMAIN, SNAPLINKS_WIDGET_MIME_TYPE } from './constants.js';

export function getWidgetMetadata(description) {
  return {
    ui: {
      prefersBorder: true,
      domain: SNAPLINKS_WIDGET_DOMAIN,
      csp: {
        connectDomains: [SNAPLINKS_WIDGET_DOMAIN],
        resourceDomains: [SNAPLINKS_WIDGET_DOMAIN],
      },
    },
    'openai/widgetDescription': description,
    'openai/widgetPrefersBorder': true,
    'openai/widgetCSP': {
      connect_domains: [SNAPLINKS_WIDGET_DOMAIN],
      resource_domains: [SNAPLINKS_WIDGET_DOMAIN],
    },
    'openai/widgetDomain': SNAPLINKS_WIDGET_DOMAIN,
  };
}

export function registerSnaplinksWidget(server, widget, kind) {
  server.registerResource(
    widget.name,
    widget.uri,
    {
      title: widget.title,
      description: widget.description,
    },
    async () => ({
      contents: [
        {
          uri: widget.uri,
          mimeType: SNAPLINKS_WIDGET_MIME_TYPE,
          text: getSnaplinksWidgetHtml(kind),
          _meta: getWidgetMetadata(widget.description),
        },
      ],
    })
  );
}

export function getSnaplinksWidgetHtml(kind) {
  return `
<div id="snaplinks-root" data-kind="${kind}"></div>
<style>
  :root {
    color-scheme: light;
    --bg: #fcfbf5;
    --card: #ffffff;
    --primary: #1f644e;
    --primary-soft: #f0f5f2;
    --primary-hover: #17503e;
    --text: #1e3a34;
    --muted: #7c8e88;
    --border: #e5e3d8;
    --expense: #c94c4c;
    --danger-soft: #fef2f2;
    --blue: #4a86e8;
    --purple: #9333ea;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .shell { min-height: 100vh; padding: 16px; background: var(--bg); }
  .header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .brand { min-width: 0; }
  .eyebrow { margin: 0 0 4px; color: var(--muted); font-size: 11px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }
  .title { margin: 0; color: var(--primary); font-size: 16px; line-height: 1.2; font-weight: 900; }
  .note { color: var(--muted); font-size: 11px; font-weight: 800; }
  .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
  .stat { min-width: 0; border: 1px solid var(--border); background: var(--card); border-radius: 12px; padding: 10px; text-align: center; }
  .stat-label { margin: 0; color: var(--muted); font-size: 10px; line-height: 1.2; letter-spacing: .04em; text-transform: uppercase; font-weight: 900; }
  .stat-value { margin: 5px 0 0; color: var(--text); font-size: 14px; line-height: 1.15; font-weight: 900; overflow-wrap: anywhere; }
  .section-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 12px 0 8px; }
  .section-title { margin: 0; color: var(--primary); font-size: 13px; font-weight: 900; }
  .grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .card { border: 1px solid var(--border); background: var(--card); border-radius: 12px; padding: 12px; }
  .record { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px; border-top: 1px solid var(--border); }
  .record:first-child { border-top: 0; }
  .record-left { display: flex; gap: 10px; align-items: center; min-width: 0; }
  .amount { flex: none; font-size: 13px; font-weight: 900; font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--primary); }
  .icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; flex: none; background: var(--primary-soft); color: var(--primary); border: 1px solid #d9e6df; }
  .icon svg { width: 24px; height: 24px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .card-main { min-width: 0; flex: 1; }
  .card-title { margin: 0; color: var(--text); font-size: 13px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-meta { margin: 3px 0 0; color: var(--muted); font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .empty { border: 1px dashed var(--border); background: rgba(255,255,255,.58); border-radius: 12px; padding: 28px 14px; color: var(--muted); text-align: center; font-size: 13px; font-weight: 800; }
  .followups { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .pill { border: 1px solid #d9e6df; background: var(--primary); color: white; border-radius: 999px; padding: 9px 12px; font-size: 12px; font-weight: 900; cursor: pointer; }
</style>
<script>
  (function () {
    const root = document.getElementById('snaplinks-root');
    const preferredKind = root.dataset.kind;

    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, function (char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
      });
    }

    function followUp(text) {
      if (window.openai?.sendFollowUpMessage) {
        window.openai.sendFollowUpMessage({ prompt: text });
        return;
      }
      window.parent.postMessage({
        jsonrpc: '2.0',
        method: 'ui/message',
        params: { role: 'user', content: [{ type: 'text', text }] }
      }, '*');
    }

    function svgIcon(name) {
      if (name === 'link') return '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
      if (name === 'bar-chart') return '<svg viewBox="0 0 24 24"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>';
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
    }

    function stat(label, value) {
      return '<div class="stat"><div><p class="stat-label">' + escapeHtml(label) + '</p><p class="stat-value">' + escapeHtml(value) + '</p></div></div>';
    }

    function renderLinks(data) {
      const links = data.links || [];
      const stats = data.stats || {};
      const rows = links.length
        ? '<div class="card" style="padding: 0;">' + links.map(function (link) {
            return '<div class="record">' +
              '<div class="record-left"><div class="icon">' + svgIcon('link') + '</div>' +
              '<div class="card-main"><p class="card-title">' + escapeHtml(link.slug) + '</p><p class="card-meta">' + escapeHtml(link.destination) + '</p></div></div>' +
              '<div class="amount">' + link.totalClicks + ' clicks</div>' +
            '</div>';
          }).join('') + '</div>'
        : '<div class="empty">No short links found.</div>';

      return '<main class="shell">' +
        '<div class="header"><div class="brand"><p class="eyebrow">Snaplinks</p><h1 class="title">Short Links</h1></div><span class="note">' + links.length + ' links</span></div>' +
        '<div class="summary">' +
          stat('Total Links', String(stats.totalLinks || 0)) +
          stat('Active', String(stats.activeLinks || 0)) +
          stat('Total Clicks', String(stats.totalClicks || 0)) +
        '</div>' +
        rows +
        '<div class="followups"><button id="analyze-links" class="pill">Analyze top links</button></div>' +
      '</main>';
    }

    function renderAnalytics(data) {
      const stats = data.stats || {};
      const referrers = data.topReferrers || [];
      const rows = referrers.length
        ? '<div class="card" style="padding: 0;">' + referrers.map(function (ref) {
            return '<div class="record">' +
              '<div class="record-left"><div class="icon">' + svgIcon('bar-chart') + '</div>' +
              '<div class="card-main"><p class="card-title">' + escapeHtml(ref.referrer || 'Direct') + '</p></div></div>' +
              '<div class="amount">' + ref.count + ' clicks</div>' +
            '</div>';
          }).join('') + '</div>'
        : '<div class="empty">No traffic data for this period.</div>';

      return '<main class="shell">' +
        '<div class="header"><div class="brand"><p class="eyebrow">Snaplinks Analytics</p><h1 class="title">/' + escapeHtml(data.slug) + '</h1></div><span class="note">' + (data.windowDays || 30) + ' days</span></div>' +
        '<div class="summary">' +
          stat('Total Clicks', String(stats.totalClicksWindow || 0)) +
          stat('Unique Visitors', String(stats.uniqueVisitors || 0)) +
        '</div>' +
        '<div class="section-head"><h2 class="section-title">Top Referrers</h2></div>' +
        rows +
      '</main>';
    }

    function render(data) {
      const kind = data?.kind || preferredKind;
      if (!data) {
        root.innerHTML = '<main class="shell"><div class="empty">Ask ChatGPT to load this Snaplinks view.</div></main>';
        return;
      }
      if (kind === 'links') root.innerHTML = renderLinks(data);
      else if (kind === 'analytics') root.innerHTML = renderAnalytics(data);

      document.getElementById('analyze-links')?.addEventListener('click', function () {
        followUp('Analyze the traffic for my most clicked Snaplinks.');
      });
    }

    render(window.openai?.toolOutput);
    window.addEventListener('openai:set_globals', function (event) {
      render(event.detail?.globals?.toolOutput || window.openai?.toolOutput);
    }, { passive: true });
    window.addEventListener('message', function (event) {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== '2.0') return;
      if (message.method === 'ui/notifications/tool-result') {
        render(message.params?.structuredContent);
      }
    }, { passive: true });
  })();
</script>
  `.trim();
}
