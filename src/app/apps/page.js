import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Section } from '@/components/ui';
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

  const breadcrumbs = [
    { label: 'Home', path: '/', icon: 'Home' },
    { label: 'Apps', icon: 'Grid' },
  ];

  return (
    <>
      <Navbar siteConfig={siteConfig} />

      <main className="min-h-screen">
        <Section
          title="Mini Apps"
          description="Launch and explore the suite of mini applications built into this portfolio"
          centered={true}
          className="py-12 sm:py-18 md:py-16"
          breadcrumbs={breadcrumbs}
        >
          <AppsPageClient />
        </Section>
      </main>

      <Footer siteConfig={siteConfig} />
    </>
  );
}
