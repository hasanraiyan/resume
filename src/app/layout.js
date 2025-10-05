import { Space_Grotesk, Playfair_Display } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import { SiteProvider } from '@/context/SiteContext';
import dbConnect from '@/lib/dbConnect';
import HeroSection from '@/models/HeroSection';
import { serializeForClient } from '@/lib/serialize';

// (Font definitions remain the same)

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-playfair',
})

// Helper to generate initials
const getInitials = (name = '') => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export const metadata = {
  title: 'Portfolio - Minimalist Creative',
  description: 'Creative Developer Portfolio',
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
          <SessionProvider>
            <SiteProvider value={{ heroData: serializedHeroData, initials }}>
              {children}
            </SiteProvider>
          </SessionProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}