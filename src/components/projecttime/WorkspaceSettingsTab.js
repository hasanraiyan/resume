'use client';

import { useState } from 'react';
import { useProjectTime } from './ProjectTimeContext';
import { Building, Users, Plus, Save, Check, Shield, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkspaceSettingsTab() {
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace, updateWorkspace } =
    useProjectTime();

  // Settings State
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  const [workspaceDesc, setWorkspaceDesc] = useState(activeWorkspace?.description || '');
  const [alertThreshold, setAlertThreshold] = useState(
    activeWorkspace?.settings?.alertThresholdPercent || 80
  );

  // New Member State
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Member');

  // New Workspace Modal
  const [showNewWSModal, setShowNewWSModal] = useState(false);
  const [newWSName, setNewWSName] = useState('');
  const [newWSDesc, setNewWSDesc] = useState('');

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return;

    await updateWorkspace(activeWorkspace._id, {
      name: workspaceName,
      description: workspaceDesc,
      settings: { alertThresholdPercent: parseInt(alertThreshold, 10) },
    });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !activeWorkspace) return;

    const updatedMembers = [
      ...(activeWorkspace.members || []),
      {
        email: newMemberEmail.trim(),
        name: newMemberEmail.split('@')[0],
        role: newMemberRole,
      },
    ];

    const success = await updateWorkspace(activeWorkspace._id, {
      members: updatedMembers,
    });

    if (success) {
      setNewMemberEmail('');
      toast.success(`Added ${newMemberEmail} to workspace`);
    }
  };

  const handleRemoveMember = async (emailToRemove) => {
    if (!activeWorkspace) return;
    const updatedMembers = (activeWorkspace.members || []).filter((m) => m.email !== emailToRemove);

    await updateWorkspace(activeWorkspace._id, {
      members: updatedMembers,
    });
  };

  const handleCreateWS = async (e) => {
    e.preventDefault();
    if (!newWSName.trim()) return;

    const success = await createWorkspace(newWSName.trim(), newWSDesc);
    if (success) {
      setShowNewWSModal(false);
      setNewWSName('');
      setNewWSDesc('');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Workspace Switcher Bar */}
      <div className="bg-white rounded-2xl border border-[#e5e3d8] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1e3a34]">Active Workspace</h2>
            <p className="text-xs text-[#7c8e88] mt-0.5">Select or create a workspace</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={activeWorkspace?._id || ''}
              onChange={(e) => switchWorkspace(e.target.value)}
              className="flex-1 sm:w-60 px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none"
            >
              {workspaces.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowNewWSModal(true)}
              className="flex items-center gap-1 px-3 py-2 bg-[#1f644e] text-white rounded-xl text-xs font-bold hover:bg-[#17503e] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Details Form */}
      {activeWorkspace && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-2xl border border-[#e5e3d8] p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#e5e3d8] pb-3">
            <h3 className="font-bold text-[#1e3a34]">Workspace Settings</h3>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1f644e] text-white rounded-xl text-xs font-bold hover:bg-[#17503e] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#7c8e88] mb-1">Workspace Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7c8e88] mb-1">
                Project Overrun Alert Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="150"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#7c8e88] mb-1">Description</label>
            <input
              type="text"
              value={workspaceDesc}
              onChange={(e) => setWorkspaceDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs text-[#1e3a34] outline-none"
            />
          </div>
        </form>
      )}

      {/* Members Management */}
      {activeWorkspace && (
        <div className="bg-white rounded-2xl border border-[#e5e3d8] p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-[#1e3a34]">Workspace Members & Roles</h3>

          {/* Add Member Form */}
          <form
            onSubmit={handleAddMember}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <input
              type="email"
              placeholder="member@org.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs text-[#1e3a34] outline-none"
              required
            />
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none"
            >
              <option value="Member">Member</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1f644e] text-white rounded-xl text-xs font-bold hover:bg-[#17503e] cursor-pointer"
            >
              Add Member
            </button>
          </form>

          {/* Members List */}
          <div className="space-y-2 pt-2">
            {(activeWorkspace.members || []).map((m) => (
              <div
                key={m.email}
                className="flex items-center justify-between p-3 rounded-xl border border-[#f0f5f2]"
              >
                <div>
                  <span className="font-bold text-xs text-[#1e3a34]">{m.name || m.email}</span>
                  <span className="text-[11px] text-[#7c8e88] block">{m.email}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#f0f5f2] text-[#1e3a34]">
                    {m.role}
                  </span>
                  {m.email !== activeWorkspace.ownerEmail && (
                    <button
                      onClick={() => handleRemoveMember(m.email)}
                      className="p-1 text-[#7c8e88] hover:text-[#c94c4c] rounded cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showNewWSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowNewWSModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-[#e5e3d8] shadow-2xl max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e3d8]">
              <h3 className="font-bold text-[#1e3a34]">Create New Workspace</h3>
              <button
                onClick={() => setShowNewWSModal(false)}
                className="text-[#7c8e88] hover:text-[#1e3a34]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWS} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engineering Team"
                  value={newWSName}
                  onChange={(e) => setNewWSName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Description</label>
                <textarea
                  placeholder="Workspace details..."
                  value={newWSDesc}
                  onChange={(e) => setNewWSDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewWSModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e]"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
