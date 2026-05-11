import { Pacifico, Nunito, Lora } from 'next/font/google';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
});

const nunito = Nunito({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const lora = Lora({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

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
  return (
    <div
      className={`${pacifico.variable} ${nunito.variable} ${lora.variable} font-sans min-h-screen bg-[#fcfbf5] text-[#1e3a34] selection:bg-[#1f644e]/10 selection:text-[#1f644e]`}
    >
      <div className="flex flex-col min-h-screen relative">{children}</div>
    </div>
  );
}
