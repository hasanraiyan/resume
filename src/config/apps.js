// Central registry for suite apps (SnapLinks, Pocketly, Taskly)

export const MINI_APPS = [
  {
    id: 'snaplinks',
    name: 'SnapLinks',
    tagline: 'Manage and track your short links.',
    href: '/snaplinks',
    category: 'Links',
    iconSrc: '/images/apps/Snaplinks.png',
  },
  {
    id: 'pocketly',
    name: 'Pocketly',
    tagline: 'Personal finance and expense tracker.',
    href: '/pocketly',
    category: 'Finance',
    iconSrc: '/images/apps/pocketly.png',
  },
  {
    id: 'taskly',
    name: 'Taskly',
    tagline: 'Personal project and task workspace.',
    href: '/taskly',
    category: 'Productivity',
    iconSrc: '/images/apps/taskly.png',
  },
  {
    id: 'vaultly',
    name: 'Vaultly',
    tagline: 'Multi-provider storage drive.',
    href: '/apps/vaultly',
    category: 'Storage',
    iconSrc: '/images/apps/taskly.png', // Fallback icon
  },
];
