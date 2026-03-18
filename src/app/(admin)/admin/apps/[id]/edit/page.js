'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, Skeleton } from '@/components/ui';
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
      <AdminPageWrapper>
        <div className="space-y-8 pb-24">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in slide-in-from-right-8">
      <div className="flex items-center gap-4 border-b border-neutral-200 pb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/apps')}
          className="rounded-full p-2 h-10 w-10 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-['Playfair_Display'] flex items-center gap-3">
            <TerminalSquare className="w-8 h-8 text-black" /> Edit App
          </h1>
        </div>
        <Button
          onClick={handleUpdate}
          disabled={saving}
          variant="primary"
          className="flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{' '}
          Save Changes
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Code Column */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          <Card className="p-0 border-2 border-neutral-100 bg-black overflow-hidden flex flex-col h-[700px]">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <TerminalSquare className="w-5 h-5 text-neutral-400" />
                <h3 className="font-bold text-white">Source Code (HTML/JS/CSS)</h3>
              </div>
            </div>

            <div className="flex-1 w-full bg-[#1e1e1e] relative">
              <textarea
                className="w-full h-full absolute inset-0 bg-transparent text-green-400 font-mono p-6 outline-none text-sm resize-none whitespace-pre"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
              />
            </div>
          </Card>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
          <Card className="p-6 border-2 border-neutral-100 bg-white">
            <h2 className="text-xl font-bold mb-6">App Settings</h2>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">
                  App Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-200 focus:border-black rounded-xl outline-none text-sm transition-all font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-200 focus:border-black rounded-xl outline-none text-sm transition-all min-h-[120px] resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {type === 'ai' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">
                    Design Schema
                  </label>
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
