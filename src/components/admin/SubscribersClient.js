'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import {
  faDownload,
  faSearch,
  faFilter,
  faEye,
  faEyeSlash,
  faTrash,
  faUsers,
  faUserCheck,
  faUserClock,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CustomDropdownMinimal from '../CustomDropdown';

/**
 * Subscribers management client component with two-color design
 * @param {Object} props
 * @param {Array} props.initialSubscribers - Initial subscribers data
 * @param {Object} props.initialStats - Initial statistics
 */
export default function SubscribersClient({ initialSubscribers, initialStats }) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [stats, setStats] = useState(initialStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const sourceOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'footer', label: 'Footer' },
    { value: 'blog', label: 'Blog' },
    { value: 'project', label: 'Project' },
    { value: 'contact', label: 'Contact' },
    { value: 'admin', label: 'Admin' },
  ];

  // Filter subscribers based on search and filters
  const filteredSubscribers = subscribers.filter((subscriber) => {
    const matchesSearch =
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subscriber.name && subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && subscriber.isActive) ||
      (statusFilter === 'inactive' && !subscriber.isActive);

    const matchesSource = sourceFilter === 'all' || subscriber.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleDeleteSubscriber = async (subscriberId) => {
    if (
      !confirm('Are you sure you want to delete this subscriber? This action cannot be undone.')
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subscribers/${subscriberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Find the subscriber before filtering to get its status for stats update
        const subscriberToDelete = subscribers.find((sub) => sub.id === subscriberId);

        setSubscribers((prev) => prev.filter((sub) => sub.id !== subscriberId));
        // Update stats
        setStats((prev) => ({
          ...prev,
          total: prev.total - 1,
          active: subscriberToDelete?.isActive ? prev.active - 1 : prev.active,
        }));
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to delete subscriber'}`);
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      alert('Failed to delete subscriber. Please try again.');
    }
    setLoading(false);
  };

  const handleToggleStatus = async (subscriberId, currentStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subscribers/${subscriberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        const updatedSubscriber = await response.json();
        setSubscribers((prev) =>
          prev.map((sub) =>
            sub.id === subscriberId
              ? {
                  ...sub,
                  isActive: updatedSubscriber.isActive,
                  unsubscribedAt: updatedSubscriber.unsubscribedAt || null,
                }
              : sub
          )
        );

        // Update stats
        setStats((prev) => ({
          ...prev,
          active: currentStatus ? prev.active - 1 : prev.active + 1,
        }));
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update subscriber status'}`);
      }
    } catch (error) {
      console.error('Error updating subscriber:', error);
      alert('Failed to update subscriber. Please try again.');
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    const csvHeaders = ['Email', 'Name', 'Status', 'Source', 'Subscribed At', 'Unsubscribed At'];
    const csvData = filteredSubscribers.map((subscriber) => [
      subscriber.email,
      subscriber.name || '',
      subscriber.isActive ? 'Active' : 'Inactive',
      subscriber.source,
      new Date(subscriber.subscribedAt).toLocaleDateString(),
      subscriber.unsubscribedAt ? new Date(subscriber.unsubscribedAt).toLocaleDateString() : '',
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-2 border-neutral-200 pb-6">
        <h1 className="text-4xl font-bold text-black font-['Playfair_Display'] mb-2">
          Newsletter Subscribers
        </h1>
        <p className="text-neutral-600 text-lg">
          Manage your newsletter subscribers and view analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider">
                Total Subscribers
              </p>
              <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
              <FontAwesomeIcon icon={faUsers} className="text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider">
                Active Subscribers
              </p>
              <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                {stats.active}
              </p>
            </div>
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
              <FontAwesomeIcon icon={faUserCheck} className="text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider">
                This Week
              </p>
              <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                {stats.recent}
              </p>
            </div>
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
              <FontAwesomeIcon icon={faUserClock} className="text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 border-2 border-transparent hover:border-black transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4"
              />
              <input
                type="text"
                placeholder="Search subscribers by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors bg-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <CustomDropdownMinimal
              label="Status"
              name="statusFilter"
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          {/* Source Filter */}
          <div className="w-full sm:w-48">
            <CustomDropdownMinimal
              label="Source"
              name="sourceFilter"
              value={sourceFilter}
              options={sourceOptions}
              onChange={(e) => setSourceFilter(e.target.value)}
            />
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExportCSV}
            className="bg-black text-white hover:bg-neutral-800 transition-colors px-6 py-3"
          >
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Subscribers Table */}
      <Card className="border-2 border-transparent hover:border-black transition-all duration-300">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-black">
            Subscribers ({filteredSubscribers.length})
          </h3>
        </div>

        {filteredSubscribers.length === 0 ? (
          <div className="p-6 text-center text-neutral-500">
            No subscribers found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-6 py-4 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Subscriber
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredSubscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-black">{subscriber.email}</div>
                        {subscriber.name && (
                          <div className="text-sm text-neutral-500">{subscriber.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          subscriber.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {subscriber.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 capitalize">
                      {subscriber.source}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {formatDate(subscriber.subscribedAt)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleToggleStatus(subscriber.id, subscriber.isActive)}
                          disabled={loading}
                          className={`p-2 rounded-md transition-colors ${
                            subscriber.isActive
                              ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                          title={
                            subscriber.isActive ? 'Deactivate subscriber' : 'Activate subscriber'
                          }
                        >
                          <FontAwesomeIcon
                            icon={subscriber.isActive ? faEyeSlash : faEye}
                            className="w-4 h-4"
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteSubscriber(subscriber.id)}
                          disabled={loading}
                          className="p-2 rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                          title="Delete subscriber"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
