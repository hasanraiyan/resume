'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Download, Image as ImageIcon, FileText, ChevronRight, Layout } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';

export default function PresentationBuilder() {
  const [topic, setTopic] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  const [slides, setSlides] = useState([]); // [{...slideData, generatedImage: null}]

  const generateStructure = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic or source material.');
      return;
    }

    setIsGeneratingStructure(true);
    setSlides([]);

    try {
      const response = await fetch('/api/tools/presentation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, numSlides }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Init slides with null for images
        const initialSlides = data.presentation.slides.map(slide => ({
            ...slide,
            generatedImage: null, // will hold the URL
        }));
        setSlides(initialSlides);
        toast.success('Presentation outline generated!');
      } else {
        throw new Error(data.error || 'Failed to generate presentation');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error communicating with AI.');
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  const generateSlideImages = async () => {
    if (slides.length === 0) return;

    setIsGeneratingImages(true);
    toast.info('Starting image generation (Nano Banana Pro)...');

    const updatedSlides = [...slides];

    for (let i = 0; i < updatedSlides.length; i++) {
       const slide = updatedSlides[i];

       if (slide.generatedImage) continue; // skip if already generated

       try {
           const response = await fetch('/api/media/generate', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                prompt: slide.imagePrompt,
                aspectRatio: '16:9',
             })
           });

           const data = await response.json();

           if (response.ok && data.success && data.asset) {
               updatedSlides[i] = { ...slide, generatedImage: data.asset.secure_url || data.asset.url };
               setSlides([...updatedSlides]); // Force re-render to show progress
               toast.success(`Generated image for slide ${i + 1}`);
           } else {
               toast.error(`Failed to generate image for slide ${i + 1}`);
           }
       } catch(err) {
           console.error('Image gen error on slide', i, err);
           toast.error(`Error on slide ${i + 1}`);
       }
    }

    setIsGeneratingImages(false);
    toast.success('All image generation finished.');
  };

  // --- EXPORTS ---

  const exportToPPT = async () => {
    if (slides.length === 0) return;
    toast.info('Generating PowerPoint...');

    let pres = new pptxgen();

    for (const slide of slides) {
        let pptSlide = pres.addSlide();

        // Add Title
        pptSlide.addText(slide.title, {
            x: 0.5, y: 0.5, w: '90%', h: 1,
            fontSize: 24, bold: true, color: '363636', align: 'center'
        });

        // Add Content (strip simple markdown for basic PPT)
        const plainContent = slide.content.replace(/[*#]/g, '').trim();

        // If we have an image, split the slide
        if (slide.generatedImage) {
            // Text on left
            pptSlide.addText(plainContent, {
                x: 0.5, y: 1.5, w: '40%', h: 4,
                fontSize: 14, color: '666666', valign: 'top', bullet: true
            });
            // Image on right (approx 16:9 box)
            try {
               pptSlide.addImage({
                   path: slide.generatedImage,
                   x: 5.0, y: 1.5, w: 4.5, h: 2.53 // 16:9 ratio approx
               });
            } catch (e) { console.error("Could not add image", e) }
        } else {
             // Just text
             pptSlide.addText(plainContent, {
                x: 0.5, y: 1.5, w: '90%', h: 4,
                fontSize: 16, color: '666666', valign: 'top', bullet: true
            });
        }

        // Notes
        if (slide.speakerNotes) {
             pptSlide.addNotes(slide.speakerNotes);
        }
    }

    pres.writeFile({ fileName: 'Presentation.pptx' });
    toast.success('PowerPoint Downloaded!');
  };

  const exportToPDF = async () => {
    if (slides.length === 0) return;
    toast.info('Generating PDF...');

    try {
        // Create landscape PDF
        const doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: [10, 5.625] }); // 16:9

        for (let i = 0; i < slides.length; i++) {
            if (i > 0) doc.addPage();
            const slide = slides[i];

            doc.setFontSize(24);
            doc.setTextColor(50, 50, 50);
            doc.text(slide.title, 0.5, 0.8, { maxWidth: 9 });

            doc.setFontSize(14);
            doc.setTextColor(100, 100, 100);

            const plainContent = slide.content.replace(/[*#]/g, '').trim();

            if (slide.generatedImage) {
               doc.text(plainContent, 0.5, 1.5, { maxWidth: 4.5 });

               // Fetch image to use in PDF
               try {
                   // Add a simple border/placeholder text just in case the fetch fails
                   doc.text("[Image rendered in PPT export. View slide below.]", 5.5, 1.5);
               } catch (e) {
                   console.error("Could not add image to PDF", e);
               }
            } else {
               doc.text(plainContent, 0.5, 1.5, { maxWidth: 9 });
            }
        }

        doc.save('Presentation.pdf');
        toast.success('PDF Downloaded!');
    } catch (e) {
        console.error("PDF generation error", e);
        toast.error('Failed to generate PDF.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
          <Layout className="w-4 h-4" />
          Nano Banana Pro Synthesis
        </div>
        <h1 className="text-4xl font-light tracking-tight text-slate-900">
          Agentic Presentation Builder
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Transform your raw notes and topics into highly structured, visually compelling 16:9 presentations driven by narrative intelligence and precise AI image synthesis.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Source Material or Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Paste your document, notes, or describe your presentation topic here..."
              className="w-full h-32 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-shadow"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">
                Number of Slides
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={numSlides}
                onChange={(e) => setNumSlides(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={generateStructure}
              disabled={isGeneratingStructure}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isGeneratingStructure ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting Narrative Spine...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Presentation Outline
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Slides Preview Section */}
      {slides.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Generated Slides</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={generateSlideImages}
                disabled={isGeneratingImages || slides.every(s => s.generatedImage)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isGeneratingImages ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                Generate 16:9 Visuals
              </button>

              <div className="h-6 w-px bg-slate-200"></div>

              <button
                onClick={exportToPPT}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PPT
              </button>
              <button
                onClick={exportToPDF}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {slides.map((slide, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
                 {/* Visual Area (16:9) */}
                 <div className="md:w-1/2 aspect-video bg-slate-100 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-200 p-6">
                    {slide.generatedImage ? (
                        <img
                            src={slide.generatedImage}
                            alt={slide.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-center space-y-2">
                           <ImageIcon className="w-8 h-8 mx-auto text-slate-400" />
                           <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                               <span className="font-semibold block mb-1">Image Prompt (7-Part Anatomy)</span>
                               {slide.imagePrompt}
                           </p>
                        </div>
                    )}
                 </div>

                 {/* Content Area */}
                 <div className="md:w-1/2 p-6 flex flex-col justify-center space-y-4 bg-white">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Slide {slide.slideNumber}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 font-serif leading-tight">
                        {slide.title}
                    </h3>
                    <div className="prose prose-sm prose-slate text-slate-600 leading-relaxed">
                        <ReactMarkdown>{slide.content}</ReactMarkdown>
                    </div>

                    {/* Speaker Notes Reveal */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <details className="group">
                            <summary className="text-xs font-medium text-slate-500 cursor-pointer flex items-center gap-1 hover:text-slate-800">
                                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                                View Speaker Notes
                            </summary>
                            <p className="text-sm text-slate-600 mt-2 pl-4 italic border-l-2 border-slate-200">
                                {slide.speakerNotes}
                            </p>
                        </details>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
