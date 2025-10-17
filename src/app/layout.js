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

export const metadata = {
  title: 'Portfolio - Minimalist Creative',
  description: 'Creative Developer Portfolio',
  manifest: '/manifest.json',
  themeColor: '#1f2937',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Portfolio',
  },
  openGraph: {
    title: 'Portfolio - Minimalist Creative',
    description: 'Creative Developer Portfolio',
    type: 'website',
    locale: 'en_US',
    siteName: 'Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio - Minimalist Creative',
    description: 'Creative Developer Portfolio',
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
      </head>
      <body className="bg-gray-50">
        <AnalyticsProvider>
          <CursorProvider>
            {' '}
            {/* Wrap with CursorProvider */}
            <SessionProvider>
              <SiteProvider value={{ heroData: serializedHeroData, initials }}>
                {children}
                <ChatbotWidget />
                <PWAManager />
              </SiteProvider>
            </SessionProvider>
          </CursorProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
