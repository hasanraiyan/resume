'use client';

import { useTaskly } from '@/context/TasklyContext';

export default function SettingsTab() {
  const { settings, updateSettings } = useTaskly();

  return (
    <div className="pb-28 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="rounded-2xl border border-[#e5e3d8] bg-white p-6">
            <h2 className="text-lg font-bold text-[#1e3a34]">Taskly settings</h2>
            <p className="mt-1 text-sm text-[#7c8e88]">
              Tune a few defaults so new tasks match the way you like to work.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5e3d8] bg-white p-6 space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                  Default sort order
                </label>
                <select
                  value={settings.sortOrder}
                  onChange={(event) => updateSettings({ sortOrder: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
                >
                  <option value="due-date">Due date</option>
                  <option value="priority">Priority</option>
                  <option value="created">Recently created</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                  Default task status
                </label>
                <select
                  value={settings.defaultTaskStatus}
                  onChange={(event) => updateSettings({ defaultTaskStatus: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In progress</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                Default project color
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={settings.defaultProjectColor}
                  onChange={(event) => updateSettings({ defaultProjectColor: event.target.value })}
                  className="h-12 w-16 rounded-xl border border-[#e5e3d8] bg-white px-1 py-1"
                />
                <input
                  value={settings.defaultProjectColor}
                  onChange={(event) => updateSettings({ defaultProjectColor: event.target.value })}
                  className="flex-1 rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#e5e3d8] p-4">
              <div>
                <p className="text-sm font-bold text-[#1e3a34]">Delete confirmation</p>
                <p className="text-xs text-[#7c8e88]">
                  Ask for confirmation before deleting tasks or projects.
                </p>
              </div>
              <button
                onClick={() => updateSettings({ confirmDelete: !settings.confirmDelete })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                  settings.confirmDelete ? 'bg-[#1f644e]' : 'bg-[#d7d3c5]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    settings.confirmDelete ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
