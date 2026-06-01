'use client';

import { useState, useEffect } from 'react';
import { X, Save, Sparkles } from 'lucide-react';

export default function EditModuleModal({ module, onSave, onClose }) {
  const isNewModule = !module?._id;
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'ai'
  const [title, setTitle] = useState(module?.title || '');
  const [summary, setSummary] = useState(module?.summary || '');
  const [status, setStatus] = useState(module?.status || 'planned');
  const [syllabus, setSyllabus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (module) {
      setTitle(module.title || '');
      setSummary(module.summary || '');
      setStatus(module.status || 'planned');
    }
  }, [module]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isNewModule && activeTab === 'ai') {
        if (!syllabus.trim()) return;
        await onSave({ syllabus: syllabus.trim() });
      } else {
        if (!title.trim()) return;
        await onSave({
          title: title.trim(),
          summary: summary.trim(),
          status,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isSaveDisabled =
    loading || (isNewModule && activeTab === 'ai' ? !syllabus.trim() : !title.trim());

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col pointer-events-auto transition-all duration-300 ${
            isNewModule && activeTab === 'ai' ? 'max-w-2xl' : 'max-w-md'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#e5e3d8] shrink-0">
            <div>
              <h2 className="font-bold text-[#1e3a34]">
                {module?._id ? 'Edit Module' : 'New Module'}
              </h2>
              {isNewModule && (
                <p className="text-[10px] text-[#7c8e88] font-semibold mt-0.5">
                  Plan your course curriculum step-by-step
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#f0f5f2] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-[#7c8e88]" />
            </button>
          </div>

          {/* Optional Tabs for New Modules */}
          {isNewModule && (
            <div className="flex border-b border-[#e5e3d8] bg-[#fcfbf5] px-2 shrink-0">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 outline-none ${
                  activeTab === 'manual'
                    ? 'text-[#1e3a34] border-[#1f644e]'
                    : 'text-[#7c8e88] border-transparent hover:text-[#1e3a34]'
                }`}
              >
                Manual Creation
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 outline-none flex items-center justify-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'text-[#1f644e] border-[#1f644e] bg-gradient-to-t from-[#1f644e]/5 to-transparent'
                    : 'text-[#7c8e88] border-transparent hover:text-[#1e3a34]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Syllabus Importer
                <span className="bg-[#1f644e] text-white text-[8px] font-bold px-1 rounded-md py-0.5">
                  NEW
                </span>
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
            {isNewModule && activeTab === 'ai' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] mb-1.5 block px-1">
                    Paste Lecture Plan / Syllabus
                  </label>
                  <textarea
                    rows={12}
                    value={syllabus}
                    onChange={(e) => setSyllabus(e.target.value)}
                    placeholder={`e.g. Module 2: Data Link Layer and Medium Access Sub Layer
Lecture 1: Introduction to Data Link Layer
- Topics: LLC and MAC, Framing, Flow Control, Redundancy...
- Learning Goals: Differentiate LLC and MAC responsibilities...
- Summary: The Data Link Layer transforms raw physical bits into frames...

Lecture 2: Block Coding & Hamming Distance
- Topics: Hamming Distance, d_min, detect s errors...
- Learning Goals: Compute Hamming distance mathematically...`}
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] placeholder-[#a2b2ac] outline-none focus:border-[#1f644e] resize-none font-mono"
                  />
                  <p className="text-[10px] text-[#7c8e88] mt-1.5 px-1 leading-relaxed">
                    ✨ Paste any syllabus text, lesson goals, or topics. The AI will extract the
                    module details and generate a draft section for each item automatically.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] mb-1.5 block px-1">
                      Module Title
                    </label>
                    <input
                      autoFocus
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Introduction to React"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] mb-1.5 block px-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] capitalize"
                    >
                      {['planned', 'drafting', 'complete', 'needs_review'].map((o) => (
                        <option key={o} value={o}>
                          {o.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] mb-1.5 block px-1">
                    Summary (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Briefly describe what this module covers..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-5 border-t border-[#e5e3d8] shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#e5e3d8] text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="flex-1 py-2.5 rounded-xl bg-[#1f644e] text-white text-sm font-bold hover:bg-[#17503e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : isNewModule && activeTab === 'ai' ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? (
                <span>Planning with AI…</span>
              ) : isNewModule && activeTab === 'ai' ? (
                <span>Plan Module with AI</span>
              ) : module?._id ? (
                <span>Update Module</span>
              ) : (
                <span>Create Module</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
