// src/app/tools/image-ai/page.js
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ImageAIPlayground from '@/components/tools/ImageAIPlayground';

export const metadata = {
  title: 'AI Creative Studio | Image Generator & Editor',
  description:
    'Unleash your creativity with our Gemini-powered AI Image Playground. Generate stunning art from text or transform existing photos instantly.',
};

export default function AIPlaygroundPage() {
  return (
    <main className="min-h-screen bg-white selection:bg-blue-500/30">
      <Navbar />

      {/* Dynamic Background Element */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse duration-[4000ms]" />
      </div>

      <div className="relative pt-24 pb-20">
        <ImageAIPlayground />
      </div>

      <Footer />
    </main>
  );
}
