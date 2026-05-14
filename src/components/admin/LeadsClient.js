'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/custom-ui';
import {
  faSearch,
  faFilter,
  faTrash,
  faUsers,
  faCheckCircle,
  faClock,
  faEye,
  faEdit,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CustomDropdownMinimal from '../CustomDropdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/custom-ui/Dialog';

export default function LeadsClient({ initialLeads, stats }) {
  const [leads, setLeads] = useState(initialLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'converted', label: 'Converted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'archived', label: 'Archived' },
  ];

  const uniqueTypes = [...new Set(initialLeads.map((l) => l.type))];
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    ...uniqueTypes.map((t) => ({ value: t, label: t })),
  ];

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.name && lead.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesType = typeFilter === 'all' || lead.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleUpdateLead = async (id, updates) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
        if (selectedLead?.id === id) {
          setSelectedLead((prev) => ({ ...prev, ...data }));
        }
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/leads?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'converted':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Lead Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and manage waitlist entries and form responses.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Total Records
            </p>
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              New Leads
            </p>
            <p className="text-xl font-bold">{stats.byStatus['new'] || 0}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <FontAwesomeIcon icon={faClock} />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Past 7 Days
            </p>
            <p className="text-xl font-bold">{stats.recent}</p>
          </div>
          <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
            <FontAwesomeIcon icon={faUsers} />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Qualified
            </p>
            <p className="text-xl font-bold">{stats.byStatus['qualified'] || 0}</p>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Creators
            </p>
            <p className="text-xl font-bold">{stats.byType['coursify-creator'] || 0}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gray-50/50">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all"
            />
          </div>
          <div className="w-full lg:w-48">
            <CustomDropdownMinimal
              label="Status"
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="w-full lg:w-48">
            <CustomDropdownMinimal
              label="Type"
              value={typeFilter}
              options={typeOptions}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4 font-bold">User</th>
              <th className="px-6 py-4 font-bold">Type</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Date</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{lead.name || 'Anonymous'}</div>
                  <div className="text-xs text-gray-500">{lead.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 rounded-md text-gray-600">
                    {lead.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter ${getStatusColor(lead.status)}`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{formatDate(lead.createdAt)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLead(lead.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center text-gray-400 italic">
                  No leads found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          {selectedLead && (
            <div className="flex flex-col">
              <div className="bg-gray-50 p-6 border-b">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${getStatusColor(selectedLead.status)}`}
                    >
                      {selectedLead.status}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-white border rounded-md text-gray-500">
                      {selectedLead.type}
                    </span>
                  </div>
                  <DialogTitle className="text-2xl font-black">
                    {selectedLead.name || 'Anonymous User'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500">
                    {selectedLead.email}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Form Data */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                    Submitted Data
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    {Object.entries(selectedLead.data || {}).length > 0 ? (
                      Object.entries(selectedLead.data).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase text-gray-500">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm text-gray-900">{String(value)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No extra data submitted.</p>
                    )}
                  </div>
                </div>

                {/* Status & Notes */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                      Action Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {statusOptions
                        .filter((o) => o.value !== 'all')
                        .map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleUpdateLead(selectedLead.id, { status: opt.value })}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                              selectedLead.status === opt.value
                                ? 'bg-gray-900 border-gray-900 text-white shadow-lg'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-900'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                      Admin Notes
                    </label>
                    <textarea
                      placeholder="Add internal notes about this lead..."
                      className="w-full min-h-[100px] p-4 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all"
                      value={selectedLead.notes || ''}
                      onChange={(e) => handleUpdateLead(selectedLead.id, { notes: e.target.value })}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="pt-6 border-t">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                    System Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div>
                      <p className="font-bold text-gray-500">IP Address</p>
                      <p className="text-gray-900">{selectedLead.metadata?.ipAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-500">Source Path</p>
                      <p className="text-gray-900">{selectedLead.metadata?.path || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-bold text-gray-500">User Agent</p>
                      <p
                        className="text-gray-900 truncate"
                        title={selectedLead.metadata?.userAgent}
                      >
                        {selectedLead.metadata?.userAgent || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t flex justify-end">
                <Button onClick={() => setIsModalOpen(false)}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
