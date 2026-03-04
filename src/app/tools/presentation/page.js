import { Suspense } from 'react';
import PresentationGenerator from '@/components/tools/PresentationGenerator';

export const metadata = {
  title: 'AI Presentation Synthesizer | Raiyan Hasan',
  description: 'Generate complete professional presentations from a single prompt using AI.',
};

export default function PresentationPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PresentationGenerator />
    </Suspense>
  );
}
