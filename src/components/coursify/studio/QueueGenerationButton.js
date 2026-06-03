'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCoursifyStudio } from '@/context/CoursifyStudioContext';

/**
 * Queues every empty section in the course for background AI generation, then
 * polls the queue so the user can see progress without babysitting each call.
 *
 * The actual "which sections are empty" decision is made server-side (the POST
 * handler reads full section content from the DB), because the studio loads
 * section content lazily and the client copy may be stale.
 */
export function QueueGenerationButton() {
  const { id, editMode } = useCoursifyStudio();
  const [queuing, setQueuing] = useState(false);
  const [counts, setCounts] = useState(null);
  const pollRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!id) return null;
    try {
      const res = await fetch(`/api/coursify/generate-queue?courseId=${id}`);
      const data = await res.json();
      if (data.success) {
        setCounts(data.counts);
        return data.counts;
      }
    } catch {
      /* ignore transient polling errors */
    }
    return null;
  }, [id]);

  // Poll while there is pending work; back off to idle once the queue drains.
  useEffect(() => {
    if (!editMode || !id) return;

    let cancelled = false;

    const tick = async () => {
      const c = await fetchStatus();
      if (cancelled) return;
      const pending = c ? (c.queued || 0) + (c.generating || 0) : 0;
      // Poll faster while work is in flight, slower when idle.
      pollRef.current = setTimeout(tick, pending > 0 ? 15_000 : 60_000);
    };

    tick();
    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [editMode, id, fetchStatus]);

  const handleQueue = async () => {
    if (!id || queuing) return;
    setQueuing(true);
    try {
      const res = await fetch('/api/coursify/generate-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to queue');
      }
      if (data.queued === 0) {
        toast.info(
          data.skipped > 0 ? 'All empty sections are already queued' : 'No empty sections to queue'
        );
      } else {
        toast.success(
          `Queued ${data.queued} section${data.queued === 1 ? '' : 's'} — generating in the background`
        );
      }
      fetchStatus();
    } catch (err) {
      toast.error(err.message || 'Failed to queue generation');
    } finally {
      setQueuing(false);
    }
  };

  if (!editMode) return null;

  const pending = counts ? (counts.queued || 0) + (counts.generating || 0) : 0;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleQueue}
        disabled={queuing}
        title="Queue all empty sections for background AI generation"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-[#e5e3d8] bg-white text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] transition-colors disabled:opacity-50"
      >
        {queuing ? (
          <Loader2 className="w-3 h-3 shrink-0 animate-spin" />
        ) : (
          <Sparkles className="w-3 h-3 shrink-0" />
        )}
        <span className="hidden sm:inline">Queue empty</span>
      </button>

      {pending > 0 && (
        <span
          title={`${counts.queued || 0} queued · ${counts.generating || 0} generating · ${counts.done || 0} done${counts.failed ? ` · ${counts.failed} failed` : ''}`}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-[#f0f5f2] text-[#1f644e]"
        >
          <Loader2 className="w-3 h-3 animate-spin" />
          {pending}
        </span>
      )}
      {pending === 0 && counts?.failed > 0 && (
        <span
          title={`${counts.failed} failed — open a section to retry`}
          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-[#c94c4c]"
        >
          {counts.failed} failed
        </span>
      )}
    </div>
  );
}
