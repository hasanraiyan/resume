'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/custom-ui';
import { deleteContributor } from '@/app/actions/contributorActions';

export default function ContributorsClient({ initialContributors }) {
  const [contributors, setContributors] = useState(initialContributors);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id) => {
    if (
      !confirm('Are you sure you want to delete this contributor? This action cannot be undone.')
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteContributor(id);
      setContributors(contributors.filter((c) => c._id !== id));
    } catch (error) {
      console.error('Failed to delete contributor:', error);
      alert('Failed to delete contributor. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredContributors = contributors.filter(
    (contributor) =>
      contributor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contributor.bio && contributor.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search contributors by name or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="text-sm text-neutral-500">
            {filteredContributors.length} contributor{filteredContributors.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Contributors Grid */}
      {filteredContributors.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-users text-neutral-400 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">
            {searchTerm ? 'No contributors found' : 'No contributors yet'}
          </h3>
          <p className="text-neutral-600 mb-8">
            {searchTerm
              ? 'Try adjusting your search terms.'
              : 'Get started by adding your first contributor to your portfolio projects.'}
          </p>
          {!searchTerm && (
            <Button href="/admin/contributors/new" variant="primary">
              <i className="fas fa-plus mr-2"></i>
              Create First Contributor
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContributors.map((contributor) => (
            <Card
              key={contributor._id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group"
            >
              {/* Contributor Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={contributor.avatar}
                      alt={contributor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-black group-hover:text-neutral-700 transition-colors truncate">
                        {contributor.name}
                      </h3>
                      <p className="text-sm text-neutral-500 line-clamp-2">
                        {contributor.bio || 'No bio available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contributor Links */}
                <div className="flex space-x-3 mb-4">
                  {contributor.socialLinks?.portfolio && (
                    <a
                      href={contributor.socialLinks.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-black transition-colors"
                      title="Portfolio"
                    >
                      <i className="fas fa-globe"></i>
                    </a>
                  )}
                  {contributor.socialLinks?.linkedin && (
                    <a
                      href={contributor.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-black transition-colors"
                      title="LinkedIn"
                    >
                      <i className="fab fa-linkedin"></i>
                    </a>
                  )}
                  {contributor.socialLinks?.github && (
                    <a
                      href={contributor.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-black transition-colors"
                      title="GitHub"
                    >
                      <i className="fab fa-github"></i>
                    </a>
                  )}
                  {contributor.socialLinks?.twitter && (
                    <a
                      href={contributor.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-black transition-colors"
                      title="Twitter"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>
                  )}
                  {contributor.socialLinks?.dribbble && (
                    <a
                      href={contributor.socialLinks.dribbble}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-black transition-colors"
                      title="Dribbble"
                    >
                      <i className="fab fa-dribbble"></i>
                    </a>
                  )}
                  {contributor.socialLinks?.behance && (
                    <a
                      href={contributor.socialLinks.behance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-black transition-colors"
                      title="Behance"
                    >
                      <i className="fab fa-behance"></i>
                    </a>
                  )}
                </div>

                {/* Contributor Meta */}
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="flex items-center">
                    <i className="fas fa-calendar-alt mr-1"></i>
                    {new Date(contributor.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      href={`/admin/contributors/${contributor._id}/edit`}
                      variant="ghost"
                      size="small"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(contributor._id)}
                      disabled={deletingId === contributor._id}
                      variant="ghost"
                      size="small"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                    >
                      <i className="fas fa-trash mr-1"></i>
                      {deletingId === contributor._id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
