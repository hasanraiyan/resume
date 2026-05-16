'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Wrench, X, Loader2 } from 'lucide-react';
import { Card } from '@/components/custom-ui';
import { useSmallClaw } from '@/context/SmallClawContext';

export default function SkillsTab() {
  const { skills, refreshSkills, searchQuery } = useSmallClaw();

  const [savingSkill, setSavingSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (skills.length === 0) {
      setIsLoading(true);
      refreshSkills().finally(() => setIsLoading(false));
    }
  }, [skills.length, refreshSkills]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-[#1f644e] animate-spin" />
        <p className="mt-4 text-neutral-500 font-medium">Loading Skills...</p>
      </div>
    );
  }

  const filteredSkills = skills.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSkill = () => {
    setEditingSkill({
      id: 'new',
      name: '',
      displayName: '',
      description: '',
      content: '',
      category: 'general',
      icon: 'Wrench',
      color: 'purple-500',
      isActive: true,
      adminOnly: false,
      isDefault: false,
      allowedTools: [],
    });
  };

  const handleEditSkill = (skill) => {
    setEditingSkill({ ...skill, id: skill._id });
  };

  const handleSaveSkill = async () => {
    if (!editingSkill.name || !editingSkill.displayName || !editingSkill.description) return;

    setSavingSkill(true);
    try {
      const isNew = editingSkill.id === 'new';
      const url = isNew ? '/api/admin/skills' : `/api/admin/skills/${editingSkill.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSkill),
      });

      if (res.ok) {
        setEditingSkill(null);
        refreshSkills();
      } else {
        alert('Failed to save skill.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!confirm('Are you sure you want to delete this Skill?')) return;
    try {
      const res = await fetch(`/api/admin/skills/${skillId}`, { method: 'DELETE' });
      if (res.ok) refreshSkills();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-black">
            Skills Management
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Manage on-demand skill specializations. Agents match skills by description, then load
            full instructions on-demand.
          </p>
        </div>
        <button
          onClick={handleAddSkill}
          className="px-5 py-2.5 bg-[#1f644e] hover:bg-[#164d3c] transition-colors text-white rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer shadow-sm border-2 border-[#1f644e]"
        >
          <Plus className="w-4 h-4" /> Add Skill
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => (
          <Card
            key={skill._id}
            interactive
            className="p-6 border-2 border-neutral-100 hover:border-[#1f644e] transition-all bg-white rounded-xl flex flex-col h-full cursor-pointer relative group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200/60 group-hover:bg-neutral-200/50 transition-colors">
                  <Wrench className={`w-5 h-5 text-${skill.color || 'purple-500'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                    {skill.displayName}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono mt-1 uppercase tracking-widest">
                    {skill.category} | {skill.name}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditSkill(skill);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSkill(skill._id);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {skill.description && (
              <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
                {skill.description}
              </p>
            )}

            <div className="mt-auto pt-4 border-t border-neutral-100">
              <div className="flex gap-2 flex-wrap">
                {skill.isDefault && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                    Default
                  </span>
                )}
                {skill.adminOnly && (
                  <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                    Admin Only
                  </span>
                )}
                <span
                  className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${skill.isActive ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}
                >
                  {skill.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {skills.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 flex flex-col items-center justify-center">
          <BookOpen className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700">No Skills Found</h3>
          <p className="text-sm text-neutral-500 mt-2 max-w-md">
            Define specialized skills that agents can load on-demand.
          </p>
          <button
            onClick={handleAddSkill}
            className="mt-6 px-6 py-2.5 bg-white border border-neutral-300 hover:border-[#1f644e] transition-colors rounded-xl text-sm font-medium text-[#1e3a34] cursor-pointer"
          >
            Create Your First Skill
          </button>
        </div>
      ) : filteredSkills.length === 0 && searchQuery ? (
        <div className="text-center p-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-500">
          No skills match your search for "{searchQuery}".
        </div>
      ) : null}

      {/* Skill Edit Modal */}
      {editingSkill && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-600" />
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-[family-name:var(--font-playfair)]">
                {editingSkill.id === 'new' ? 'Create Skill' : 'Edit Skill'}
              </h3>
              <button
                onClick={() => setEditingSkill(null)}
                className="text-neutral-400 hover:text-[#1e3a34]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
                    Skill Name (ID)
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl text-sm font-mono outline-none"
                    value={editingSkill.name}
                    onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                    placeholder="search-web"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
                    Display Name
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl text-sm outline-none"
                    value={editingSkill.displayName}
                    onChange={(e) =>
                      setEditingSkill({ ...editingSkill, displayName: e.target.value })
                    }
                    placeholder="Web Search"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
                  Short Description
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl text-sm outline-none resize-none h-20"
                  value={editingSkill.description}
                  onChange={(e) =>
                    setEditingSkill({ ...editingSkill, description: e.target.value })
                  }
                  placeholder="What does this skill do?"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
                  Full Content / Instructions
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl text-sm font-mono outline-none resize-none h-40"
                  value={editingSkill.content}
                  onChange={(e) => setEditingSkill({ ...editingSkill, content: e.target.value })}
                  placeholder="# Skill Instructions..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSkill.isActive}
                    onChange={(e) =>
                      setEditingSkill({ ...editingSkill, isActive: e.target.checked })
                    }
                    className="rounded border-neutral-300 text-[#1e3a34] focus:ring-[#1f644e]"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest">Active</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSkill.isDefault}
                    onChange={(e) =>
                      setEditingSkill({ ...editingSkill, isDefault: e.target.checked })
                    }
                    className="rounded border-neutral-300 text-[#1e3a34] focus:ring-[#1f644e]"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest">Default</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSkill.adminOnly}
                    onChange={(e) =>
                      setEditingSkill({ ...editingSkill, adminOnly: e.target.checked })
                    }
                    className="rounded border-neutral-300 text-[#1e3a34] focus:ring-[#1f644e]"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest">Admin</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditingSkill(null)}
                className="flex-1 py-3.5 rounded-xl border-2 border-neutral-100 hover:bg-neutral-50 text-xs font-black uppercase tracking-widest text-neutral-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSkill}
                disabled={savingSkill}
                className="flex-1 py-3.5 rounded-xl bg-[#1f644e] hover:bg-[#164d3c] text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed shadow-lg"
              >
                {savingSkill ? 'Saving...' : 'Save Skill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
