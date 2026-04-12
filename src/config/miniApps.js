// Registry of mini apps shown in the admin "App Store".

export const MINI_APPS = [
  {
    id: 'snaplinks',
    name: 'SnapLinks',
    tagline: 'Manage and track short links with analytics.',
    href: '/apps/snaplinks',
    category: 'Links',
    iconSrc: '/images/apps/Snaplinks.png',
  },
  {
    id: 'pocketly',
    name: 'Pocketly',
    tagline: 'Personal finance and expense tracker workspace.',
    href: '/apps/pocketly',
    category: 'Finance',
    iconSrc: '/images/apps/pocketly.png',
  },
  {
    id: 'taskly',
    name: 'Taskly',
    tagline: 'Tasks, projects, and insights in one place.',
    href: '/apps/taskly',
    category: 'Productivity',
    iconSrc: '/images/apps/taskly.png',
  },
  {
    id: 'vaultly',
    name: 'Vaultly',
    tagline: 'Multi-provider storage drive and files manager.',
    href: '/apps/vaultly',
    category: 'Storage',
    iconSrc: '/images/apps/taskly.png', // Fallback icon
  },
];
