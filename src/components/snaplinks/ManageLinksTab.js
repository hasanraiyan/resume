'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Skeleton } from '@/components/ui';

export default function ManageLinksTab() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    slug: '',
    destination: '',
    description: '',
    tags: '',
    expiresAt: '',
    isActive: true,
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/short-links');
      if (!response.ok) throw new Error('Failed to fetch short links');
      const result = await response.json();
      if (result.success) setLinks(result.data);
    } catch (err) {
      console.error(err);
      setError('Could not load short links. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      title: '',
      slug: '',
      destination: '',
      description: '',
      tags: '',
      expiresAt: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (link) => {
    setIsEditing(true);
    setFormData({
      id: link._id,
      title: link.title || '',
      slug: link.slug,
      destination: link.destination,
      description: link.description || '',
      tags: link.tags ? link.tags.join(', ') : '',
      expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().split('T')[0] : '',
      isActive: link.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...(isEditing && { id: formData.id }),
        title: formData.title,
        slug: formData.slug,
        destination: formData.destination,
        description: formData.description,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        isActive: formData.isActive,
      };

      const url = isEditing ? `/api/admin/short-links?id=${formData.id}` : '/api/admin/short-links';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save short link');
      }

      setIsModalOpen(false);
      fetchLinks();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this short link? This action cannot be undone.'))
      return;

    try {
      const response = await fetch(`/api/admin/short-links?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete');
      }

      fetchLinks();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleCopyLink = (slug) => {
    const fullUrl = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-neutral-500">Manage, edit, and create new short URLs.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} className="flex items-center gap-2">
          <i className="fas fa-plus"></i> Create Link
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card className="p-0 overflow-hidden bg-white shadow-sm border border-neutral-200">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : links.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <i className="fas fa-link text-4xl mb-4 opacity-50"></i>
            <p>No short links found. Create your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 text-sm border-b border-neutral-100">
                    <th className="px-6 py-4 font-medium">Link Details</th>
                    <th className="px-6 py-4 font-medium">Destination</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {links.map((link) => (
                    <tr key={link._id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-black">{link.title || link.slug}</div>
                        <div className="text-sm text-neutral-500 flex items-center mt-1">
                          /r/{link.slug}
                          <button
                            onClick={() => handleCopyLink(link.slug)}
                            className="ml-2 text-neutral-400 hover:text-black transition"
                            title="Copy Link"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-sm text-neutral-600 max-w-xs truncate"
                          title={link.destination}
                        >
                          <a
                            href={link.destination}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <i className="fas fa-external-link-alt text-xs opacity-50"></i>
                            <span className="truncate">{link.destination}</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="tag"
                          className={
                            link.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {link.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2 py-1 h-8"
                          onClick={() => openEditModal(link)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2 py-1 h-8 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(link._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
              {links.map((link) => (
                <div
                  key={link._id}
                  className="border border-neutral-100 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="max-w-[70%]">
                      <div
                        className="font-medium text-black truncate"
                        title={link.title || link.slug}
                      >
                        {link.title || link.slug}
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center mt-1 break-all">
                        /r/{link.slug}
                        <button
                          onClick={() => handleCopyLink(link.slug)}
                          className="ml-2 text-neutral-400 hover:text-black transition"
                          title="Copy Link"
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      </div>
                    </div>
                    <Badge
                      variant="tag"
                      className={
                        link.isActive
                          ? 'bg-green-100 text-green-800 shrink-0'
                          : 'bg-red-100 text-red-800 shrink-0'
                      }
                    >
                      {link.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="mb-3 text-sm text-neutral-600 truncate">
                    <a
                      href={link.destination}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      <i className="fas fa-link text-xs opacity-50"></i>
                      <span className="truncate">{link.destination}</span>
                    </a>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-neutral-50">
                    <div className="text-sm">
                      <span className="font-medium">{link.totalClicks}</span>{' '}
                      <span className="text-neutral-500">clicks</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 h-8"
                        onClick={() => openEditModal(link)}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 h-8 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(link._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Modal / Form overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-8 w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 font-['Playfair_Display']">
              {isEditing ? 'Edit SnapLink' : 'Create SnapLink'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Slug (Required)</label>
                  <div className="flex items-center">
                    <span className="bg-neutral-100 border-2 border-r-0 border-neutral-300 rounded-l-xl px-3 py-2 text-neutral-500 text-sm">
                      /r/
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                      }
                      className="w-full border-2 border-neutral-300 rounded-r-xl px-4 py-2 focus:border-black focus:ring-0 text-sm"
                      placeholder="e.g., github"
                      pattern="^[a-z0-9-]+$"
                      maxLength={50}
                      title="Only lowercase letters, numbers, and hyphens (Max 50 characters)"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title (Optional)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border-2 border-neutral-300 rounded-xl px-4 py-2 focus:border-black focus:ring-0 text-sm"
                    placeholder="My GitHub Profile"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Destination URL (Required)</label>
                <input
                  type="url"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full border-2 border-neutral-300 rounded-xl px-4 py-2 focus:border-black focus:ring-0 text-sm"
                  placeholder="https://github.com/hasanraiyan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-2 border-neutral-300 rounded-xl px-4 py-2 focus:border-black focus:ring-0 text-sm min-h-[80px]"
                  placeholder="Notes about where this link is used..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full border-2 border-neutral-300 rounded-xl px-4 py-2 focus:border-black focus:ring-0 text-sm"
                    placeholder="social, resume, ai-project"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expires At (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full border-2 border-neutral-300 rounded-xl px-4 py-2 focus:border-black focus:ring-0 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-neutral-700">
                  Link is currently Active
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  {isEditing ? 'Update Link' : 'Create Link'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
