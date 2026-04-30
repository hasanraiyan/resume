import { Space_Grotesk, Playfair_Display } from 'next/font/google';
import './globals.css';
import '@/lib/fontawesome'; // registers all FA icons — replaces the CDN <link>
import SessionProvider from '@/components/SessionProvider';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import { SiteProvider } from '@/context/SiteContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';
import PWAManager from '@/components/PWAManager';
import { getHeroData } from '@/app/actions/heroActions';
import { getSiteConfig } from '@/app/actions/siteActions';
import { getBaseUrl } from '@/lib/mcp/oauth';
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

/**
 * Generates dynamic metadata for the site based on SiteConfig.
 */
export async function generateMetadata() {
  const siteConfig = await getSiteConfig();
  const defaultTitle = siteConfig?.siteName || 'Portfolio';
  const ownerName = siteConfig?.ownerName || 'Admin';
  const description = siteConfig?.seo?.description || 'Modern portfolio.';
  const keywords = siteConfig?.seo?.keywords || [];

  return {
    metadataBase: new URL(getBaseUrl()),
    title: {
      default: `${ownerName} | ${defaultTitle}`,
      template: `%s | ${ownerName}`,
    },
    description,
    keywords:
      keywords.length > 0
        ? keywords
        : [
            'Hire Next.js developer for SaaS MVP',
            'Convert React app to Next.js 14',
            'Freelance headless CMS developer',
          ],
    authors: [{ name: ownerName, url: getBaseUrl() }],
    creator: ownerName,
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
      title: `${ownerName} Portfolio`,
    },
    openGraph: {
      title: `${ownerName} | ${defaultTitle}`,
      description,
      url: getBaseUrl(),
      siteName: `${ownerName} Portfolio`,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762069094/portfolio_assets/ckfre3frqkzgatpgmzu1.jpg',
          width: 1200,
          height: 630,
          alt: `${ownerName} - Freelance Next.js Developer`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${ownerName} | ${defaultTitle}`,
      description,
      creator: '@hasanraiyan',
      images: [
        'https://res.cloudinary.com/djkpavwmp/image/upload/v1762069094/portfolio_assets/ckfre3frqkzgatpgmzu1.jpg',
      ],
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: 'JPIiaNXrg8wrdFpkbSeFxSy40-b9UdqnPfdo48j_VeQ',
    },
  };
}

/** Default hero data used when the DB is unreachable. */
const DEFAULT_HERO = { introduction: { name: '' }, socialLinks: [] };

export default async function RootLayout({ children }) {
  // Fetch hero data via a dedicated server action that owns its own
  // try/catch. A DB failure returns null instead of crashing the layout.
  const serializedHeroData = (await getHeroData()) ?? DEFAULT_HERO;
  const initials = getInitials(serializedHeroData.introduction?.name);

  // Fetch site config for JSON-LD
  const siteConfig = await getSiteConfig();
  const ownerName = siteConfig?.ownerName || 'Admin';

  // Build JSON-LD from live DB data so sameAs stays in sync with social links.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: ownerName,
    url: 'https://hasanraiyan.me',
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
        <TooltipProvider>
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
        </TooltipProvider>
      </body>
    </html>
  );
}
