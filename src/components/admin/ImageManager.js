'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import CustomDropdownMinimal from '@/components/CustomDropdown';

export default function ImageManager({ images, setImages }) {
  const [editingIndex, setEditingIndex] = useState(null);

  const addImage = () => {
    setImages([...images, { type: 'image', url: '', alt: '', caption: '' }]);
    setEditingIndex(images.length);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const updateImage = (index, field, value) => {
    const newImages = [...images];
    newImages[index][field] = value;
    setImages(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {images.map((image, index) => {
          const mediaType = image.type || 'image';
          const isVideo = mediaType === 'video';
          return (
            <div key={index} className="p-4 border border-neutral-200 rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate pr-4">
                  <span className="text-xs px-2 py-1 rounded bg-neutral-100 text-neutral-700 font-medium">
                    {isVideo ? '📹 Video' : '🖼️ Image'}
                  </span>
                  <span className="font-medium text-sm truncate">
                    {image.url || `${isVideo ? 'Video' : 'Image'} ${index + 1}`}
                  </span>
                </div>
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
                    onClick={() => removeImage(index)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {editingIndex === index && (
                <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
                  <div>
                    <CustomDropdownMinimal
                      label="MEDIA TYPE *"
                      name={`images.${index}.type`}
                      options={[
                        { value: 'image', label: 'Image' },
                        { value: 'video', label: 'YouTube Video' },
                      ]}
                      value={mediaType}
                      onChange={({ target }) => updateImage(index, 'type', target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1 uppercase">
                      {isVideo ? 'YouTube Video URL *' : 'Image URL *'}
                    </label>
                    <input
                      type="url"
                      value={image.url}
                      onChange={(e) => updateImage(index, 'url', e.target.value)}
                      placeholder={
                        isVideo
                          ? 'https://www.youtube.com/watch?v=...'
                          : 'https://example.com/image.jpg'
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    />
                    {isVideo && (
                      <p className="text-xs text-neutral-600 mt-1">
                        Supports: youtube.com/watch?v=ID or youtu.be/ID
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1 uppercase">
                      {isVideo ? 'Title' : 'Alt Text'}
                    </label>
                    <input
                      type="text"
                      value={image.alt}
                      onChange={(e) => updateImage(index, 'alt', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1 uppercase">
                      Caption
                    </label>
                    <input
                      type="text"
                      value={image.caption}
                      onChange={(e) => updateImage(index, 'caption', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Button type="button" onClick={addImage} variant="secondary" size="small">
        <i className="fas fa-plus mr-2"></i> Add Media
      </Button>
    </div>
  );
}
