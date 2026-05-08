export const metadata = {
  title: {
    default: 'Coursify — Free Courses',
    template: '%s | Coursify',
  },
  description:
    'Explore free, well-crafted courses on a variety of topics. Read at your own pace — no account required.',
  keywords: ['free courses', 'online learning', 'tutorials', 'coursify'],
  openGraph: {
    title: 'Coursify — Free Courses',
    description:
      'Explore free, well-crafted courses on a variety of topics. Read at your own pace — no account required.',
    images: [{ url: '/images/apps/coursify.png', width: 512, height: 512, alt: 'Coursify' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Coursify — Free Courses',
    description: 'Explore free courses. Read at your own pace, no account required.',
    images: ['/images/apps/coursify.png'],
  },
};

export default function CoursifyLayout({ children }) {
  return children;
}
