import { Space_Grotesk, Playfair_Display } from 'next/font/google';
import './globals.css';
import '@/lib/fontawesome'; // registers all FA icons — replaces the CDN <link>
import SessionProvider from '@/components/SessionProvider';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import { SiteProvider } from '@/context/SiteContext';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';
import PWAManager from '@/components/PWAManager';
import { getHeroData } from '@/app/actions/heroActions';
import { getInitials } from '@/utils/string';
import { Analytics } from '@vercel/analytics/next';

// (Font definitions remain the same)

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-playfair',
});

export const viewport = {
  themeColor: '#1f2937',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata = {
  metadataBase: new URL('https://hasanraiyan.vercel.app'),
  title: {
    default: 'Raiyan Hasan | Freelance Next.js Developer & UI Designer',
    template: '%s | Raiyan Hasan',
  },
  description:
    'Expert freelance web developer specializing in Next.js, React, and minimalist UI design. Building high-performance, conversion-focused websites and SaaS MVPs.',
  keywords: [
    'Hire Next.js developer for SaaS MVP',
    'Convert React app to Next.js 14',
    'Freelance headless CMS developer',
    'React to Next.js Migration Expert',
    'Next.js Performance Optimization',
    'Freelance Front-end Developer for Startups',
  ],
  authors: [{ name: 'Raiyan Hasan', url: 'https://hasanraiyan.vercel.app' }],
  creator: 'Raiyan Hasan',
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  icons: {
    icon: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762069094/portfolio_assets/ckfre3frqkzgatpgmzu1.jpg',
    apple:
      'https://res.cloudinary.com/djkpavwmp/image/upload/v1762069094/portfolio_assets/ckfre3frqkzgatpgmzu1.jpg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Raiyan Hasan Portfolio',
  },
  openGraph: {
    title: 'Raiyan Hasan | Freelance Next.js Developer & UI Designer',
    description:
      'Expert freelance web developer specializing in Next.js, React, and minimalist UI design. Building high-performance, conversion-focused websites and SaaS MVPs.',
    url: 'https://hasanraiyan.vercel.app',
    siteName: 'Raiyan Hasan Portfolio',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762069094/portfolio_assets/ckfre3frqkzgatpgmzu1.jpg', // Using icon as fallback OG image for now
        width: 1200,
        height: 630,
        alt: 'Raiyan Hasan - Freelance Next.js Developer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raiyan Hasan | Freelance Next.js Developer & UI Designer',
    description:
      'Expert freelance web developer specializing in Next.js, React, and minimalist UI design. Building high-performance, conversion-focused websites and SaaS MVPs.',
    creator: '@hasanraiyan', // Assuming handle, can be updated if known
    images: [
      'https://res.cloudinary.com/djkpavwmp/image/upload/v1762069094/portfolio_assets/ckfre3frqkzgatpgmzu1.jpg',
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'JPIiaNXrg8wrdFpkbSeFxSy40-b9UdqnPfdo48j_VeQ',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Portfolio',
    'msapplication-TileColor': '#1f2937',
    'msapplication-config': '/browserconfig.xml',
  },
};

/** Default hero data used when the DB is unreachable. */
const DEFAULT_HERO = { introduction: { name: '' }, socialLinks: [] };

export default async function RootLayout({ children }) {
  // Fetch hero data via a dedicated server action that owns its own
  // try/catch. A DB failure returns null instead of crashing the layout.
  const serializedHeroData = (await getHeroData()) ?? DEFAULT_HERO;
  const initials = getInitials(serializedHeroData.introduction?.name);

  // Build JSON-LD from live DB data so sameAs stays in sync with social links.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Raiyan Hasan',
    url: 'https://hasanraiyan.vercel.app',
    jobTitle: 'Freelance Web Developer',
    sameAs: serializedHeroData.socialLinks?.map((l) => l.url).filter(Boolean) ?? [
      'https://github.com/hasanraiyan',
      'https://linkedin.com/in/hasanraiyan',
    ],
    image:
      serializedHeroData.profile?.image?.url ||
      'https://res.cloudinary.com/djkpavwmp/image/upload/v1762069094/portfolio_assets/ckfre3frqkzgatpgmzu1.jpg',
    description:
      'Expert freelance web developer specializing in Next.js, React, and minimalist UI design.',
  };

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${playfairDisplay.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-gray-50">
        <SessionProvider>
          <AnalyticsProvider>
            <SiteProvider value={{ heroData: serializedHeroData, initials }}>
              {children}
              <ChatbotWidget />
              <PWAManager />
              <Analytics />
            </SiteProvider>
          </AnalyticsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
