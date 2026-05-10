'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { toast } from 'sonner';

const CoursifyStudioContext = createContext();

import { useCourseReader } from '@/hooks/coursify/useCourseReader';
import { useReaderUI } from '@/hooks/coursify/useReaderUI';

export function CoursifyStudioProvider({ id, children }) {
  const {
    course,
    sections,
    orderedSections,
    modules,
    activeSection,
    showOverview,
    visited,
    isLoading,
    sectionLoading,
    notFound,
    navigateTo,
    showOverviewPage,
    setActiveSection,
    setShowOverview,
    refresh,
  } = useCourseReader(id, true);

  const { sidebarOpen, expandedModules, toggleModule, toggleSidebar, closeSidebar } = useReaderUI(
    modules,
    activeSection,
    sections
  );

  const [activeTab, setActiveTab] = useState('content');
  const [editingSection, setEditingSection] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [showNewSection, setShowNewSection] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [showMeta, setShowMeta] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [planDraft, setPlanDraft] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: '',
    summary: '',
    sourceUrl: '',
    sourceType: 'other',
    notes: '',
  });
  const [noteSaving, setNoteSaving] = useState(false);

  // Manual refresh
  const refreshCourse = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (editMode && course) {
      setPlanDraft({
        authoringStatus: course.authoringStatus || 'idea',
        targetAudience: course.targetAudience || '',
        learningObjectives: (course.learningObjectives || []).join('\n'),
        prerequisites: (course.prerequisites || []).join('\n'),
        outcome: course.outcome || '',
        outline: course.outline || '',
        planningNotes: course.planningNotes || '',
      });
    } else if (!editMode) {
      setPlanDraft(null);
      setShowNoteForm(false);
    }
  }, [editMode, course]);

  const handleTogglePublish = async () => {
    const res = await fetch(`/api/coursify/courses/${id}/publish`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      toast.success(data.course.status === 'published' ? 'Published' : 'Unpublished');
      refreshCourse();
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/coursify/courses/${id}/thumbnail`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Thumbnail updated');
        refreshCourse();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setThumbnailUploading(false);
      e.target.value = '';
    }
  };

  const handleUpdateMeta = async (payload) => {
    setPlanSaving(true);
    try {
      const res = await fetch(`/api/coursify/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Course information updated');
        refreshCourse();
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleSaveSection = async (payload) => {
    if (editingSection) {
      const res = await fetch(`/api/coursify/sections/${editingSection._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Section updated');
        refreshCourse();
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } else {
      const res = await fetch(`/api/coursify/courses/${id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, moduleId: targetModuleId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Section added');
        setActiveSection(data.section._id);
        refreshCourse();
      } else {
        toast.error(data.error || 'Failed to add section');
      }
    }
    setEditingSection(null);
    setShowNewSection(false);
    setTargetModuleId(null);
  };

  const handleSaveModule = async (payload) => {
    if (editingModule?._id) {
      const res = await fetch(`/api/coursify/modules/${editingModule._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Module updated');
        refreshCourse();
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } else {
      const res = await fetch(`/api/coursify/courses/${id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Module created');
        refreshCourse();
      } else {
        toast.error(data.error || 'Failed to create');
      }
    }
    setEditingModule(null);
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Delete this module? Sections will become uncategorized.')) return;
    try {
      const res = await fetch(`/api/coursify/modules/${moduleId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Module deleted');
        refreshCourse();
      } else {
        toast.error(data.error || 'Failed to delete module');
      }
    } catch {
      toast.error('Error deleting module');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Delete this section?')) return;
    const res = await fetch(`/api/coursify/sections/${sectionId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Section deleted');
      refreshCourse();
    }
  };

  const handleSavePlan = async () => {
    if (!planDraft) return;
    setPlanSaving(true);
    try {
      const body = {
        ...planDraft,
        learningObjectives: planDraft.learningObjectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        prerequisites: planDraft.prerequisites
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await fetch(`/api/coursify/courses/${id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Plan saved');
        refreshCourse();
      } else {
        toast.error(data.error || 'Failed to save plan');
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.title.trim() || !noteForm.summary.trim()) {
      toast.error('Title and summary are required');
      return;
    }
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/coursify/courses/${id}/research-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteForm),
      });
      const data = await res.json();
      if (data.success) {
        setNoteForm({ title: '', summary: '', sourceUrl: '', sourceType: 'other', notes: '' });
        setShowNoteForm(false);
        toast.success('Note added');
        refreshCourse();
      } else {
        toast.error(data.error || 'Failed to add note');
      }
    } catch {
      toast.error('Failed to add note');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (index) => {
    if (!confirm('Delete this research note?')) return;
    try {
      const res = await fetch(`/api/coursify/courses/${id}/research-notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Note deleted');
        refreshCourse();
      } else {
        toast.error(data.error || 'Failed to delete note');
      }
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const value = {
    id,
    course,
    sections,
    orderedSections,
    modules,
    activeSection,
    showOverview,
    visited,
    isLoading,
    sectionLoading,
    notFound,
    sidebarOpen,
    expandedModules,
    activeTab,
    editingSection,
    editingModule,
    showNewSection,
    targetModuleId,
    showMeta,
    editMode,
    isRefreshing,
    thumbnailUploading,
    planDraft,
    planSaving,
    showNoteForm,
    noteForm,
    noteSaving,
    setActiveTab,
    setEditingSection,
    setEditingModule,
    setShowNewSection,
    setTargetModuleId,
    setShowMeta,
    setEditMode,
    setPlanDraft,
    setShowNoteForm,
    setNoteForm,
    setActiveSection,
    setShowOverview,
    toggleModule,
    toggleSidebar,
    closeSidebar,
    navigateTo,
    showOverviewPage,
    refreshCourse,
    handleTogglePublish,
    handleThumbnailUpload,
    handleUpdateMeta,
    handleSaveSection,
    handleSaveModule,
    handleDeleteModule,
    handleDeleteSection,
    handleSavePlan,
    handleAddNote,
    handleDeleteNote,
  };

  return <CoursifyStudioContext.Provider value={value}>{children}</CoursifyStudioContext.Provider>;
}

export const useCoursifyStudio = () => {
  const context = useContext(CoursifyStudioContext);
  if (!context) {
    throw new Error('useCoursifyStudio must be used within a CoursifyStudioProvider');
  }
  return context;
};
