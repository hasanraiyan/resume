'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Label } from '@/components/ui';
import { TerminalSquare, Cpu, PenTool, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export default function CreateAppPage() {
  const router = useRouter();
  const [mode, setMode] = useState(null); // 'ai' or 'manual'
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [designSchema, setDesignSchema] = useState('modern');
  const [content, setContent] = useState('');

  // AI Preview State
  const [aiPreviewContent, setAiPreviewContent] = useState(null);
  const [aiTodoList, setAiTodoList] = useState([]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!name || !description) return alert('Name and description are required.');

    setLoading(true);
    setAiPreviewContent(null);
    setAiTodoList([]);

    try {
      const res = await fetch('/api/admin/apps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, designSchema }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate app');

      setAiPreviewContent(data.content);
      setAiTodoList(data.todoList);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalContent = mode === 'ai' ? aiPreviewContent : content;

    if (!name || !description || !finalContent) {
      return alert('All fields including content are required.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          content: finalContent,
          type: mode,
          designSchema,
        }),
      });

      if (res.ok) {
        router.push('/admin/apps');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save app');
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in">
        <div className="flex items-center gap-4 mb-12">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/apps')}
            className="rounded-full p-2 h-10 w-10 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-['Playfair_Display']">Create New App</h1>
            <p className="text-neutral-500">Choose how you want to build your internal tool.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card
            interactive
            onClick={() => setMode('ai')}
            className="p-8 border-2 border-neutral-200 hover:border-black transition-all cursor-pointer group flex flex-col items-center text-center h-80 justify-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-black text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-black">Generate with AI</h2>
            <p className="text-neutral-500">
              Describe what you need and let the LangGraph agent build a complete HTML/JS tool for
              you.
            </p>
          </Card>

          <Card
            interactive
            onClick={() => setMode('manual')}
            className="p-8 border-2 border-neutral-200 hover:border-black transition-all cursor-pointer group flex flex-col items-center text-center h-80 justify-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 text-neutral-600 flex items-center justify-center mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-all">
              <PenTool className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-black">Add Manually</h2>
            <p className="text-neutral-500">
              Paste your own HTML/JS/CSS code or use a custom built frontend snippet directly.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in slide-in-from-right-8">
      <div className="flex items-center gap-4 border-b border-neutral-200 pb-8">
        <Button
          variant="ghost"
          onClick={() => {
            setMode(null);
            setAiPreviewContent(null);
          }}
          className="rounded-full p-2 h-10 w-10 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-['Playfair_Display'] flex items-center gap-3">
            {mode === 'ai' ? (
              <>
                <Cpu className="w-8 h-8 text-blue-600" /> AI App Generator
              </>
            ) : (
              <>
                <PenTool className="w-8 h-8 text-orange-600" /> Manual App Creator
              </>
            )}
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 border-2 border-neutral-100 bg-white">
            <h2 className="text-xl font-bold mb-6">App Details</h2>
            <div className="space-y-5">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">
                  App Name
                </Label>
                <input
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-200 focus:border-black rounded-xl outline-none text-sm transition-all font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., ROI Calculator"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">
                  Description
                </Label>
                <textarea
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-200 focus:border-black rounded-xl outline-none text-sm transition-all min-h-[120px] resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    mode === 'ai'
                      ? 'Describe exactly what the app should do. E.g., A clean calculator that takes user input for X and Y and outputs Z, styled with Tailwind.'
                      : 'Brief description of the tool...'
                  }
                  required
                />
              </div>

              {mode === 'ai' && (
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">
                    Design Schema
                  </Label>
                  <select
                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-200 focus:border-black rounded-xl outline-none text-sm transition-all appearance-none cursor-pointer font-medium"
                    value={designSchema}
                    onChange={(e) => setDesignSchema(e.target.value)}
                  >
                    <option value="modern">Modern Minimalist</option>
                    <option value="dashboard">Dashboard Utility</option>
                    <option value="playful">Playful & Colorful</option>
                    <option value="corporate">Corporate Professional</option>
                    <option value="brutalism">Swiss Brutalism</option>
                  </select>
                </div>
              )}

              {mode === 'manual' && (
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">
                    HTML/JS Content
                  </Label>
                  <textarea
                    className="w-full px-4 py-3 bg-neutral-900 text-green-400 font-mono border-2 border-neutral-800 focus:border-black rounded-xl outline-none text-xs transition-all min-h-[400px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="<!DOCTYPE html>..."
                    required
                  />
                </div>
              )}

              <div className="pt-4 border-t border-neutral-100">
                {mode === 'ai' ? (
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !name || !description}
                    className="w-full py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" /> Generate App
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={loading || !name || !description || !content}
                    className="w-full py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save App'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Preview Column */}
        {mode === 'ai' && (
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-0 border-2 border-neutral-100 bg-white overflow-hidden flex flex-col h-[800px]">
              <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="w-5 h-5 text-neutral-400" />
                  <h3 className="font-bold text-neutral-700">Live Preview</h3>
                </div>
                {aiPreviewContent && (
                  <Button onClick={handleSave} disabled={loading} size="small" variant="primary">
                    Save to Dashboard
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50/50 p-8 text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-neutral-200 border-t-black rounded-full animate-spin"></div>
                  <p className="text-neutral-500 font-medium">
                    The Agent is planning and building your app...
                  </p>
                  <p className="text-xs text-neutral-400">This usually takes 15-30 seconds.</p>
                </div>
              ) : aiPreviewContent ? (
                <div className="flex-1 flex flex-col md:flex-row relative h-full">
                  <div className="flex-1 h-full w-full bg-white relative">
                    <iframe
                      srcDoc={aiPreviewContent}
                      title="App Preview"
                      sandbox="allow-scripts allow-forms allow-modals allow-popups"
                      className="w-full h-full border-none absolute inset-0"
                    />
                  </div>
                  {aiTodoList.length > 0 && (
                    <div className="w-full md:w-64 bg-neutral-50 border-t md:border-t-0 md:border-l border-neutral-200 p-4 overflow-y-auto shrink-0 z-10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">
                        Agent Plan
                      </h4>
                      <ul className="space-y-3">
                        {aiTodoList.map((item, idx) => (
                          <li key={idx} className="text-xs text-neutral-600 flex gap-2">
                            <span className="text-black font-bold shrink-0">{idx + 1}.</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-neutral-50/50 p-8 text-center">
                  <div className="max-w-md">
                    <TerminalSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500 font-medium">Your preview will appear here.</p>
                    <p className="text-xs text-neutral-400 mt-2">
                      Fill out the details on the left and click Generate.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
