'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
import CustomDropdownMinimal from '../CustomDropdown';
/**
 * Subscribers management client component with enhanced UI
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
                  unsubscribedAt: updatedSubscriber.unsubscribedAt,
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
    <div className="">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
          <p className="text-gray-600 mt-1">
            Manage your newsletter subscribers and view analytics
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FontAwesomeIcon icon={faDownload} className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faUserCheck} className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FontAwesomeIcon icon={faUserClock} className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
              />
              <input
                type="text"
                placeholder="Search subscribers by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Subscribers ({filteredSubscribers.length})
          </h3>
        </div>

        {filteredSubscribers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No subscribers found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscriber
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{subscriber.email}</div>
                        {subscriber.name && (
                          <div className="text-sm text-gray-500">{subscriber.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subscriber.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {subscriber.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {subscriber.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscriber.subscribedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
      </div>
    </div>
  );
}
