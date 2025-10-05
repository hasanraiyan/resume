'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createArticle, updateArticle, deleteArticle } from '@/app/actions/articleActions';
import RichTextEditor from './RichTextEditor';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SuccessToast from '@/components/admin/SuccessToast';
import ActionButton from '@/components/admin/ActionButton';

export function ArticleForm({ article, onSave }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentAction, setCurrentAction] = useState(null); // Track which action is currently running
  const [formData, setFormData] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    excerpt: article?.excerpt || '',
    coverImage: article?.coverImage || '',
    content: article?.content || '',
    status: article?.status || 'draft',
    tags: Array.isArray(article?.tags) ? article.tags.join(', ') : (article?.tags || ''),
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from title
    if (field === 'title' && !article) {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = (e, action, overrideStatus = null) => {
    e.preventDefault();

    const submitData = new FormData();
    // Use overrideStatus if provided (for publish/draft actions), otherwise use current formData status
    const currentStatus = overrideStatus || formData.status;

    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'status') {
        submitData.append(key, currentStatus);
      } else if (key === 'tags') {
        // Convert comma-separated string to array
        const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        submitData.append(key, JSON.stringify(tagsArray));
      } else {
        submitData.append(key, value);
      }
    });

    startTransition(async () => {
      let result;
      if (action === 'delete' && article?._id) {
        result = await deleteArticle(article._id);
      } else if (article?._id) {
        result = await updateArticle(article._id, submitData);
      } else {
        result = await createArticle(submitData);
      }

      if (result?.success === false) {
        setSuccessMessage(result.message);
        setShowSuccess(true);
      } else if (result?.success !== false) {
        const actionMessages = {
          'delete': 'Article deleted successfully!',
          'publish': 'Article published successfully!',
          'save': 'Article saved successfully!'
        };
        setSuccessMessage(actionMessages[action] || 'Article saved successfully!');
        setShowSuccess(true);

        // Update local form state to reflect the published status
        if (action === 'publish') {
          setFormData(prev => ({ ...prev, status: 'published' }));
        }
      }
    });
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    setCurrentAction('save');
    setFormData(prev => ({ ...prev, status: 'draft' }));
    handleSubmit(e, 'save', 'draft');
  };

  const handlePublish = (e) => {
    e.preventDefault();
    setCurrentAction('publish');
    setFormData(prev => ({ ...prev, status: 'published' }));
    handleSubmit(e, 'publish', 'published');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {showSuccess && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />
      )}

      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              placeholder="Enter article title"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <Input
              id="slug"
              type="text"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              required
              placeholder="url-friendly-slug"
            />
          </div>
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
            Excerpt *
          </label>
          <textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => handleInputChange('excerpt', e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief summary of the article"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image URL
            </label>
            <Input
              id="coverImage"
              type="url"
              value={formData.coverImage}
              onChange={(e) => handleInputChange('coverImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <Input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="react, javascript, web-development"
            />
          </div>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <RichTextEditor
            value={formData.content}
            onChange={(value) => handleInputChange('content', value)}
            placeholder="Write your article content here..."
          />
        </div>

        <div className="flex flex-wrap gap-4 pt-6 border-t">
          <ActionButton
            isSaving={isPending && currentAction === 'save'}
            text="Save Draft"
            savingText="Saving..."
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isPending}
          />

          <ActionButton
            isSaving={isPending && currentAction === 'publish'}
            text="Publish"
            savingText="Publishing..."
            variant="primary"
            onClick={handlePublish}
            disabled={isPending}
          />

          {article?._id && (
            <ActionButton
              isSaving={isPending && currentAction === 'delete'}
              text="Delete"
              savingText="Deleting..."
              variant="danger"
              onClick={(e) => {
                e.preventDefault();
                setCurrentAction('delete');
                handleSubmit(e, 'delete');
              }}
              disabled={isPending}
            />
          )}
        </div>
      </form>
    </div>
  );
}
