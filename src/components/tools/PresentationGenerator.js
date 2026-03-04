'use client';

import { useState } from 'react';
import { Sparkles, Brain, Wand2, RefreshCw, FileText, CheckCircle2, ChevronRight, XCircle, LayoutGrid, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { uploadFiles } from '@/utils/uploadthing';

export default function PresentationGenerator() {
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState('idle'); // idle, drafting, review, generating, uploading, complete, error
  const [errorMsg, setErrorMsg] = useState('');

  const [presentationId, setPresentationId] = useState(null);
  const [outline, setOutline] = useState(null);
  const [slides, setSlides] = useState(null);

  const handleDraftOutline = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please provide a topic for your presentation.');
      return;
    }

    setStatus('drafting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/tools/presentation/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, instructions })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to draft outline');

      setPresentationId(data.presentationId);
      setOutline(data.outline);
      setStatus('review');
    } catch (e) {
      setErrorMsg(e.message);
      setStatus('error');
    }
  };

  const handleGenerateSlides = async () => {
    setStatus('generating');
    setErrorMsg('');

    try {
      const res = await fetch('/api/tools/presentation/generate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ presentationId, outline })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate visual slides');

      setSlides(data.slides);

      // If guests, handle UploadThing base64 conversion here
      if (data.slides.some(s => s.needsUpload)) {
          setStatus('uploading');
          await handleGuestUploads(data.slides, data.presentationId);
      } else {
          setStatus('complete');
      }

    } catch (e) {
       setErrorMsg(e.message);
       setStatus('error');
    }
  };

  const handleGuestUploads = async (rawSlides, pId) => {
     try {
         // Convert base64 back to Files, skipping errors
         const validSlides = [];
         const filesToUpload = [];

         rawSlides.forEach((s, idx) => {
             if (s.imageUrl && s.imageUrl !== 'error' && s.imageUrl.startsWith('data:image')) {
                 const base64Data = s.imageUrl.split(',')[1];
                 const byteCharacters = atob(base64Data);
                 const byteNumbers = new Array(byteCharacters.length);
                 for (let i = 0; i < byteCharacters.length; i++) {
                     byteNumbers[i] = byteCharacters.charCodeAt(i);
                 }
                 const byteArray = new Uint8Array(byteNumbers);
                 const blob = new Blob([byteArray], { type: 'image/png' });
                 const file = new File([blob], `slide-${idx}.png`, { type: 'image/png' });

                 validSlides.push({ index: idx, slide: s });
                 filesToUpload.push(file);
             }
         });

         let uploadRes = [];
         if (filesToUpload.length > 0) {
             uploadRes = await uploadFiles("publicPresentationUploader", {
                files: filesToUpload,
             });
         }

         // Match uploaded URLs back to slides
         const updatedSlides = [...rawSlides];
         validSlides.forEach((validSlide, i) => {
             if (uploadRes[i]) {
                 updatedSlides[validSlide.index].imageUrl = uploadRes[i].url;
             }
             updatedSlides[validSlide.index].needsUpload = false;
         });

         // Clear the flag for any error slides as well
         updatedSlides.forEach(s => {
             s.needsUpload = false;
         });

         // Finalize with the DB
         const finalizeRes = await fetch('/api/tools/presentation/generate', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ presentationId: pId, slides: updatedSlides })
         });

         const fd = await finalizeRes.json();
         setSlides(fd.presentation?.slides || updatedSlides);
         setStatus('complete');

     } catch(e) {
         console.warn("Guest direct upload to UT failed.", e);
         setErrorMsg("Failed to finalize image uploads. Your presentation generation failed.");
         setStatus('error');
     }
  };

  const handleReset = () => {
     setTopic('');
     setInstructions('');
     setOutline(null);
     setSlides(null);
     setPresentationId(null);
     setStatus('idle');
     setErrorMsg('');
  };

  // Render Helpers

  const renderOutlineReview = () => (
     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
           <h3 className="text-2xl font-['Playfair_Display'] font-bold mb-6">Review Outline</h3>
           <p className="text-neutral-500 mb-8 text-sm">
             The AI has structured your presentation. Review the flow before generating the visual assets.
             (Slide visuals will be built around these bullet points).
           </p>

           <div className="space-y-6">
              {outline.map((slide, idx) => (
                 <div key={idx} className="p-6 border border-neutral-100 bg-neutral-50/50 rounded-2xl flex gap-6">
                    <div className="text-neutral-300 font-mono font-bold text-xl">
                       {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <div>
                       <h4 className="font-bold text-lg mb-3">{slide.title}</h4>
                       <ul className="space-y-2 mb-4">
                          {slide.points.map((p, i) => (
                             <li key={i} className="flex gap-2 text-sm text-neutral-600">
                                <span className="text-blue-500">•</span>
                                {p}
                             </li>
                          ))}
                       </ul>
                       <div className="text-xs bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 font-mono">
                          <span className="font-bold block mb-1">Visual Prompt Directive:</span>
                          {slide.visualPrompt}
                       </div>
                    </div>
                 </div>
              ))}
           </div>

           <div className="mt-8 flex justify-end gap-4 border-t border-neutral-100 pt-6">
              <button
                onClick={handleReset}
                className="px-6 py-3 text-neutral-500 hover:text-black font-medium transition-colors"
              >
                 Start Over
              </button>
              <button
                onClick={handleGenerateSlides}
                className="px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2"
              >
                 <Sparkles className="w-4 h-4" />
                 Approve & Generate Visuals
              </button>
           </div>
        </div>
     </div>
  );

  const renderSlides = () => (
     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
         <div className="flex justify-between items-end mb-8">
            <div>
               <h3 className="text-3xl font-['Playfair_Display'] font-bold mb-2">Final Presentation</h3>
               <p className="text-neutral-500 text-sm">Your executive-ready deck has been synthesized.</p>
            </div>
            <button
               onClick={handleReset}
               className="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-sm font-medium hover:border-black hover:text-black transition-all"
            >
               Create New Deck
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {slides.map((slide, idx) => (
               <div key={idx} className="bg-white rounded-[2rem] overflow-hidden border border-neutral-200 shadow-sm group">
                  <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                     {slide.imageUrl && slide.imageUrl !== 'error' ? (
                        <img
                          src={slide.imageUrl}
                          alt={slide.fallbackText}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                        />
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-red-400 gap-3">
                           <XCircle className="w-8 h-8" />
                           <p className="text-xs font-medium">Generation Failed</p>
                        </div>
                     )}

                     <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-mono font-medium">
                        Slide {(idx + 1).toString().padStart(2, '0')}
                     </div>
                  </div>

                  <div className="p-6">
                     <p className="text-xs text-neutral-400 font-mono mb-2 line-clamp-1" title={slide.prompt}>
                        {slide.prompt}
                     </p>
                     <p className="text-sm text-neutral-700 leading-relaxed line-clamp-2">
                        {slide.fallbackText}
                     </p>
                  </div>
               </div>
            ))}
         </div>
     </div>
  );

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100">
            <LayoutGrid className="w-4 h-4" />
            Presentation Synthesizer
         </div>
         <h1 className="text-5xl md:text-7xl font-['Playfair_Display'] text-black leading-tight">
            Data to <span className="italic text-neutral-400">Design</span>
         </h1>
         <p className="text-neutral-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Input raw research or a simple topic. The AI agent researches, structures a narrative outline, and synthesizes complete, high-fidelity visual slides.
         </p>
      </div>

      {errorMsg && (
         <div className="mb-8 p-4 bg-red-50 text-red-600 border border-red-200 rounded-2xl flex items-center gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
         </div>
      )}

      {/* Input Stage */}
      {status === 'idle' && (
         <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-neutral-100 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-6">
               <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                     Topic or Knowledge Base
                  </label>
                  <textarea
                     value={topic}
                     onChange={e => setTopic(e.target.value)}
                     placeholder="e.g. The impact of Generative AI on Enterprise Software Architecture..."
                     className="w-full bg-neutral-50 border-2 border-neutral-200 focus:border-black focus:ring-0 rounded-2xl p-4 text-base min-h-[120px] resize-none transition-colors"
                  />
               </div>

               <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                     Creative Direction (Optional)
                  </label>
                  <input
                     type="text"
                     value={instructions}
                     onChange={e => setInstructions(e.target.value)}
                     placeholder="e.g. Use a dark, futuristic aesthetic. Keep it strictly 5 slides."
                     className="w-full bg-neutral-50 border-2 border-neutral-200 focus:border-black focus:ring-0 rounded-2xl px-4 py-4 text-base transition-colors"
                  />
               </div>

               <button
                  onClick={handleDraftOutline}
                  disabled={!topic.trim()}
                  className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg hover:bg-neutral-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
               >
                  <Brain className="w-5 h-5" />
                  Synthesize Outline
               </button>
            </div>
         </div>
      )}

      {/* Loading Stages */}
      {(status === 'drafting' || status === 'generating' || status === 'uploading') && (
         <div className="max-w-2xl mx-auto text-center py-24 space-y-8 animate-in fade-in">
            <div className="relative w-32 h-32 mx-auto">
               <div className="absolute inset-0 border-4 border-neutral-100 rounded-full" />
               <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                  {status === 'drafting' ? <Brain className="w-8 h-8 text-black animate-pulse" /> : <Wand2 className="w-8 h-8 text-black animate-pulse" />}
               </div>
            </div>

            <div className="space-y-2">
               <h3 className="text-3xl font-['Playfair_Display'] font-bold">
                  {status === 'drafting' ? 'Extracting Narrative...' : status === 'uploading' ? 'Finalizing Assets...' : 'Synthesizing Visuals...'}
               </h3>
               <p className="text-neutral-500 max-w-sm mx-auto">
                  {status === 'drafting'
                     ? "The AI is researching your topic and structuring a logical presentation flow."
                     : "Deploying parallel visual models to render your executive deck. This may take a minute."}
               </p>
            </div>
         </div>
      )}

      {/* Review Stage */}
      {status === 'review' && outline && renderOutlineReview()}

      {/* Complete Stage */}
      {status === 'complete' && slides && renderSlides()}

    </div>
  );
}
