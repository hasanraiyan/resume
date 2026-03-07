'use client';

import { useEffect, useRef, useState } from 'react';
import { InlineWidget } from 'react-calendly';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Section, Input } from '@/components/ui';
import CustomDropdownMinimal from './CustomDropdown';
import ActionButton from '@/components/admin/ActionButton';
import { createContactSubmission } from '@/app/actions/contactActions';
// ========================================
// 📦 DYNAMIC DATA (Backend-Ready)
// ========================================
const contactData = {
  heading: {
    title: "Let's Build.",
    subtitle: 'Something Amazing',
    description:
      'Turning complex requirements into elegant, functional software. Let’s start your next project.',
  },

  form: {
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'YOUR NAME',
        type: 'text',
        placeholder: '',
        required: true,
        gridColumn: 'half',
      },
      {
        id: 'email',
        name: 'email',
        label: 'YOUR EMAIL',
        type: 'email',
        placeholder: '',
        required: true,
        gridColumn: 'half',
      },
      {
        id: 'projectType',
        name: 'projectType',
        label: 'PROJECT TYPE',
        type: 'dropdown', // Changed from 'select' to 'dropdown'
        required: true,
        gridColumn: 'full',
        options: [
          { value: 'web-design', label: 'Web Design' },
          { value: 'web-development', label: 'Web Development' },
          { value: 'mobile-app', label: 'Mobile App' },
          { value: 'branding', label: 'Branding' },
          { value: 'ui-ux', label: 'UI/UX Design' },
          { value: 'consulting', label: 'Consulting' },
          { value: 'ecommerce', label: 'E-commerce' },
          { value: 'cms-development', label: 'CMS Development' },
          { value: 'seo-optimization', label: 'SEO Optimization' },
          { value: 'api-integration', label: 'API Integration' },
          { value: 'database-design', label: 'Database Design' },
          { value: 'maintenance', label: 'Website Maintenance' },
          { value: 'redesign', label: 'Website Redesign' },
          { value: 'landing-page', label: 'Landing Page' },
          { value: 'portfolio', label: 'Portfolio Website' },
          { value: 'blog', label: 'Blog/CMS' },
          { value: 'other', label: 'Other' },
        ],
        defaultValue: 'web-design',
      },
      {
        id: 'message',
        name: 'message',
        label: 'YOUR MESSAGE',
        type: 'textarea',
        placeholder: 'Tell me about your project...',
        required: true,
        rows: 5,
        gridColumn: 'full',
      },
    ],

    submitButton: {
      text: 'Send Message',
      loadingText: 'Sending...',
    },
  },

  apiEndpoint: '/api/contact',

  messages: {
    success: 'Thank you! Your message has been sent successfully.',
    error: 'Oops! Something went wrong. Please try again.',
  },
};

// ========================================
// 🎨 COMPONENT
// ========================================

/**
 * Contact form component with integrated Calendly scheduling.
 * @param {Object} props - Component props
 * @param {Object} props.config - Contact section configuration from CMS
 */
export default function Contact({ config }) {
  // Merge CMS config with default structure
  const activeConfig = {
    ...contactData,
    heading: {
      ...contactData.heading,
      title: config?.title || contactData.heading.title,
      subtitle: config?.subtitle || contactData.heading.subtitle,
      description: config?.description || contactData.heading.description,
    },
    calendlyUrl: config?.calendlyUrl || 'https://calendly.com/raiyanhasan2006/30min',
    messages: {
      success: config?.successMessage || contactData.messages.success,
      error: config?.errorMessage || contactData.messages.error,
    },
  };

  const initialFormData = activeConfig.form.fields.reduce((acc, field) => {
    acc[field.name] = field.defaultValue || '';
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [calendlyPrefill, setCalendlyPrefill] = useState({
    name: initialFormData.name || '',
    email: initialFormData.email || '',
  });
  const calendlyPrefillTimeout = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const container = document.querySelector('#contact');
      if (container) {
        const formContainer = container.querySelector('.max-w-3xl');
        if (formContainer && formContainer.children.length > 0) {
          // Reset any existing transforms
          gsap.set(formContainer.children, { opacity: 1, y: 0 });

          gsap.from(formContainer.children, {
            opacity: 0,
            y: 50,
            duration: 1,
            stagger: 0.2,
            scrollTrigger: {
              trigger: '#contact',
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
              refreshPriority: -1,
            },
          });
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  /**
   * Validates a single field value and returns an error string (or null).
   */
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return null;
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return 'Please enter a valid email address.';
        return null;
      case 'projectType':
        if (!value) return 'Please select a project type.';
        return null;
      case 'message':
        if (!value.trim()) return 'Message is required.';
        if (value.trim().length < 10) return 'Message must be at least 10 characters.';
        return null;
      default:
        return null;
    }
  };

  /** Validate all fields and return errors object. */
  const validateAll = () => {
    const errors = {};
    contactData.form.fields.forEach((field) => {
      const err = validateField(field.name, formData[field.name] ?? '');
      if (err) errors[field.name] = err;
    });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run full validation before submitting
    const errors = validateAll();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Mark all fields as touched so errors are visible
      const allTouched = contactData.form.fields.reduce(
        (acc, f) => ({ ...acc, [f.name]: true }),
        {}
      );
      setTouchedFields(allTouched);
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const formDataObj = new FormData(e.target);
      const result = await createContactSubmission(formDataObj);

      if (result.success) {
        const submittedName = formDataObj.get('name') || '';
        const submittedEmail = formDataObj.get('email') || '';
        setCalendlyPrefill({ name: submittedName, email: submittedEmail });
        setSubmitResult('success');
        setFormData(initialFormData);
        setFieldErrors({});
        setTouchedFields({});
      } else {
        setSubmitResult('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitResult('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    // Clear error for this field as the user corrects it
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }

    if (name === 'name' || name === 'email') {
      if (calendlyPrefillTimeout.current) clearTimeout(calendlyPrefillTimeout.current);
      calendlyPrefillTimeout.current = setTimeout(() => {
        setCalendlyPrefill({
          name: updatedFormData.name || '',
          email: updatedFormData.email || '',
        });
      }, 350);
    }
  };

  /** Show validation error when user leaves a field. */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  useEffect(() => {
    return () => {
      if (calendlyPrefillTimeout.current) {
        clearTimeout(calendlyPrefillTimeout.current);
      }
    };
  }, []);

  // Listen for chatbot prefill events
  useEffect(() => {
    const handlePrefill = (e) => {
      const payload = e.detail;
      if (!payload) return;

      // Extract and sanitize incoming fields
      const { name, email, projectType, message } = payload;

      setFormData((prev) => {
        const newData = { ...prev };
        if (typeof name === 'string') newData.name = name;
        if (typeof email === 'string') newData.email = email;
        if (typeof message === 'string') newData.message = message;

        if (typeof projectType === 'string') {
          // Check if it's a valid option
          const isValidOption = contactData.form.fields
            .find((f) => f.name === 'projectType')
            .options.some((opt) => opt.value === projectType);

          newData.projectType = isValidOption ? projectType : 'other';
        }

        return newData;
      });

      // Mark prefilled fields as touched so validation runs/shows
      setTouchedFields((prev) => ({
        ...prev,
        ...(name && { name: true }),
        ...(email && { email: true }),
        ...(projectType && { projectType: true }),
        ...(message && { message: true }),
      }));

      // Optionally validate the new data immediately
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        if (name) newErrors.name = validateField('name', name);
        if (email) newErrors.email = validateField('email', email);
        if (projectType) newErrors.projectType = validateField('projectType', projectType);
        if (message) newErrors.message = validateField('message', message);
        return newErrors;
      });
    };

    window.addEventListener('contact_prefill', handlePrefill);
    return () => window.removeEventListener('contact_prefill', handlePrefill);
  }, [activeConfig.form.fields]);

  /**
   * Renders a form field based on its type configuration.
   *
   * @param {Object} field - Field configuration object
   * @param {string} field.type - Type of field ('text', 'email', 'dropdown', 'textarea')
   * @param {string} field.name - Field name attribute
   * @param {string} field.label - Field label text
   * @param {boolean} field.required - Whether field is required
   * @param {string} field.placeholder - Placeholder text
   * @param {number} field.rows - Number of rows for textarea
   * @param {Array} field.options - Options for dropdown fields
   * @param {string} field.gridColumn - Grid column span ('half' or 'full')
   * @returns {JSX.Element} Rendered form field component
   */
  const renderField = (field) => {
    switch (field.type) {
      case 'textarea': {
        const hasErr = touchedFields[field.name] && fieldErrors[field.name];
        return (
          <div>
            <label className="block text-xs font-semibold mb-2 tracking-wider">{field.label}</label>
            <textarea
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={field.rows}
              required={field.required}
              placeholder={field.placeholder}
              className={`w-full border-b-2 pb-3 focus:outline-none transition text-sm sm:text-base bg-transparent hover-target resize-none ${
                hasErr
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-gray-300 focus:border-black'
              }`}
              suppressHydrationWarning={true}
            />
            {hasErr && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {fieldErrors[field.name]}
              </p>
            )}
          </div>
        );
      }

      case 'dropdown': {
        const hasErr = touchedFields[field.name] && fieldErrors[field.name];
        return (
          <div>
            <CustomDropdownMinimal
              label={field.label}
              options={field.options}
              value={formData[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
              name={field.name}
              required={field.required}
              placeholder={field.placeholder}
            />
            <input type="hidden" name={field.name} value={formData[field.name]} />
            {hasErr && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {fieldErrors[field.name]}
              </p>
            )}
          </div>
        );
      }

      default: {
        // text, email, etc.
        const hasErr = touchedFields[field.name] && fieldErrors[field.name];
        return (
          <div>
            <Input
              label={field.label}
              type={field.type}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
              required={field.required}
              hasError={hasErr}
            />
            {hasErr && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {fieldErrors[field.name]}
              </p>
            )}
          </div>
        );
      }
    }
  };

  // Show success message if form was submitted successfully
  if (submitResult === 'success') {
    return (
      <Section
        id="contact"
        title={`${activeConfig.heading.title} ${activeConfig.heading.subtitle}`}
        description={activeConfig.heading.description}
        centered={true}
        className="py-16 sm:py-20 md:py-24"
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-8 bg-gray-50 border-2 border-black rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-2">Message Sent Successfully!</h3>
            <p className="text-gray-600 mb-4">{activeConfig.messages.success}</p>
            <div className="mt-4">
              <div className="relative w-full overflow-hidden rounded-lg border border-gray-200">
                <InlineWidget
                  url={activeConfig.calendlyUrl}
                  styles={{
                    height: '720px',
                    width: '100%',
                  }}
                  prefill={{
                    name: calendlyPrefill.name,
                    email: calendlyPrefill.email,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section
      id="contact"
      title={`${activeConfig.heading.title} ${activeConfig.heading.subtitle}`}
      description={activeConfig.heading.description}
      centered={true}
      className="py-16 sm:py-20 md:py-24"
    >
      {/* Form */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-7">
            {activeConfig.form.fields
              .filter((field) => field.gridColumn === 'half')
              .map((field) => (
                <div key={field.id}>{renderField(field)}</div>
              ))}
          </div>

          {/* Full width fields */}
          {activeConfig.form.fields
            .filter((field) => field.gridColumn === 'full')
            .map((field) => (
              <div key={field.id}>{renderField(field)}</div>
            ))}

          {/* Calendly CTA */}
          <div className="mt-8">
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <h3 className="text-lg font-semibold text-black mb-2">Plan the follow-up call</h3>
              <p className="text-sm text-gray-600">
                Send your project details first. Right after you submit, you'll unlock my scheduling
                calendar to choose a time that suits you.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-6 sm:pt-7">
            <ActionButton
              isSaving={isSubmitting}
              text={contactData.form.submitButton.text}
              savingText={contactData.form.submitButton.loadingText}
              variant="primary"
              className="w-full sm:w-auto px-10 sm:px-14 py-4 sm:py-5"
            />
          </div>
        </form>
      </div>
    </Section>
  );
}
