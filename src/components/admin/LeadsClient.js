'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/custom-ui';
import {
  faSearch,
  faTrash,
  faUsers,
  faCheckCircle,
  faClock,
  faEye,
  faFilter,
  faArrowRight,
  faEnvelope,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/custom-ui/Dialog';
import { cn } from '@/utils/classNames';

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
    if (!confirm('Are you sure you want to delete this record?')) return;
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
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-black text-white',
      contacted: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
      qualified: 'bg-neutral-900 text-white',
      converted: 'bg-neutral-800 text-white',
      rejected: 'bg-red-50 text-red-600 border border-red-100',
    };
    return (
      <span
        className={cn(
          'text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest',
          styles[status] || 'bg-neutral-50 text-neutral-400'
        )}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 px-4 sm:px-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-200 pb-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tighter font-['Playfair_Display']">
            Leads <span className="text-neutral-300 italic">&</span> Responses
          </h1>
          <p className="text-neutral-500 font-['Space_Grotesk'] text-sm tracking-wide">
            MANAGING {stats.total} SUBMISSIONS ACROSS {uniqueTypes.length} CHANNELS
          </p>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-center md:text-right">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">
              New Hits
            </p>
            <p className="text-3xl font-bold tracking-tighter">{stats.byStatus['new'] || 0}</p>
          </div>
          <div className="w-[1px] h-10 bg-neutral-200 hidden md:block" />
          <div className="text-center md:text-right">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">
              Weekly Growth
            </p>
            <p className="text-3xl font-bold tracking-tighter">+{stats.recent}</p>
          </div>
        </div>
      </div>

      {/* Sophisticated Filter Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-2 rounded-2xl border border-neutral-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 w-3 h-3"
          />
          <input
            type="text"
            placeholder="Search by identity or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-transparent text-sm focus:outline-none placeholder:text-neutral-300 font-['Space_Grotesk']"
          />
        </div>
        <div className="h-6 w-[1px] bg-neutral-100 hidden lg:block" />
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 px-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mr-2 flex items-center gap-1 shrink-0">
            <FontAwesomeIcon icon={faFilter} className="w-2.5 h-2.5" /> Filter:
          </span>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap',
                statusFilter === opt.value
                  ? 'bg-black border-black text-white'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-black'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Card List */}
      <div className="space-y-4">
        {filteredLeads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => {
              setSelectedLead(lead);
              setIsModalOpen(true);
            }}
            className="group relative bg-white border border-neutral-100 rounded-2xl p-5 transition-all duration-300 hover:border-black hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-300 group-hover:bg-black group-hover:text-white transition-colors">
                <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg tracking-tight">
                    {lead.name || 'Anonymous Submission'}
                  </h3>
                  {getStatusBadge(lead.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-400 font-medium">
                  <span className="flex items-center gap-1.5 italic">{lead.email}</span>
                  <span className="w-1 h-1 bg-neutral-200 rounded-full" />
                  <span className="flex items-center gap-1.5 uppercase tracking-widest text-[9px] font-bold">
                    {lead.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-0 pt-4 md:pt-0">
              <div className="flex flex-col md:items-end">
                <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest mb-0.5">
                  Logged At
                </p>
                <p className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 text-neutral-300" />
                  {formatDate(lead.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-neutral-200 hover:text-black transition-colors rounded-full hover:bg-neutral-50">
                  <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLead(lead.id);
                  }}
                  className="p-2.5 text-neutral-200 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredLeads.length === 0 && (
          <div className="py-32 text-center space-y-4 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <FontAwesomeIcon icon={faSearch} className="w-6 h-6 text-neutral-200" />
            </div>
            <p className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
              No matches in the vault
            </p>
          </div>
        )}
      </div>

      {/* Premium Side-Panel Style Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 border-none shadow-3xl overflow-hidden rounded-[2rem]">
          {selectedLead && (
            <div className="flex flex-col h-full bg-white">
              {/* Modal Header */}
              <div className="bg-black text-white p-10 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                    <FontAwesomeIcon icon={faEnvelope} className="w-6 h-6" />
                  </div>
                  <DialogTitle className="text-4xl font-bold font-['Playfair_Display'] tracking-tight mb-2">
                    {selectedLead.name || 'Anonymous User'}
                  </DialogTitle>
                  <p className="text-neutral-400 font-medium text-sm italic">
                    {selectedLead.email}
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-10 overflow-y-auto max-h-[60vh] font-['Space_Grotesk']">
                {/* Custom Fields */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-neutral-300 uppercase tracking-[0.2em]">
                    Transmission Data
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(selectedLead.data || {}).length > 0 ? (
                      Object.entries(selectedLead.data).map(([key, value]) => (
                        <div
                          key={key}
                          className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col gap-1"
                        >
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-bold text-neutral-900">
                            {String(value)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-300 italic">
                        No supplemental telemetry data available.
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Command */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-neutral-300 uppercase tracking-[0.2em]">
                    Deployment Status
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions
                      .filter((o) => o.value !== 'all')
                      .map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleUpdateLead(selectedLead.id, { status: opt.value })}
                          className={cn(
                            'px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border',
                            selectedLead.status === opt.value
                              ? 'bg-black border-black text-white shadow-xl shadow-black/20 scale-105'
                              : 'bg-white border-neutral-100 text-neutral-400 hover:border-black hover:text-black'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Intelligence Notes */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-neutral-300 uppercase tracking-[0.2em]">
                    Internal Intelligence
                  </h4>
                  <textarea
                    placeholder="Document findings or follow-up status..."
                    className="w-full min-h-[120px] p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all placeholder:text-neutral-300"
                    value={selectedLead.notes || ''}
                    onChange={(e) => handleUpdateLead(selectedLead.id, { notes: e.target.value })}
                  />
                </div>

                {/* Metadata Fingerprint */}
                <div className="pt-8 border-t border-neutral-100 grid grid-cols-2 gap-6 text-[9px] font-bold uppercase tracking-widest">
                  <div>
                    <p className="text-neutral-300 mb-1">IP Fingerprint</p>
                    <p className="text-neutral-900">
                      {selectedLead.metadata?.ipAddress || 'UNKNOWN'}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-300 mb-1">Acquisition Path</p>
                    <p className="text-neutral-900">{selectedLead.metadata?.path || 'DIRECT'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-neutral-300 mb-1">Environmental Profile</p>
                    <p className="text-neutral-900 truncate leading-relaxed">
                      {selectedLead.metadata?.userAgent || 'SECURE AGENT'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="p-8 border-t border-neutral-100 bg-white">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-black hover:bg-neutral-800 text-white py-6 rounded-2xl font-bold uppercase tracking-widest text-xs"
                >
                  Dismiss Intel <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
