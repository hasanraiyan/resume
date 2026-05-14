'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/custom-ui';

/**
 * @fileoverview Generic, config-driven lead capture form.
 * Supports custom fields, multiple form types, and premium glassmorphism styling.
 *
 * @param {Object} props
 * @param {string} props.type - The unique identifier for this form (e.g. 'coursify-creator')
 * @param {string} props.title - Form title
 * @param {string} props.description - Form description
 * @param {Array} props.fields - Optional extra fields beyond name/email
 * @param {string} props.buttonText - Text for the submit button
 * @param {Function} props.onSuccess - Optional callback on success
 */
export function LeadForm({
  type,
  title = 'Join the Waitlist',
  description = 'Be the first to know when we launch new features.',
  fields = [],
  buttonText = 'Join Waitlist',
  onSuccess,
  minimal = false,
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    data: fields.reduce((acc, field) => ({ ...acc, [field.id]: '' }), {}),
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name: minimal ? 'Waitlist User' : formData.name,
          email: formData.email,
          data: formData.data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      setStatus('success');
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('Lead form submission error:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  const handleExtraFieldChange = (fieldId, value) => {
    setFormData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [fieldId]: value,
      },
    }));
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4 text-center animate-in fade-in zoom-in duration-500">
        <div className="h-12 w-12 bg-[#f0f5f2] rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-[#1f644e]" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a34] mb-1">You're on the list!</h3>
        <p className="text-[#7c8e88] text-xs max-w-xs mx-auto">
          We'll reach out to you as soon as we have updates.
        </p>
      </div>
    );
  }

  if (minimal) {
    return (
      <div className="w-full">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-5 py-3.5 bg-white/50 border border-[#e5e3d8] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1f644e]/10 focus:border-[#1f644e] transition-all placeholder:text-[#7c8e88]/50 text-[#1e3a34] pr-36"
            placeholder="Enter your email"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="absolute right-1.5 px-5 py-2 rounded-xl bg-[#1f644e] hover:bg-[#184d3c] text-white text-[11px] font-bold transition-all shadow-lg shadow-[#1f644e]/10 active:scale-95 disabled:opacity-70 flex items-center gap-2"
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Join Waitlist
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-[10px] text-red-500 font-medium ml-4 animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-2xl font-extrabold text-[#1e3a34] mb-2 tracking-tight">{title}</h2>
        <p className="text-[#7c8e88] text-sm leading-relaxed">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="group">
            <label
              htmlFor="name"
              className="block text-[10px] font-bold uppercase tracking-widest text-[#7c8e88] mb-1.5 ml-1 transition-colors group-focus-within:text-[#1f644e]"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[#f8faf9] border border-[#e5e3d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1f644e]/10 focus:border-[#1f644e] transition-all placeholder:text-[#b0bfbb]"
              placeholder="John Doe"
            />
          </div>

          <div className="group">
            <label
              htmlFor="email"
              className="block text-[10px] font-bold uppercase tracking-widest text-[#7c8e88] mb-1.5 ml-1 transition-colors group-focus-within:text-[#1f644e]"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-[#f8faf9] border border-[#e5e3d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1f644e]/10 focus:border-[#1f644e] transition-all placeholder:text-[#b0bfbb]"
              placeholder="john@example.com"
            />
          </div>

          {fields.map((field) => (
            <div key={field.id} className="group">
              <label
                htmlFor={field.id}
                className="block text-[10px] font-bold uppercase tracking-widest text-[#7c8e88] mb-1.5 ml-1 transition-colors group-focus-within:text-[#1f644e]"
              >
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  id={field.id}
                  required={field.required}
                  value={formData.data[field.id]}
                  onChange={(e) => handleExtraFieldChange(field.id, e.target.value)}
                  className="w-full px-4 py-3 bg-[#f8faf9] border border-[#e5e3d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1f644e]/10 focus:border-[#1f644e] transition-all placeholder:text-[#b0bfbb] min-h-[100px]"
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  id={field.id}
                  type={field.type || 'text'}
                  required={field.required}
                  value={formData.data[field.id]}
                  onChange={(e) => handleExtraFieldChange(field.id, e.target.value)}
                  className="w-full px-4 py-3 bg-[#f8faf9] border border-[#e5e3d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1f644e]/10 focus:border-[#1f644e] transition-all placeholder:text-[#b0bfbb]"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-6 rounded-xl bg-[#1f644e] hover:bg-[#184d3c] text-white font-bold transition-all shadow-lg shadow-[#1f644e]/20 active:scale-[0.98] disabled:opacity-70"
        >
          {status === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <div className="flex items-center justify-center gap-2">
              {buttonText}
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </Button>
      </form>
    </div>
  );
}
