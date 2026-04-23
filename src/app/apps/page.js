import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AppsPageClient from '@/components/apps/AppsPageClient';
import { getSiteConfig } from '@/app/actions/siteActions';

export const metadata = {
  title: 'Apps — Portfolio Mini Applications',
  description:
    'Explore and launch mini apps: SnapLinks, Pocketly, Taskly, Vaultly, and Memo Scribe.',
  alternates: {
    canonical: '/apps',
  },
};

export default async function AppsPage() {
  const siteConfig = await getSiteConfig();

  return (
    <>
      <Navbar siteConfig={siteConfig} />

      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <AppsPageClient />
        </div>
      </main>

      <Footer siteConfig={siteConfig} />
    </>
  );
}
