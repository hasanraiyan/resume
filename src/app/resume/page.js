import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Section } from '@/components/custom-ui';
import { getSiteConfig } from '@/app/actions/siteActions';

export default async function ResumePage() {
  const siteConfig = await getSiteConfig();

  const breadcrumbs = [
    { label: 'Home', path: '/', icon: 'Home' },
    { label: 'Resume', icon: 'FileText' },
  ];

  return (
    <>
      <Navbar siteConfig={siteConfig} />

      <main className="min-h-screen">
        <Section
          title="Resume"
          description="View my professional resume"
          centered={true}
          className="py-12 sm:py-18 md:py-16"
          breadcrumbs={breadcrumbs}
        >
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center space-y-4">
            <img
              src="https://res.cloudinary.com/djkpavwmp/image/upload/v1762505345/portfolio_assets/lm7rjwgpatligdjlkqau.jpg"
              alt="Resume"
              className="w-full h-auto shadow-lg rounded-lg"
            />
            {/* Add more img tags if there are multiple pages */}
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}
