'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge } from '@/components/ui';

export default function ShortLinksDashboard() {
  const { data: session } = useSession();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
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
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (link) => {
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
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this link and all its click data?'))
      return;
    try {
      const response = await fetch(`/api/admin/short-links?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      fetchLinks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        expiresAt: formData.expiresAt || null,
      };

      const url = '/api/admin/short-links';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');

      setIsModalOpen(false);
      fetchLinks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCopyLink = (slug) => {
    const fullUrl = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <AdminPageWrapper
      title="Short Links"
      description="Create, manage, and track custom redirect links for your portfolio."
      actionButton={
        <Button onClick={openCreateModal} variant="primary">
          <i className="fas fa-plus mr-2"></i> Create Link
        </Button>
      }
    >
      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8">Loading links...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : links.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p>No short links found. Create your first link to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-100">
                  <th className="py-4 px-4 font-semibold text-sm">Status</th>
                  <th className="py-4 px-4 font-semibold text-sm">Link</th>
                  <th className="py-4 px-4 font-semibold text-sm">Destination</th>
                  <th className="py-4 px-4 font-semibold text-sm">Clicks</th>
                  <th className="py-4 px-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link._id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="py-4 px-4">
                      <Badge
                        variant="tag"
                        className={
                          link.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }
                      >
                        {link.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-black">{link.title || link.slug}</div>
                      <div className="text-xs text-neutral-500 flex items-center mt-1">
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
                    <td className="py-4 px-4 max-w-xs truncate text-sm text-neutral-600">
                      <a
                        href={link.destination}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {link.destination}
                      </a>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium">{link.totalClicks}</td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <Link href={`/admin/short-links/${link.slug}`}>
                        <Button variant="outline" size="sm" className="px-2 py-1 h-8">
                          <i className="fas fa-chart-bar"></i>
                        </Button>
                      </Link>
                      {/* Space reserved for future QR Code feature */}
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
        )}
      </Card>

      {/* Modal / Form overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-8 w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 font-['Playfair_Display']">
              {isEditing ? 'Edit Short Link' : 'Create Short Link'}
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
                      title="Only lowercase letters, numbers, and hyphens"
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
                <Button type="submit" variant="primary">
                  {isEditing ? 'Update Link' : 'Create Link'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </AdminPageWrapper>
  );
}
