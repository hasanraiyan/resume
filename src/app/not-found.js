import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF9]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center relative overflow-hidden pt-32 pb-20">
        {/* Background ambient decorations for a premium look */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-60">
          <div className="w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] lg:w-[40vw] lg:h-[40vw] rounded-full bg-gradient-to-tr from-gray-200/50 to-transparent blur-3xl mix-blend-multiply"></div>
        </div>

        <div className="container relative z-10 px-6 mx-auto flex flex-col items-center justify-center text-center">
          <div className="relative inline-block mb-10">
            <h1 className="text-[12rem] md:text-[18rem] lg:text-[22rem] font-serif italic leading-[0.8] text-transparent bg-clip-text bg-gradient-to-b from-gray-900 via-gray-700 to-gray-200 drop-shadow-sm select-none">
              404
            </h1>
          </div>

          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 font-sans">
              Page not found
            </h2>
            <p className="text-lg md:text-xl text-gray-500 font-light leading-relaxed">
              The page you are looking for might have been removed, had its name changed, or is
              temporarily unavailable. Let&apos;s get you back on track.
            </p>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button href="/" variant="primary" size="large">
                Return Home
              </Button>
              <Button href="/#contact" variant="ghost" size="large">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
