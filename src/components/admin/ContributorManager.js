'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';

export default function ContributorManager({ contributors, setContributors, allContributors }) {
  const [selectedContributorId, setSelectedContributorId] = useState('');
  const [role, setRole] = useState('');

  const handleAddContributor = () => {
    if (!selectedContributorId || !role.trim()) return;

    const contributor = allContributors.find((c) => c._id === selectedContributorId);
    if (!contributor) return;

    const newContributor = {
      contributor: selectedContributorId,
      role: role.trim(),
      order: contributors.length,
      _contributorData: contributor, // Store full contributor data for display
    };

    setContributors([...contributors, newContributor]);
    setSelectedContributorId('');
    setRole('');
  };

  const handleRemoveContributor = (index) => {
    const updated = contributors.filter((_, i) => i !== index);
    setContributors(updated);
  };

  const handleUpdateRole = (index, newRole) => {
    const updated = [...contributors];
    updated[index].role = newRole;
    setContributors(updated);
  };

  const availableContributors = allContributors.filter(
    (c) => !contributors.some((pc) => pc.contributor === c._id)
  );

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">
        Project Contributors
      </h3>

      {/* Add Contributor Form */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
        <h4 className="text-sm font-semibold text-black mb-3">Add Contributor</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <select
              value={selectedContributorId}
              onChange={(e) => setSelectedContributorId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Select contributor...</option>
              {availableContributors.map((contributor) => (
                <option key={contributor._id} value={contributor._id}>
                  {contributor.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Role (e.g., Lead Developer)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={handleAddContributor}
              disabled={!selectedContributorId || !role.trim()}
              className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Add Contributor
            </button>
          </div>
        </div>
      </div>

      {/* Contributors List */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-black">Assigned Contributors</h4>
        {contributors.length === 0 ? (
          <p className="text-neutral-500 text-sm py-4">No contributors assigned yet.</p>
        ) : (
          contributors.map((projectContributor, index) => {
            const contributorData =
              projectContributor._contributorData ||
              allContributors.find((c) => c._id === projectContributor.contributor);

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {contributorData && (
                    <img
                      src={contributorData.avatar}
                      alt={contributorData.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-black">
                      {contributorData ? contributorData.name : 'Unknown Contributor'}
                    </p>
                    <input
                      type="text"
                      value={projectContributor.role}
                      onChange={(e) => handleUpdateRole(index, e.target.value)}
                      className="text-sm text-neutral-600 border-none p-0 focus:outline-none focus:ring-0 w-full"
                      placeholder="Role"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveContributor(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Remove contributor"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
