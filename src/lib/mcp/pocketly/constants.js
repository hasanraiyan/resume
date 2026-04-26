export const POCKETLY_WIDGET_DOMAIN = 'https://hasanraiyan.me';
export const POCKETLY_WIDGET_MIME_TYPE = 'text/html;profile=mcp-app';

export const WIDGETS = {
  accounts: {
    name: 'pocketly-accounts',
    uri: 'ui://widget/pocketly-accounts-v2.html',
    title: 'Pocketly Accounts',
    description: 'Account balance cards styled like the Pocketly Accounts tab.',
  },
  transactions: {
    name: 'pocketly-records',
    uri: 'ui://widget/pocketly-records-v2.html',
    title: 'Pocketly Records',
    description: 'Recent transaction rows styled like the Pocketly Records tab.',
  },
  budgets: {
    name: 'pocketly-budgets',
    uri: 'ui://widget/pocketly-budgets-v2.html',
    title: 'Pocketly Budgets',
    description: 'Budget progress cards styled like Pocketly planning.',
  },
  summary: {
    name: 'pocketly-summary',
    uri: 'ui://widget/pocketly-summary-v2.html',
    title: 'Pocketly Summary',
    description: 'Financial summary cards and top categories styled like Pocketly analysis.',
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
