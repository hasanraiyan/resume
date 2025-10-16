'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import ActionButton from './ActionButton';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import IconPicker from './IconPicker';

const defaultService = {
  title: '',
  description: '',
  icon: '',
  displayOrder: 0,
  isActive: true,
};

export default function ServiceForm({ initialData, onSave, onDelete, isEditing = false, id }) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData || defaultService);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Define serviceData as alias for formData to avoid undefined errors
  const serviceData = formData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultService,
        ...initialData,
        displayOrder: initialData.displayOrder || 0,
        isActive: initialData.isActive !== false,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleIconSelect = (iconClass) => {
    setFormData((prev) => ({
      ...prev,
      icon: iconClass,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🔍 [SERVICE FORM] Starting submission, formData:', formData);
    console.log('📋 [SERVICE FORM] serviceData (alias for formData):', serviceData);

    if (!formData.title.trim() || !formData.description.trim() || !formData.icon) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      console.warn('⚠️ [SERVICE FORM] Validation failed - missing fields');
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formDataToSend = new FormData();
      console.log('📤 [SERVICE FORM] Preparing FormData for submission');

      Object.keys(formData).forEach((key) => {
        if (typeof formData[key] === 'boolean') {
          formDataToSend.append(key, formData[key] ? 'on' : '');
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      console.log('🚀 [SERVICE FORM] Calling updateService/createService');
      const result = isEditing ? await onSave(id, formDataToSend) : await onSave(formDataToSend);

      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
        console.error('❌ [SERVICE FORM] Submission error:', result.error);
      } else {
        setMessage({
          type: 'success',
          text: `Service ${isEditing ? 'updated' : 'created'} successfully!`,
        });
        console.log('✅ [SERVICE FORM] Submission successful');
        setTimeout(() => {
          router.push('/admin/services');
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
      console.error('💥 [SERVICE FORM] Unexpected error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setDeleting(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await onDelete();

      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Service deleted successfully!' });
        setTimeout(() => {
          router.push('/admin/services');
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-neutral-200 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-black font-['Playfair_Display'] mb-2">
            {isEditing ? 'Edit Service' : 'New Service'}
          </h1>
          <p className="text-neutral-600 text-lg">
            {isEditing
              ? 'Update the service information.'
              : 'Create a new service for your portfolio.'}
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => router.push('/admin/services')}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded transition-colors"
          >
            Cancel
          </button>

          {isEditing && onDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            >
              <i className="fas fa-trash mr-2"></i>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          <div className="flex items-center">
            <i
              className={`fas ${message.type === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle'} mr-2`}
            ></i>
            {message.text}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-black mb-6">Service Information</h2>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-black mb-2">
                Service Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="e.g., Web Development, UI/UX Design"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Describe what this service offers and how it benefits clients..."
                required
              />
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Icon *</label>
              <IconPicker
                selectedIcon={formData.icon}
                onIconSelect={handleIconSelect}
                placeholder="Choose an icon for this service..."
                className="w-full"
              />
            </div>

            {/* Display Order */}
            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-black mb-2">
                Display Order
              </label>
              <input
                type="number"
                id="displayOrder"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                min="0"
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="0"
              />
              <p className="text-sm text-neutral-500 mt-1">
                Lower numbers appear first. Leave as 0 for default ordering.
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-black focus:ring-black border-neutral-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-black">
                Active (show this service on the website)
              </label>
            </div>
          </div>
        </Card>

        {/* Preview */}
        {formData.title && formData.description && formData.icon && (
          <Card className="p-8">
            <h3 className="text-xl font-bold text-black mb-4">Preview</h3>
            <div className="p-6 border border-neutral-200 rounded-lg text-center">
              <div className="text-3xl text-black mb-3">
                <i className={formData.icon}></i>
              </div>
              <h4 className="text-lg font-bold mb-2">{formData.title}</h4>
              <p className="text-neutral-600">{formData.description}</p>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/services')}
            className="px-6 py-3 text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <i className={`fas ${isEditing ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                {isEditing ? 'Update Service' : 'Create Service'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0  flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-black mb-4">Delete Service</h3>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete "{formData.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash mr-2"></i>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
