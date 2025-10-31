'use client';

import { Card, Button } from '@/components/ui';
import CustomDropdownMinimal from '@/components/CustomDropdown';

export default function ContributorManager({ contributors, setContributors, allContributors }) {
  const addContributor = () => {
    const newContributor = {
      contributor: '', // Empty ID
      role: '',
      order: contributors.length,
    };
    setContributors([...contributors, newContributor]);
  };

  const removeContributor = (index) => {
    setContributors(contributors.filter((_, i) => i !== index));
  };

  const updateContributor = (index, field, value) => {
    const updated = [...contributors];
    updated[index][field] = value;
    setContributors(updated);
  };

  return (
    <Card className="p-6 mt-8">
      <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">
        Project Contributors
      </h3>

      {/* Contributors List */}
      <div className="space-y-3">
        {contributors.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-4">No contributors assigned yet.</p>
        ) : (
          contributors.map((projectContributor, index) => {
            const contributorData =
              projectContributor._contributorData ||
              allContributors.find((c) => c._id === projectContributor.contributor);

            // For each dropdown, we want to show all unselected contributors PLUS the current one
            const availableContributorsForThisItem = allContributors.filter(
              (c) =>
                !contributors.some((pc) => pc.contributor === c._id) ||
                projectContributor.contributor === c._id
            );

            return (
              <div key={index} className="p-4 border border-neutral-200 rounded-lg bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {/* Contributor Selection */}
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

                  {/* Role Input */}
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1 uppercase">
                      Role
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="e.g., Lead Developer"
                        value={projectContributor.role}
                        onChange={(e) => updateContributor(index, 'role', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <button
                        type="button"
                        onClick={() => removeContributor(index)}
                        className="ml-2 text-red-600 hover:text-red-800 p-2"
                        title="Remove Contributor"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Display avatar and name for context */}
                {contributorData && (
                  <div className="flex items-center mt-3 pt-3 border-t border-neutral-100">
                    <img
                      src={contributorData.avatar}
                      alt={contributorData.name}
                      className="w-6 h-6 rounded-full mr-2 object-cover"
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
