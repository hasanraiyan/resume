'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import QuizEditor from './QuizEditor';

const RESOURCE_TYPES = ['video', 'article', 'doc', 'other'];

export default function EditSectionModal({ section, onSave, onClose }) {
  const [title, setTitle] = useState(section?.title || '');
  const [sectionType, setSectionType] = useState(section?.sectionType || 'lesson');
  const [content, setContent] = useState(section?.content || '');
  const [questions, setQuestions] = useState(section?.quiz?.questions || []);
  const [hasEmbeddedQuiz, setHasEmbeddedQuiz] = useState(
    section?.sectionType === 'lesson' && (section?.quiz?.questions?.length ?? 0) > 0
  );
  const [resources, setResources] = useState(section?.resources || []);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('content');

  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setSectionType(section.sectionType || 'lesson');
      setContent(section.content || '');
      setQuestions(section.quiz?.questions || []);
      setHasEmbeddedQuiz(
        section.sectionType === 'lesson' && (section.quiz?.questions?.length ?? 0) > 0
      );
      setResources(section.resources || []);
    }
  }, [section]);

  const addResource = () => {
    setResources((prev) => [...prev, { type: 'article', url: '', title: '' }]);
  };

  const updateResource = (i, field, value) => {
    setResources((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const removeResource = (i) => {
    setResources((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    const showQuiz = sectionType === 'quiz' || (sectionType === 'lesson' && hasEmbeddedQuiz);
    await onSave({
      title: title.trim(),
      sectionType,
      content: sectionType === 'lesson' ? content : '',
      quiz: { questions: showQuiz ? questions : [] },
      resources: resources.filter((r) => r.url.trim()),
    });
    setLoading(false);
    onClose();
  };

  const tabs = sectionType === 'quiz' ? ['quiz', 'resources'] : ['content', 'quiz', 'resources'];

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#e5e3d8] shrink-0">
            <h2 className="font-bold text-[#1e3a34]">{section ? 'Edit Section' : 'New Section'}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-[#f0f5f2] rounded-lg">
              <X className="w-4 h-4 text-[#7c8e88]" />
            </button>
          </div>

          {/* Title + type */}
          <div className="px-5 pt-4 space-y-3 shrink-0">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Section title"
              className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
            />

            {/* Section type toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                Type
              </span>
              <div className="flex items-center gap-0.5 bg-[#f0f5f2] rounded-xl p-0.5">
                {['lesson', 'quiz'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSectionType(t);
                      setTab(t === 'quiz' ? 'quiz' : 'content');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                      sectionType === t
                        ? 'bg-white text-[#1e3a34] shadow-sm'
                        : 'text-[#7c8e88] hover:text-[#1e3a34]'
                    }`}
                  >
                    {t === 'quiz' ? '🧠 Quiz' : '📄 Lesson'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-3 shrink-0">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${
                  tab === t ? 'bg-[#1f644e] text-white' : 'text-[#7c8e88] hover:bg-[#f0f5f2]'
                }`}
              >
                {t === 'quiz' && sectionType === 'lesson' ? 'Embedded Quiz' : t}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 min-h-0">
            {tab === 'content' && sectionType === 'lesson' && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write section content in Markdown...

## Overview
Explain what this section covers.

## Key Concepts
- Concept 1
- Concept 2

## Code Example
```js
const example = 'hello world';
```

## Summary
Wrap up with key takeaways."
                className="w-full h-64 px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10 resize-none font-mono"
              />
            )}

            {tab === 'quiz' && (
              <div className="space-y-4">
                {sectionType === 'lesson' && (
                  <div className="flex items-center gap-2 pb-2 border-b border-[#e5e3d8]">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1e3a34]">
                      <input
                        type="checkbox"
                        checked={hasEmbeddedQuiz}
                        onChange={(e) => setHasEmbeddedQuiz(e.target.checked)}
                        className="accent-[#1f644e]"
                      />
                      <span className="font-semibold">Add quiz at end of this lesson</span>
                    </label>
                  </div>
                )}
                {(sectionType === 'quiz' || hasEmbeddedQuiz) && (
                  <QuizEditor questions={questions} onChange={setQuestions} />
                )}
                {sectionType === 'lesson' && !hasEmbeddedQuiz && (
                  <p className="text-sm text-[#7c8e88] text-center py-4">
                    Enable the toggle above to add a quiz at the end of this lesson.
                  </p>
                )}
              </div>
            )}

            {tab === 'resources' && (
              <div className="space-y-3">
                {resources.map((r, i) => (
                  <div
                    key={i}
                    className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={r.type}
                        onChange={(e) => updateResource(i, 'type', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-[#e5e3d8] text-xs text-[#1e3a34] bg-white outline-none focus:border-[#1f644e]"
                      >
                        {RESOURCE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeResource(i)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[#7c8e88] hover:text-[#c94c4c] transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      value={r.title}
                      onChange={(e) => updateResource(i, 'title', e.target.value)}
                      placeholder="Resource title"
                      className="w-full px-3 py-2 rounded-lg border border-[#e5e3d8] text-xs text-[#1e3a34] outline-none focus:border-[#1f644e] bg-white"
                    />
                    <input
                      value={r.url}
                      onChange={(e) => updateResource(i, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg border border-[#e5e3d8] text-xs text-[#1e3a34] outline-none focus:border-[#1f644e] bg-white"
                    />
                  </div>
                ))}
                <button
                  onClick={addResource}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-[#e5e3d8] text-xs font-bold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Resource
                </button>
              </div>
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
              disabled={!title.trim() || loading}
              className="flex-1 py-2.5 rounded-xl bg-[#1f644e] text-white text-sm font-bold hover:bg-[#17503e] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Section'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
