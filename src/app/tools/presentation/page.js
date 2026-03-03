import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PresentationBuilder from '@/components/tools/PresentationBuilder';

export const metadata = {
  title: 'AI Presentation Builder | Nano Banana Pro',
  description:
    'Transform raw notes and topics into professional, highly structured, visually compelling 16:9 presentations driven by narrative intelligence.',
};

export default function PresentationPage() {
  return (
    <main className="min-h-screen bg-white selection:bg-blue-500/30">
      <Navbar />

      {/* Dynamic Background Element */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse duration-[4000ms]" />
      </div>

      <div className="relative pt-24 pb-20 z-10">
        <PresentationBuilder />
      </div>

      <Footer />
    </main>
  );
}
