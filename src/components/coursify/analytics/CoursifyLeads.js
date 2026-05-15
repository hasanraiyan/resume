'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Users,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { Badge } from '@/components/custom-ui';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export function CoursifyLeads() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/leads?limit=200');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const coursifyLeads = json.data.filter(
        (l) =>
          l.type?.toLowerCase().includes('waitlist') ||
          l.type?.toLowerCase().includes('coursify') ||
          l.metadata?.path?.includes('coursify')
      );

      setLeads(coursifyLeads);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    console.log(`[CoursifyLeads] Attempting to update lead ${id} to status: ${newStatus}`);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      console.log(`[CoursifyLeads] API response status: ${res.status}`);
      const json = await res.json();
      if (!json.success) {
        console.error(`[CoursifyLeads] API error:`, json.error);
        throw new Error(json.error);
      }

      console.log(`[CoursifyLeads] Successfully updated lead ${id} in DB`);
      setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, status: newStatus } : l)));
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error(`[CoursifyLeads] Update failed:`, err);
      toast.error(err.message);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.type?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || l.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // If the click is not on a dropdown-trigger or inside a dropdown-menu, close it
      if (!e.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'New' },
      contacted: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-100',
        label: 'Contacted',
      },
      qualified: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-100',
        label: 'Qualified',
      },
      converted: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-100',
        label: 'Converted',
      },
      rejected: {
        bg: 'bg-red-50',
        text: 'text-red-500',
        border: 'border-red-100',
        label: 'Rejected',
      },
      archived: {
        bg: 'bg-gray-50',
        text: 'text-gray-500',
        border: 'border-gray-100',
        label: 'Archived',
      },
    };
    const config = statusConfig[status] || statusConfig.new;
    return <Badge className={`${config.bg} ${config.text} ${config.border}`}>{config.label}</Badge>;
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-3 border-[#f0f5f2] border-t-[#1f644e] rounded-full animate-spin" />
          <p className="text-sm font-bold text-[#1e3a34]">Loading Waitlist...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1e3a34]">Waitlist Management</h2>
          <p className="text-xs text-[#7c8e88]">
            Manage early access requests and potential leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#b5c4be]" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-[#e5e3d8] rounded-xl text-xs outline-none focus:border-[#1f644e] w-full sm:w-48"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-[#e5e3d8] rounded-xl px-3 py-2 text-xs font-bold text-[#1e3a34] outline-none cursor-pointer hover:border-[#1f644e] transition-colors"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-[#e5e3d8] rounded-xl bg-[#f0f5f2]/30">
          <Users className="w-10 h-10 text-[#b5c4be] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#7c8e88]">No leads found</p>
        </div>
      ) : (
        <>
          <div className="border border-[#e5e3d8] rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5e3d8] bg-[#f0f5f2]">
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#1e3a34] uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#1e3a34] uppercase tracking-wide">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#1e3a34] uppercase tracking-wide">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#1e3a34] uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#1e3a34] uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-[#1e3a34] uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e3d8]">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-[#f0f5f2] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#1f644e] rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {lead.name ? lead.name[0].toUpperCase() : <Mail size={16} />}
                          </div>
                          <span className="text-sm font-bold text-[#1e3a34]">
                            {lead.name || 'Anonymous'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#7c8e88]">{lead.email}</td>
                      <td className="px-6 py-4">
                        <Badge className="bg-gray-100 text-[#7c8e88] text-[9px] uppercase tracking-tighter py-0">
                          {lead.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(lead.status)}</td>
                      <td className="px-6 py-4 text-xs text-[#7c8e88]">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center relative dropdown-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === lead._id ? null : lead._id);
                            }}
                            className="p-2 hover:bg-[#f0f5f2] text-[#7c8e88] rounded-lg transition-colors"
                            title="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openDropdown === lead._id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e3d8] rounded-lg shadow-lg z-50 min-w-[160px] py-1">
                              <button
                                onClick={() => {
                                  handleStatusUpdate(lead._id, 'contacted');
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2"
                              >
                                <Clock size={14} />
                                Mark Contacted
                              </button>
                              <button
                                onClick={() => {
                                  handleStatusUpdate(lead._id, 'qualified');
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                              >
                                <CheckCircle2 size={14} />
                                Mark Qualified
                              </button>
                              <button
                                onClick={() => {
                                  handleStatusUpdate(lead._id, 'rejected');
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                              >
                                <XCircle size={14} />
                                Mark Rejected
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 bg-white border border-[#e5e3d8] rounded-xl">
              <div className="text-xs text-[#7c8e88]">
                Showing {startIndex + 1} to{' '}
                {Math.min(startIndex + ITEMS_PER_PAGE, filteredLeads.length)} of{' '}
                {filteredLeads.length} leads
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-[#e5e3d8] text-[#1e3a34] hover:bg-[#f0f5f2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === page
                          ? 'bg-[#1f644e] text-white'
                          : 'border border-[#e5e3d8] text-[#1e3a34] hover:bg-[#f0f5f2]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-[#e5e3d8] text-[#1e3a34] hover:bg-[#f0f5f2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
