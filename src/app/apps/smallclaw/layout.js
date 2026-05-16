import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'SmallClaw - Agent Studio',
  description: 'Manage AI agents, providers, and integrations.',
};

export default function SmallClawLayout({ children }) {
  return <div className={`${playfair.variable} ${inter.variable}`}>{children}</div>;
}
