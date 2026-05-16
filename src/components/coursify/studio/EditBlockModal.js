'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import QuizEditor from '../QuizEditor';

const innerInput =
  'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all border-[#e5e3d8] bg-white text-[#1e3a34] focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10 outline-none font-[family-name:var(--font-sans)]';
const innerTextarea =
  'w-full px-3.5 py-2.5 rounded-xl border text-xs resize-y transition-all min-h-[120px] border-[#e5e3d8] bg-white text-[#1e3a34] focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10 outline-none font-mono';
const labelStyle =
  'block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7c8e88] mb-1.5 ml-0.5';

export default function EditBlockModal({ block: initialBlock, onSave, onClose, onDelete }) {
  const [block, setBlock] = useState(initialBlock);

  useEffect(() => {
    setBlock(initialBlock);
  }, [initialBlock]);

  if (!block) return null;

  const updateField = (field, value) => {
    setBlock((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(block);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden border border-[#e5e3d8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e3d8] bg-[#fcfbf5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#1f644e] rounded-full" />
            <div>
              <h3 className="font-bold text-[#1e3a34]">Edit {block.type.replace('Block', '')}</h3>
              <p className="text-[10px] text-[#7c8e88] uppercase tracking-wider font-semibold">
                Block Editor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#f0f5f2] text-[#7c8e88] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* MdBlock */}
          {block.type === 'MdBlock' && (
            <div>
              <label className={labelStyle}>Markdown Content</label>
              <textarea
                value={block.content || ''}
                onChange={(e) => updateField('content', e.target.value)}
                placeholder="Write your markdown here..."
                className={innerTextarea}
                style={{ minHeight: '300px' }}
              />
            </div>
          )}

          {/* VideoBlock */}
          {block.type === 'VideoBlock' && (
            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Video Title</label>
                <input
                  value={block.video?.title || ''}
                  onChange={(e) => updateField('video', { ...block.video, title: e.target.value })}
                  placeholder="Video Title"
                  className={innerInput}
                />
              </div>
              <div>
                <label className={labelStyle}>Video URL (YouTube/Vimeo)</label>
                <input
                  value={block.video?.url || ''}
                  onChange={(e) => updateField('video', { ...block.video, url: e.target.value })}
                  placeholder="https://..."
                  className={innerInput}
                />
              </div>
            </div>
          )}

          {/* QuizBlock */}
          {block.type === 'QuizBlock' && (
            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Quiz Title</label>
                <input
                  value={block.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Quiz Title"
                  className={innerInput}
                />
              </div>
              <QuizEditor
                questions={block.quiz?.questions || []}
                onChange={(q) => updateField('quiz', { ...block.quiz, questions: q })}
              />
            </div>
          )}

          {/* StepByStepBlock */}
          {block.type === 'StepByStepBlock' && (
            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Process Heading</label>
                <input
                  value={block.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Process Heading"
                  className={innerInput}
                />
              </div>
              <div className="space-y-4">
                {(block.steps || []).map((step, si) => (
                  <div
                    key={si}
                    className="p-4 rounded-2xl border border-[#e5e3d8] bg-[#fcfbf5] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1f644e]">Step {si + 1}</span>
                      <button
                        onClick={() =>
                          updateField(
                            'steps',
                            block.steps.filter((_, idx) => idx !== si)
                          )
                        }
                        className="text-[#c94c4c] p-1 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      value={step.title}
                      onChange={(e) => {
                        const nextSteps = block.steps.map((s, idx) =>
                          idx === si ? { ...s, title: e.target.value } : s
                        );
                        updateField('steps', nextSteps);
                      }}
                      placeholder="Step Title"
                      className={innerInput}
                    />
                    <textarea
                      value={step.content}
                      onChange={(e) => {
                        const nextSteps = block.steps.map((s, idx) =>
                          idx === si ? { ...s, content: e.target.value } : s
                        );
                        updateField('steps', nextSteps);
                      }}
                      placeholder="Step description..."
                      className={innerTextarea}
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    updateField('steps', [...(block.steps || []), { title: '', content: '' }])
                  }
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-[#e5e3d8] text-[#7c8e88] text-sm font-bold hover:border-[#1f644e] hover:text-[#1f644e] transition-all"
                >
                  + Add Step
                </button>
              </div>
            </div>
          )}

          {/* AccordionBlock */}
          {block.type === 'AccordionBlock' && (
            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Accordion Heading</label>
                <input
                  value={block.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Accordion Heading"
                  className={innerInput}
                />
              </div>
              <div className="space-y-4">
                {(block.items || []).map((item, ii) => (
                  <div
                    key={ii}
                    className="p-4 rounded-2xl border border-[#e5e3d8] bg-[#fcfbf5] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1f644e]">Item {ii + 1}</span>
                      <button
                        onClick={() =>
                          updateField(
                            'items',
                            block.items.filter((_, idx) => idx !== ii)
                          )
                        }
                        className="text-[#c94c4c] p-1 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      value={item.title}
                      onChange={(e) => {
                        const nextItems = block.items.map((it, idx) =>
                          idx === ii ? { ...it, title: e.target.value } : it
                        );
                        updateField('items', nextItems);
                      }}
                      placeholder="Item Title"
                      className={innerInput}
                    />
                    <textarea
                      value={item.content}
                      onChange={(e) => {
                        const nextItems = block.items.map((it, idx) =>
                          idx === ii ? { ...it, content: e.target.value } : it
                        );
                        updateField('items', nextItems);
                      }}
                      placeholder="Item content..."
                      className={innerTextarea}
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    updateField('items', [...(block.items || []), { title: '', content: '' }])
                  }
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-[#e5e3d8] text-[#7c8e88] text-sm font-bold hover:border-[#1f644e] hover:text-[#1f644e] transition-all"
                >
                  + Add Item
                </button>
              </div>
            </div>
          )}

          {/* ResourceBlock */}
          {block.type === 'ResourceBlock' && (
            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Resource Title</label>
                <input
                  value={block.resource?.title || ''}
                  onChange={(e) =>
                    updateField('resource', { ...block.resource, title: e.target.value })
                  }
                  placeholder="Resource Title"
                  className={innerInput}
                />
              </div>
              <div>
                <label className={labelStyle}>Resource URL</label>
                <input
                  value={block.resource?.url || ''}
                  onChange={(e) =>
                    updateField('resource', { ...block.resource, url: e.target.value })
                  }
                  placeholder="https://..."
                  className={innerInput}
                />
              </div>
              <div>
                <label className={labelStyle}>Type</label>
                <select
                  value={block.resource?.type || 'other'}
                  onChange={(e) =>
                    updateField('resource', { ...block.resource, type: e.target.value })
                  }
                  className={innerInput}
                >
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                  <option value="doc">Document</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* TabsBlock */}
          {block.type === 'TabsBlock' && (
            <div className="space-y-4">
              {(block.tabs || []).map((t, ti) => (
                <div
                  key={ti}
                  className="p-4 rounded-2xl border border-[#e5e3d8] bg-[#fcfbf5] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1f644e]">Tab {ti + 1}</span>
                    <button
                      onClick={() =>
                        updateField(
                          'tabs',
                          block.tabs.filter((_, idx) => idx !== ti)
                        )
                      }
                      className="text-[#c94c4c] p-1 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    value={t.title}
                    onChange={(e) => {
                      const nextTabs = block.tabs.map((tb, idx) =>
                        idx === ti ? { ...tb, title: e.target.value } : tb
                      );
                      updateField('tabs', nextTabs);
                    }}
                    placeholder="Tab Title"
                    className={innerInput}
                  />
                  <textarea
                    value={t.content}
                    onChange={(e) => {
                      const nextTabs = block.tabs.map((tb, idx) =>
                        idx === ti ? { ...tb, content: e.target.value } : tb
                      );
                      updateField('tabs', nextTabs);
                    }}
                    placeholder="Tab content..."
                    className={innerTextarea}
                  />
                </div>
              ))}
              <button
                onClick={() =>
                  updateField('tabs', [...(block.tabs || []), { title: '', content: '' }])
                }
                className="w-full py-3 rounded-2xl border-2 border-dashed border-[#e5e3d8] text-[#7c8e88] text-sm font-bold hover:border-[#1f644e] hover:text-[#1f644e] transition-all"
              >
                + Add Tab
              </button>
            </div>
          )}

          {/* CalloutBlock */}
          {block.type === 'CalloutBlock' && (
            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Callout Type</label>
                <select
                  value={block.calloutType || 'info'}
                  onChange={(e) => updateField('calloutType', e.target.value)}
                  className={innerInput}
                >
                  <option value="info">Info</option>
                  <option value="tip">Tip</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Title (Optional)</label>
                <input
                  value={block.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Callout Title"
                  className={innerInput}
                />
              </div>
              <div>
                <label className={labelStyle}>Content</label>
                <textarea
                  value={block.content || ''}
                  onChange={(e) => updateField('content', e.target.value)}
                  placeholder="Callout content..."
                  className={innerTextarea}
                />
              </div>
            </div>
          )}

          {/* ChartBlock */}
          {block.type === 'ChartBlock' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Chart Type</label>
                  <select
                    value={block.chart?.type || 'bar'}
                    onChange={(e) => updateField('chart', { ...block.chart, type: e.target.value })}
                    className={innerInput}
                  >
                    {[
                      'bar',
                      'line',
                      'pie',
                      'doughnut',
                      'polarArea',
                      'radar',
                      'scatter',
                      'bubble',
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Title</label>
                  <input
                    value={block.chart?.title || ''}
                    onChange={(e) =>
                      updateField('chart', { ...block.chart, title: e.target.value })
                    }
                    placeholder="Chart title"
                    className={innerInput}
                  />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Description</label>
                <input
                  value={block.chart?.description || ''}
                  onChange={(e) =>
                    updateField('chart', { ...block.chart, description: e.target.value })
                  }
                  placeholder="Chart description"
                  className={innerInput}
                />
              </div>

              <div className="p-4 rounded-2xl border border-[#e5e3d8] bg-[#fcfbf5] space-y-4">
                <div>
                  <label className={labelStyle}>Labels (comma separated)</label>
                  <input
                    value={(block.chart?.data?.labels || []).join(', ')}
                    onChange={(e) => {
                      const labels = e.target.value.split(',').map((l) => l.trim());
                      updateField('chart', {
                        ...block.chart,
                        data: { ...block.chart.data, labels },
                      });
                    }}
                    placeholder="Jan, Feb, Mar"
                    className={innerInput}
                  />
                </div>

                <div className="space-y-3">
                  <label className={labelStyle}>Datasets</label>
                  {(block.chart?.data?.datasets || []).map((ds, dsi) => (
                    <div
                      key={dsi}
                      className="p-3 bg-white border border-[#e5e3d8] rounded-xl space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          value={ds.label}
                          onChange={(e) => {
                            const datasets = block.chart.data.datasets.map((d, idx) =>
                              idx === dsi ? { ...d, label: e.target.value } : d
                            );
                            updateField('chart', {
                              ...block.chart,
                              data: { ...block.chart.data, datasets },
                            });
                          }}
                          placeholder="Dataset label"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-[#e5e3d8] text-xs font-semibold outline-none focus:border-[#1f644e]"
                        />
                        <input
                          type="color"
                          value={ds.color || '#1f644e'}
                          onChange={(e) => {
                            const datasets = block.chart.data.datasets.map((d, idx) =>
                              idx === dsi ? { ...d, color: e.target.value } : d
                            );
                            updateField('chart', {
                              ...block.chart,
                              data: { ...block.chart.data, datasets },
                            });
                          }}
                          className="w-8 h-8 rounded-lg overflow-hidden border-none cursor-pointer"
                        />
                        <button
                          onClick={() => {
                            const datasets = block.chart.data.datasets.filter(
                              (_, idx) => idx !== dsi
                            );
                            updateField('chart', {
                              ...block.chart,
                              data: { ...block.chart.data, datasets },
                            });
                          }}
                          className="text-[#c94c4c] p-1 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        value={(ds.data || []).join(', ')}
                        onChange={(e) => {
                          const data = e.target.value
                            .split(',')
                            .map((v) => parseFloat(v.trim()))
                            .filter((v) => !isNaN(v));
                          const datasets = block.chart.data.datasets.map((d, idx) =>
                            idx === dsi ? { ...d, data } : d
                          );
                          updateField('chart', {
                            ...block.chart,
                            data: { ...block.chart.data, datasets },
                          });
                        }}
                        placeholder="Data points: 10, 20, 30"
                        className="w-full px-3 py-1.5 rounded-lg border border-[#e5e3d8] text-xs outline-none focus:border-[#1f644e]"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const datasets = [
                        ...(block.chart?.data?.datasets || []),
                        { label: '', data: [], color: '' },
                      ];
                      updateField('chart', {
                        ...block.chart,
                        data: { ...block.chart.data, datasets },
                      });
                    }}
                    className="w-full py-2 rounded-xl border border-dashed border-[#e5e3d8] text-[#7c8e88] text-[10px] font-bold hover:border-[#1f644e] hover:text-[#1f644e]"
                  >
                    + Add Dataset
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 px-1">
                {['showLegend', 'showGrid', 'stacked'].map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        key === 'stacked'
                          ? block.chart?.options?.stacked === true
                          : block.chart?.options?.[key] !== false
                      }
                      onChange={(e) =>
                        updateField('chart', {
                          ...block.chart,
                          options: { ...block.chart.options, [key]: e.target.checked },
                        })
                      }
                      className="w-3.5 h-3.5 rounded border-[#e5e3d8] text-[#1f644e] focus:ring-[#1f644e]/20"
                    />
                    <span className="text-xs font-medium text-[#1e3a34] capitalize">
                      {key.replace('show', '')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e3d8] bg-[#fcfbf5] flex items-center gap-3">
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Delete this block?')) {
                  onDelete();
                  onClose();
                }
              }}
              className="px-4 py-2.5 rounded-xl text-[#c94c4c] font-bold text-sm hover:bg-red-50 transition-colors"
            >
              Delete Block
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-[#e5e3d8] text-[#7c8e88] font-bold text-sm hover:bg-white hover:text-[#1e3a34] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#1f644e] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#164a3a] transition-all shadow-lg shadow-[#1f644e]/20"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
