'use client';

import { useState } from 'react';
import { createProject } from '@/app/actions/projectActions';
import { Input, Button } from '@/components/ui';

export default function NewProjectPage() {
  const [images, setImages] = useState([{ url: '', alt: '', caption: '' }]);
  const [tags, setTags] = useState([{ name: '', category: '' }]);

  const addImage = () => {
    setImages([...images, { url: '', alt: '', caption: '' }]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index, field, value) => {
    const newImages = [...images];
    newImages[index][field] = value;
    setImages(newImages);
  };

  const addTag = () => {
    setTags([...tags, { name: '', category: '' }]);
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const updateTag = (index, field, value) => {
    const newTags = [...tags];
    newTags[index][field] = value;
    setTags(newTags);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">New Project</h3>
            <p className="mt-1 text-sm text-gray-600">
              Add a new project to your portfolio. Fill out all the required information.
            </p>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form action={async (formData) => {
            // Add images and tags as JSON strings
            formData.append('images', JSON.stringify(images.filter(img => img.url)));
            formData.append('tags', JSON.stringify(tags.filter(tag => tag.name)));
            
            await createProject(formData);
          }}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                
                {/* Basic Info */}
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <Input 
                      name="title" 
                      label="Project Title" 
                      required 
                      placeholder="My Awesome Project"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <Input 
                      name="slug" 
                      label="URL Slug" 
                      required 
                      placeholder="my-awesome-project"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <Input 
                      name="projectNumber" 
                      label="Project Number" 
                      required 
                      placeholder="01"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select 
                      name="category" 
                      required
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                    >
                      <option value="">Select Category</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                      <option value="Branding">Branding</option>
                      <option value="E-commerce">E-commerce</option>
                    </select>
                  </div>

                  <div className="col-span-6">
                    <Input 
                      name="tagline" 
                      label="Tagline" 
                      required 
                      placeholder="A brief, catchy description"
                    />
                  </div>

                  <div className="col-span-6">
                    <Input 
                      name="thumbnail" 
                      label="Thumbnail Image URL" 
                      required 
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    className="shadow-sm focus:ring-black focus:border-black mt-1 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Brief project description for listings..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Description
                  </label>
                  <textarea
                    name="fullDescription"
                    rows={6}
                    required
                    className="shadow-sm focus:ring-black focus:border-black mt-1 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Detailed project description for the project page..."
                  />
                </div>

                {/* Featured Toggle */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      name="featured"
                      type="checkbox"
                      value="true"
                      className="focus:ring-black h-4 w-4 text-black border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-700">Featured Project</label>
                    <p className="text-gray-500">Show this project prominently on the homepage.</p>
                  </div>
                </div>

                {/* Images Section */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Project Images</h4>
                  {images.map((image, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 mb-4 p-4 border rounded-lg">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={image.url}
                          onChange={(e) => updateImage(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Alt text"
                          value={image.alt}
                          onChange={(e) => updateImage(index, 'alt', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Caption"
                          value={image.caption}
                          onChange={(e) => updateImage(index, 'caption', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="w-full h-10 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImage}
                    className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    Add Image
                  </button>
                </div>

                {/* Tags Section */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Technologies & Tags</h4>
                  {tags.map((tag, index) => (
                    <div key={index} className="grid grid-cols-6 gap-4 mb-4 p-4 border rounded-lg">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Technology name"
                          value={tag.name}
                          onChange={(e) => updateTag(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={tag.category}
                          onChange={(e) => updateTag(index, 'category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                        >
                          <option value="">Select Category</option>
                          <option value="frontend">Frontend</option>
                          <option value="backend">Backend</option>
                          <option value="database">Database</option>
                          <option value="tool">Tool</option>
                          <option value="framework">Framework</option>
                          <option value="language">Language</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="w-full h-10 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTag}
                    className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    Add Tag
                  </button>
                </div>

              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <Button type="submit" variant="primary">
                  Create Project
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
