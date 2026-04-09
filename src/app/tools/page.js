import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Card } from '@/components/ui';

export const metadata = {
  title: 'AI Tools | Raiyan Hasan',
  description:
    'Explore my custom-built AI tools including Image Generation.',
};

const aiTools = [
  {
    id: 'image-ai',
    title: 'Image Generator',
    description:
      'Unleash your creativity with our Gemini-powered AI Image Playground. Generate stunning art from text instantly.',
    href: '/tools/image-ai',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    color: 'blue',
  },
];

export default function ToolsIndexPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9] selection:bg-neutral-800 selection:text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 tracking-tight mb-4">
            AI Tools
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl font-sans">
            Explore my experimental AI playground. These tools are powered by LangGraph, OpenAI, and
            custom fine-tuned models to demonstrate advanced generative capabilities.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {aiTools.map((tool) => (
            <Link key={tool.id} href={tool.href} className="group block h-full">
              <Card
                className={`h-full p-8 md:p-10 transition-all duration-300 border-2 border-neutral-200 hover:border-neutral-900 bg-white group-hover:shadow-[8px_8px_0px_0px_rgba(23,23,23,1)] flex flex-col`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110
                  ${tool.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}
                `}
                >
                  {tool.icon}
                </div>

                <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-4 group-hover:underline decoration-2 underline-offset-4">
                  {tool.title}
                </h2>

                <p className="text-neutral-600 font-sans leading-relaxed mb-8 flex-grow">
                  {tool.description}
                </p>

                <div className="flex items-center text-sm font-bold uppercase tracking-widest text-neutral-900 group-hover:translate-x-2 transition-transform">
                  Launch Tool
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
