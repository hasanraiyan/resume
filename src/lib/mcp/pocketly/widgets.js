import { POCKETLY_WIDGET_DOMAIN, POCKETLY_WIDGET_MIME_TYPE } from './constants.js';
import { POCKETLY_WIDGET_STYLES } from '../../../components/pocketly-mcp/styles.js';

export function getWidgetMetadata(description) {
  return {
    ui: {
      prefersBorder: true,
      domain: POCKETLY_WIDGET_DOMAIN,
      csp: {
        connectDomains: [POCKETLY_WIDGET_DOMAIN],
        resourceDomains: [POCKETLY_WIDGET_DOMAIN],
      },
    },
    'openai/widgetDescription': description,
    'openai/widgetPrefersBorder': true,
    'openai/widgetCSP': {
      connect_domains: [POCKETLY_WIDGET_DOMAIN],
      resource_domains: [POCKETLY_WIDGET_DOMAIN],
    },
    'openai/widgetDomain': POCKETLY_WIDGET_DOMAIN,
  };
}

export function registerPocketlyWidget(server, widget, kind) {
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
          mimeType: POCKETLY_WIDGET_MIME_TYPE,
          text: getPocketlyWidgetHtml(kind),
          _meta: getWidgetMetadata(widget.description),
        },
      ],
    })
  );
}

export function getPocketlyWidgetHtml(kind) {
  return `
<div id="pocketly-root" data-kind="${kind}"></div>
<style>${POCKETLY_WIDGET_STYLES}</style>
<script>
  window.__POCKETLY_WIDGET_CONFIG__ = {
    assetBaseUrl: '${POCKETLY_WIDGET_DOMAIN}'
  };
</script>
<script src="${POCKETLY_WIDGET_DOMAIN}/mcp/pocketly-widget-v2.js"></script>
  `.trim();
}
