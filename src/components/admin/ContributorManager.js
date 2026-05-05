'use client';

import { Card, Button } from '@/components/custom-ui';
import CustomDropdownMinimal from '@/components/CustomDropdown';

export default function ContributorManager({ contributors, setContributors, allContributors }) {
  const addContributor = () => {
    setContributors([
      ...contributors,
      { contributor: '', role: '', order: contributors.length, isActive: true },
    ]);
  };

  const removeContributor = (index) => {
    setContributors(contributors.filter((_, i) => i !== index));
  };

  const toggleStatus = (index) => {
    const updated = [...contributors];
    updated[index] = { ...updated[index], isActive: !updated[index].isActive };
    setContributors(updated);
  };

  const updateContributor = (index, field, value) => {
    const updated = [...contributors];
    updated[index] = { ...updated[index], [field]: value };
    setContributors(updated);
  };

  return (
    <Card className="p-6 mt-8">
      <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">
        Project Contributors
      </h3>

      <div className="space-y-3">
        {contributors.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-4">No contributors assigned yet.</p>
        ) : (
          contributors.map((projectContributor, index) => {
            const isActive = projectContributor.isActive !== false;
            const contributorData =
              projectContributor._contributorData ||
              allContributors.find((c) => c._id === projectContributor.contributor);

            const availableContributorsForThisItem = allContributors.filter(
              (c) =>
                !contributors.some((pc) => pc.contributor === c._id) ||
                projectContributor.contributor === c._id
            );

            return (
              <div
                key={index}
                className={`p-4 border rounded-lg transition-colors ${
                  isActive ? 'border-neutral-200 bg-white' : 'border-neutral-300 bg-neutral-50'
                }`}
              >
                {/* Status row */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    {isActive ? 'Current' : 'Past'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStatus(index)}
                      className={`text-xs px-2 py-1 border rounded transition-colors ${
                        isActive
                          ? 'border-neutral-300 text-neutral-600 hover:border-neutral-500'
                          : 'border-green-300 text-green-700 hover:border-green-500'
                      }`}
                    >
                      {isActive ? 'Set as Past' : 'Set as Current'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeContributor(index)}
                      className="text-neutral-300 hover:text-red-500 p-1 transition-colors"
                      title="Remove from project"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <CustomDropdownMinimal
                      label="Contributor"
                      options={availableContributorsForThisItem.map((c) => ({
                        value: c._id,
                        label: c.name,
                      }))}
                      value={projectContributor.contributor}
                      onChange={(e) => updateContributor(index, 'contributor', e.target.value)}
                      name={`contributor-${index}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1 uppercase">
                      Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Lead Developer"
                      value={projectContributor.role}
                      onChange={(e) => updateContributor(index, 'role', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                {contributorData && (
                  <div
                    className={`flex items-center mt-3 pt-3 border-t border-neutral-100 ${!isActive ? 'opacity-60' : ''}`}
                  >
                    <img
                      src={contributorData.avatar}
                      alt={contributorData.name}
                      className={`w-6 h-6 rounded-full mr-2 object-cover ${!isActive ? 'grayscale' : ''}`}
                    />
                    <span className="text-xs text-neutral-600">{contributorData.name}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4">
        <Button type="button" onClick={addContributor} variant="secondary" size="small">
          <i className="fas fa-plus mr-2"></i> Add Contributor
        </Button>
      </div>
    </Card>
  );
}
