import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
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
      <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in">
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => router.push('/admin/apps')}
            className="p-2.5 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-500 hover:text-black"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-['Playfair_Display'] text-black">
              Create New App
            </h1>
            <p className="text-neutral-500 mt-1">Select an assembly method for your new tool.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card
            interactive
            onClick={() => setMode('ai')}
            className="p-10 border-2 border-neutral-100 hover:border-black transition-all cursor-pointer group flex flex-col items-center text-center h-80 justify-center bg-white rounded-2xl relative overflow-hidden"
          >
            <div className="w-20 h-20 rounded-2xl bg-black text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <Cpu className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-neutral-900 group-hover:text-black">
              Generate with AI
            </h2>
            <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
              Describe what you need. The LangGraph agent will architect and build a complete
              HTML/JS tool autonomously.
            </p>
          </Card>

          <Card
            interactive
            onClick={() => setMode('manual')}
            className="p-10 border-2 border-neutral-100 hover:border-black transition-all cursor-pointer group flex flex-col items-center text-center h-80 justify-center bg-white rounded-2xl relative overflow-hidden"
          >
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 text-neutral-600 border border-neutral-200/60 flex items-center justify-center mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-all">
              <PenTool className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-neutral-900 group-hover:text-black">
              Add Manually
            </h2>
            <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
              Paste your own HTML/JS/CSS code or configure a custom frontend snippet directly in the
              editor.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 animate-in slide-in-from-right-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-neutral-200 pb-8">
        <button
          onClick={() => {
            setMode(null);
            setAiPreviewContent(null);
          }}
          className="p-2.5 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-500 hover:text-black"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold font-['Playfair_Display'] flex items-center gap-3 text-black">
            {mode === 'ai' ? (
              <>
                <Cpu className="w-8 h-8 md:w-10 md:h-10 text-black" /> AI App Generator
              </>
            ) : (
              <>
                <PenTool className="w-8 h-8 md:w-10 md:h-10 text-black" /> Manual App Creator
              </>
            )}
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-8 border-2 border-neutral-100 bg-white rounded-2xl">
            <h2 className="text-xl font-bold mb-6 text-black">App Details</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                  App Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all font-medium text-black placeholder:text-neutral-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., ROI Calculator"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                  Description / Prompt
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all min-h-[140px] resize-none text-black placeholder:text-neutral-400 leading-relaxed"
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                    Design Schema
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all appearance-none cursor-pointer font-medium text-black"
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                    HTML/JS Content
                  </label>
                  <textarea
                    className="w-full px-4 py-4 bg-[#0a0a0a] text-green-400 font-mono border-2 border-neutral-900 focus:border-black rounded-xl outline-none text-xs transition-all min-h-[400px] leading-relaxed"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="<!DOCTYPE html>..."
                    spellCheck={false}
                    required
                  />
                </div>
              )}

              <div className="pt-6 border-t border-neutral-100">
                {mode === 'ai' ? (
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !name || !description}
                    className="w-full py-4 bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generate App
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={loading || !name || !description || !content}
                    className="w-full py-4 bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save App'
                    )}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Preview Column */}
        {mode === 'ai' && (
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-0 border-2 border-neutral-100 bg-white overflow-hidden flex flex-col h-[800px] rounded-2xl">
              <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-200/50 flex items-center justify-center">
                    <TerminalSquare className="w-4 h-4 text-neutral-600" />
                  </div>
                  <h3 className="font-bold text-neutral-900">Live Preview</h3>
                </div>
                {aiPreviewContent && (
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Save to Dashboard
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 text-center space-y-6">
                  <div className="w-16 h-16 border-4 border-neutral-100 border-t-black rounded-full animate-spin"></div>
                  <div>
                    <p className="text-neutral-900 font-bold text-lg">Architecting Your App...</p>
                    <p className="text-sm text-neutral-500 mt-2">
                      The LangGraph agent is planning and writing code. This takes 15-30s.
                    </p>
                  </div>
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
                    <div className="w-full md:w-72 bg-neutral-50 border-t md:border-t-0 md:border-l border-neutral-200 p-6 overflow-y-auto shrink-0 z-10">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-5">
                        Agent Execution Plan
                      </h4>
                      <ul className="space-y-4">
                        {aiTodoList.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-neutral-700 flex gap-3 leading-relaxed"
                          >
                            <span className="text-black font-black shrink-0">{idx + 1}.</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-neutral-50/30 p-8 text-center">
                  <div className="max-w-sm">
                    <div className="w-20 h-20 bg-neutral-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
                      <TerminalSquare className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-900 font-bold text-lg mb-2">Awaiting Instructions</p>
                    <p className="text-sm text-neutral-500 leading-relaxed">
                      Fill out the app details on the left and click Generate to see your app built
                      in real-time.
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
