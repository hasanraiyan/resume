import { Space_Grotesk, Playfair_Display } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import { SiteProvider } from '@/context/SiteContext';
import { CursorProvider } from '@/context/CursorContext'; // Import CursorProvider
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';
import PWAManager from '@/components/PWAManager';
import dbConnect from '@/lib/dbConnect';
import HeroSection from '@/models/HeroSection';
import { serializeForClient } from '@/lib/serialize';
import Script from 'next/script';
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

// Helper to generate initials
const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

export const viewport = {
  themeColor: '#1f2937',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Raiyan Hasan',
  url: 'https://hasanraiyan.vercel.app',
  jobTitle: 'Freelance Web Developer',
  sameAs: ['https://github.com/hasanraiyan', 'https://linkedin.com/in/hasanraiyan'],
  image:
    'https://res.cloudinary.com/djkpavwmp/image/upload/v1762069094/portfolio_assets/ckfre3frqkzgatpgmzu1.jpg',
  description:
    'Expert freelance web developer specializing in Next.js, React, and minimalist UI design.',
};

export default async function RootLayout({ children }) {
  await dbConnect();
  let heroData = await HeroSection.findOne({ isActive: true }).lean();
  if (!heroData) {
    heroData = await HeroSection.seedDefault();
  }

  const serializedHeroData = serializeForClient(heroData);
  const initials = getInitials(serializedHeroData.introduction?.name);

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${playfairDisplay.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-gray-50">
        <SessionProvider>
          <AnalyticsProvider>
            <CursorProvider>
              {' '}
              {/* Wrap with CursorProvider */}
              <SiteProvider value={{ heroData: serializedHeroData, initials }}>
                {children}
                <ChatbotWidget />
                <PWAManager />
                <Analytics />
              </SiteProvider>
            </CursorProvider>
          </AnalyticsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
