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
          router.push('/admin/sections/services');
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
          router.push('/admin/sections/services');
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Form Header */}
      <div className="relative overflow-hidden rounded-3xl bg-black px-8 py-12 text-white shadow-2xl mb-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-['Playfair_Display'] mb-3 tracking-tight">
              {isEditing ? 'Edit Service' : 'New Service'}
            </h1>
            <p className="text-neutral-400 text-lg max-w-xl">
              {isEditing
                ? 'Refine your service details to stay competitive and clear.'
                : 'Define a new offering that showcases your unique skills.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/admin/sections/services')}
              className="px-6 py-2.5 text-sm font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-md border border-white/5 cursor-pointer"
            >
              Cancel
            </button>

            {isEditing && onDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all duration-300 backdrop-blur-md border border-red-500/10 cursor-pointer"
              >
                <i className="fas fa-trash-alt mr-2"></i>
                Delete
              </button>
            )}
          </div>
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
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 bg-white/80 backdrop-blur-lg border border-neutral-200/50 shadow-xl rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-black" />
              <h2 className="text-2xl font-bold text-black mb-8 flex items-center">
                <i className="fas fa-info-circle mr-3 text-neutral-400"></i>
                Service Details
              </h2>

              <div className="space-y-8">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3"
                  >
                    Service Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full p-4 bg-neutral-50/50 border border-neutral-200 rounded-2xl focus:ring-8 focus:ring-black/5 focus:border-black transition-all duration-300 text-lg font-medium outline-none"
                    placeholder="e.g., Full-Stack Development"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3"
                  >
                    Detailed Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className="w-full p-4 bg-neutral-50/50 border border-neutral-200 rounded-2xl focus:ring-8 focus:ring-black/5 focus:border-black transition-all duration-300 outline-none resize-none leading-relaxed"
                    placeholder="Briefly explain what's included and how you deliver value..."
                    required
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">
                    Visual Identity
                  </label>
                  <IconPicker
                    selectedIcon={formData.icon}
                    onIconSelect={handleIconSelect}
                    placeholder="Search and select an icon..."
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
                  {/* Display Order */}
                  <div>
                    <label
                      htmlFor="displayOrder"
                      className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3"
                    >
                      Priority Order
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="displayOrder"
                        name="displayOrder"
                        value={formData.displayOrder}
                        onChange={handleChange}
                        min="0"
                        className="w-full p-4 pl-12 bg-neutral-50/50 border border-neutral-200 rounded-2xl focus:ring-8 focus:ring-black/5 focus:border-black transition-all duration-300 outline-none"
                        placeholder="0"
                      />
                      <i className="fas fa-sort-amount-down absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"></i>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer mt-7">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black transition-all duration-300 cursor-pointer"></div>
                      <span className="ml-3 text-sm font-bold text-neutral-700">Live Status</span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Preview Section */}
            <div className="sticky top-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 px-2">
                Live Preview
              </h3>
              <div className="group perspective">
                <div
                  className={`relative transition-all duration-500 transform-gpu ${!formData.title ? 'opacity-40 blur-[2px]' : ''}`}
                >
                  <Card className="p-8 bg-white border border-neutral-200/50 shadow-2xl rounded-[2.5rem] overflow-hidden group-hover:shadow-black/5 transition-all duration-500 text-center">
                    <div className="absolute top-0 right-0 p-4">
                      {!formData.isActive && (
                        <div className="px-2 py-1 bg-neutral-100 text-[10px] font-bold text-neutral-400 rounded uppercase tracking-tighter">
                          Draft
                        </div>
                      )}
                    </div>

                    <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center text-3xl mx-auto mb-8 shadow-xl group-hover:rotate-6 transition-transform duration-500">
                      <i className={formData.icon || 'fas fa-question'}></i>
                    </div>

                    <h4 className="text-2xl font-bold text-black mb-4 font-['Playfair_Display']">
                      {formData.title || 'Service Title'}
                    </h4>

                    <p className="text-neutral-500 leading-relaxed italic">
                      {formData.description ||
                        'Your service description will appear here as you type. Make it compelling!'}
                    </p>
                  </Card>
                </div>
              </div>

              {/* Tips Card */}
              <Card className="mt-8 p-6 bg-black text-white rounded-3xl overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <h4 className="font-bold mb-3 flex items-center">
                  <i className="fas fa-lightbulb text-yellow-400 mr-2"></i>
                  Pro Tip
                </h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Use clear, action-oriented titles. High-quality icons help in visual communication
                  and information retention.
                </p>
              </Card>

              {/* Global Save Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-5 bg-black text-white text-lg font-bold rounded-2xl shadow-2xl shadow-black/20 hover:shadow-black/40 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 transition-all duration-300 overflow-hidden relative group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-3"></i>
                        {isEditing ? 'SYNCING...' : 'PUBLISHING...'}
                      </>
                    ) : (
                      <>
                        <i className={`fas ${isEditing ? 'fa-check' : 'fa-paper-plane'} mr-3`}></i>
                        {isEditing ? 'UPDATE SERVICE' : 'LAUNCH SERVICE'}
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-black translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
              </div>
            </div>
          </div>
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
                className="px-4 py-2 text-sm font-bold text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-xl transition-all duration-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-alt mr-2"></i>
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
