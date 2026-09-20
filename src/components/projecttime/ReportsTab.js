'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProjectTime } from './ProjectTimeContext';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  User,
  FolderKanban,
  PieChart,
} from 'lucide-react';

export default function ReportsTab() {
  const { activeWorkspace, projects } = useProjectTime();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setIsLoading(true);
      let query = `/api/projecttime/reports?workspaceId=${activeWorkspace._id}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;
      if (selectedProjectId) query += `&projectId=${selectedProjectId}`;

      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setReportData(data);
      }
    } catch (e) {
      console.error('Failed to load report:', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, startDate, endDate, selectedProjectId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCSV = () => {
    if (!activeWorkspace) return;
    let query = `/api/projecttime/reports?workspaceId=${activeWorkspace._id}&format=csv`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;
    if (selectedProjectId) query += `&projectId=${selectedProjectId}`;

    window.open(query, '_blank');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1e3a34]">Reports & Analytics</h2>
          <p className="text-xs text-[#7c8e88] mt-0.5">Filter, analyze, and export time data</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white rounded-xl text-xs font-bold hover:bg-[#17503e] transition-all cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#e5e3d8] p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#7c8e88] mb-1">Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#7c8e88] mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#7c8e88] mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none"
          />
        </div>
      </div>

      {/* Summary Metrics */}
      {reportData?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e5e3d8] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold uppercase text-[#7c8e88]">Total Hours</span>
            <p className="text-2xl font-bold font-mono text-[#1e3a34] mt-1">
              {reportData.summary.totalHours}h
            </p>
          </div>
          <div className="bg-white border border-[#e5e3d8] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold uppercase text-[#7c8e88]">Billable Hours</span>
            <p className="text-2xl font-bold font-mono text-[#1f644e] mt-1">
              {reportData.summary.billableHours}h
            </p>
          </div>
          <div className="bg-white border border-[#e5e3d8] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold uppercase text-[#7c8e88]">Non-Billable</span>
            <p className="text-2xl font-bold font-mono text-[#c94c4c] mt-1">
              {reportData.summary.nonBillableHours}h
            </p>
          </div>
          <div className="bg-white border border-[#e5e3d8] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold uppercase text-[#7c8e88]">Total Entries</span>
            <p className="text-2xl font-bold font-mono text-[#1e3a34] mt-1">
              {reportData.summary.totalEntries}
            </p>
          </div>
        </div>
      )}

      {/* Breakdown by Project */}
      <div className="bg-white rounded-2xl border border-[#e5e3d8] p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#1e3a34]">Time by Project</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e5e3d8] text-xs font-bold text-[#7c8e88]">
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3 text-right">Estimate</th>
                <th className="py-2.5 px-3 text-right">Tracked Hours</th>
                <th className="py-2.5 px-3 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f5f2] text-xs font-medium text-[#1e3a34]">
              {!reportData?.byProject || reportData.byProject.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-[#7c8e88]">
                    No entries for selected criteria.
                  </td>
                </tr>
              ) : (
                reportData.byProject.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fcfbf5]">
                    <td className="py-2.5 px-3 font-bold">{item.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {item.estimatedHours ? `${item.estimatedHours}h` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-[#1f644e]">
                      {item.trackedHours}h
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-bold ${
                        item.isOverBudget ? 'text-[#c94c4c]' : 'text-[#7c8e88]'
                      }`}
                    >
                      {item.remainingHours}h
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown by Team Member */}
      <div className="bg-white rounded-2xl border border-[#e5e3d8] p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#1e3a34]">Time by User</h3>
        <div className="space-y-2">
          {!reportData?.byUser || reportData.byUser.length === 0 ? (
            <p className="text-xs text-[#7c8e88]">No user time entries.</p>
          ) : (
            reportData.byUser.map((u) => (
              <div
                key={u.email}
                className="flex items-center justify-between p-3 rounded-xl border border-[#f0f5f2]"
              >
                <div>
                  <span className="font-bold text-xs text-[#1e3a34]">{u.name}</span>
                  <span className="text-[11px] text-[#7c8e88] block">{u.email}</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#1f644e]">
                  {u.trackedHours} hrs ({u.entriesCount} entries)
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
