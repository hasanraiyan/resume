import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoMeet from '@/components/tools/VideoMeet/VideoMeet';

export const metadata = {
  title: 'Secure Video Meet | AI Playground',
  description: 'A private, secure 2-person video calling tool with passcode protection.',
};

export default function VideoMeetPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9] selection:bg-neutral-800 selection:text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 tracking-tight mb-4">
            Secure <span className="italic text-neutral-500">Video Meet</span>
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-sans">
            End-to-end encrypted peer-to-peer video calls. Private, secure, and ephemeral.
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <VideoMeet />
        </div>
      </div>

      <Footer />
    </main>
  );
}
