import { Playfair_Display, Inter } from 'next/font/google';
import { SmallClawProvider } from '@/context/SmallClawContext';
import AdminGuard from '@/components/AdminGuard';
import SmallClawAppLayout from '@/components/apps/smallclaw/SmallClawAppLayout';

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
  return (
    <div className={`${playfair.variable} ${inter.variable}`}>
      <SmallClawProvider>
        <AdminGuard appName="SmallClaw">
          <SmallClawAppLayout>{children}</SmallClawAppLayout>
        </AdminGuard>
      </SmallClawProvider>
    </div>
  );
}
