'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

/**
 * NewsletterForm component for email subscription
 * @param {Object} props
 * @param {string} [props.source='footer'] - Source of the subscription (footer, blog, etc.)
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.showNameField=false] - Whether to show name input field
 * @param {string} [props.placeholder='Enter your email address'] - Email input placeholder
 * @param {string} [props.buttonText='Subscribe'] - Submit button text
 * @param {Function} [props.onSuccess] - Callback function when subscription is successful
 * @param {Function} [props.onError] - Callback function when subscription fails
 */
export default function NewsletterForm({
  source = 'footer',
  className = '',
  showNameField = false,
  placeholder = 'Enter your email address',
  buttonText = 'Subscribe',
  onSuccess,
  onError,
}) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear previous messages when user starts typing
    if (status !== 'idle') {
      setStatus('idle');
      setMessage('');
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, name } = formData;

    // Validate email
    if (!email.trim()) {
      setStatus('error');
      setMessage('Email address is required');
      onError?.('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      onError?.('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: showNameField ? name.trim() : undefined,
          source,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Successfully subscribed to our newsletter!');
        setFormData({ email: '', name: '' }); // Clear form
        onSuccess?.(data);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe. Please try again.');
        onError?.(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
      onError?.('Network error. Please check your connection and try again.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-green-600" />;
      case 'error':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-red-600" />;
      case 'loading':
        return (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        );
      default:
        return <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      case 'loading':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-gray-300 bg-white hover:border-gray-400';
    }
  };

  return (
    <div className={`newsletter-form ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {showNameField && (
          <div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your name (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={status === 'loading'}
            />
          </div>
        )}

        <div className="relative">
          <div
            className={`flex items-center border rounded-lg transition-all duration-200 ${getStatusColor()}`}
          >
            <div className="pl-4 pr-3 py-3">{getStatusIcon()}</div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={placeholder}
              required
              className="flex-1 px-0 py-3 bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500"
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {status === 'loading' ? 'Subscribing...' : buttonText}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`text-sm p-3 rounded-lg ${
              status === 'success'
                ? 'text-green-800 bg-green-50 border border-green-200'
                : 'text-red-800 bg-red-50 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <p className="text-xs text-gray-500 leading-relaxed">
          Join our newsletter for updates on new projects, articles, and insights. We respect your
          privacy and won't spam you.
        </p>
      </form>
    </div>
  );
}
