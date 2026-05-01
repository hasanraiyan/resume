import { useState } from 'react';
import { Button } from '@/components/custom-ui';
import CustomDropdownMinimal from '@/components/CustomDropdown';

const categoryOptions = [
  { value: 'Web Development', label: 'Web Development' },
  { value: 'Mobile App', label: 'Mobile App' },
  { value: 'UI/UX Design', label: 'UI/UX Design' },
  { value: 'Branding', label: 'Branding' },
  { value: 'E-commerce', label: 'E-commerce' },
];

export default function TagManager({ tags, setTags }) {
  const [editingIndex, setEditingIndex] = useState(null);

  const addTag = () => {
    setTags([...tags, { name: '', category: '' }]);
    setEditingIndex(tags.length);
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const updateTag = (index, field, value) => {
    const newTags = [...tags];
    newTags[index][field] = value;
    setTags(newTags);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {tags.map((tag, index) => (
          <div key={index} className="p-4 border border-neutral-200 rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm truncate pr-4">
                {tag.name || `Tag ${index + 1}`}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  className="text-sm text-neutral-600 hover:text-black"
                >
                  {editingIndex === index ? 'Collapse' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
            {editingIndex === index && (
              <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase">
                    Tag Name *
                  </label>
                  <input
                    type="text"
                    value={tag.name}
                    onChange={(e) => updateTag(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase">
                    Category
                  </label>
                  <CustomDropdownMinimal
                    options={categoryOptions}
                    value={tag.category}
                    onChange={(e) => updateTag(index, 'category', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Button type="button" onClick={addTag} variant="secondary" size="small">
        <i className="fas fa-plus mr-2"></i> Add Tag
      </Button>
    </div>
  );
}
