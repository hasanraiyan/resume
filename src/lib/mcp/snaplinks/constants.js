export const SNAPLINKS_WIDGET_DOMAIN = 'https://hasanraiyan.me';
export const SNAPLINKS_WIDGET_MIME_TYPE = 'text/html;profile=mcp-app';

export const WIDGETS = {
  links: {
    name: 'snaplinks-list',
    uri: 'ui://widget/snaplinks-list-v1.html',
    title: 'Snaplinks Shortlinks',
    description: 'List of short links managed by Snaplinks.',
  },
  analytics: {
    name: 'snaplinks-analytics',
    uri: 'ui://widget/snaplinks-analytics-v1.html',
    title: 'Snaplinks Analytics',
    description: 'Analytics summary for short links including total clicks and top referrers.',
  },
};

export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  openWorldHint: false,
  destructiveHint: false,
  idempotentHint: true,
};

export const MUTATION_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: false,
};

export const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: true,
};
