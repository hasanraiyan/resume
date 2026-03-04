import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PresentationGenerator from '@/components/tools/PresentationGenerator';

export const metadata = {
  title: 'AI Presentation Synthesizer | Raiyan Hasan',
  description: 'Generate complete professional presentations from a single prompt.',
};

export default function PresentationPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        <PresentationGenerator />
      </main>

      <Footer />
    </div>
  );
}
