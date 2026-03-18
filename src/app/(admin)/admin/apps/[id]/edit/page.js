'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Skeleton } from '@/components/ui';
import { TerminalSquare, ArrowLeft, Loader2, Save } from 'lucide-react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';

export default function EditAppPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [designSchema, setDesignSchema] = useState('modern');
  const [content, setContent] = useState('');
  const [type, setType] = useState('manual');

  useEffect(() => {
    if (appId) fetchApp();
  }, [appId]);

  const fetchApp = async () => {
    try {
      const res = await fetch(`/api/admin/apps/${appId}`);
      if (!res.ok) throw new Error('Failed to fetch app');
      const data = await res.json();

      setName(data.app.name);
      setDescription(data.app.description);
      setContent(data.app.content);
      setDesignSchema(data.app.designSchema || 'modern');
      setType(data.app.type);
    } catch (error) {
      console.error(error);
      alert('Error loading app details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!name || !description || !content) {
      return alert('All fields including content are required.');
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/apps/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          content,
          designSchema,
        }),
      });

      if (res.ok) {
        router.push('/admin/apps');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update app');
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-8 pb-24 animate-in fade-in duration-300">
        <Skeleton className="h-[750px] w-full rounded-2xl border-2 border-neutral-100" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-24 animate-in slide-in-from-right-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/apps')}
            className="p-2.5 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-500 hover:text-black"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <TerminalSquare className="w-8 h-8 md:w-10 md:h-10 text-black" />
            <h1 className="text-3xl md:text-4xl font-bold font-['Playfair_Display'] text-black">
              Edit App
            </h1>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Code Column */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          <Card className="p-0 border-2 border-neutral-100 bg-black overflow-hidden flex flex-col h-[750px] rounded-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 bg-[#0a0a0a] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <TerminalSquare className="w-5 h-5 text-neutral-500" />
                <h3 className="font-bold text-white tracking-wide">Source Code</h3>
              </div>
            </div>

            <div className="flex-1 w-full bg-[#121212] relative">
              <textarea
                className="w-full h-full absolute inset-0 bg-transparent text-green-400 font-mono p-6 outline-none text-[13px] resize-none whitespace-pre leading-relaxed"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
              />
            </div>
          </Card>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
          <Card className="p-8 border-2 border-neutral-100 bg-white rounded-2xl">
            <h2 className="text-xl font-bold mb-6 text-black">App Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                  App Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all font-medium text-black"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all min-h-[140px] resize-none text-black leading-relaxed"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {type === 'ai' && (
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
