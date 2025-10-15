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
export default function Contact() {
  const initialFormData = contactData.form.fields.reduce((acc, field) => {
    acc[field.name] = field.defaultValue || '';
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Create FormData object from the form
      const formDataObj = new FormData(e.target);

      // Call the server action directly
      const result = await createContactSubmission(formDataObj);

      if (result.success) {
        const submittedName = formDataObj.get('name') || '';
        const submittedEmail = formDataObj.get('email') || '';

        setCalendlyPrefill({
          name: submittedName,
          email: submittedEmail,
        });

        setSubmitResult('success');
        // Clear the form
        setFormData(initialFormData);
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
    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedFormData);

    if (name === 'name' || name === 'email') {
      if (calendlyPrefillTimeout.current) {
        clearTimeout(calendlyPrefillTimeout.current);
      }

      calendlyPrefillTimeout.current = setTimeout(() => {
        setCalendlyPrefill({
          name: updatedFormData.name || '',
          email: updatedFormData.email || '',
        });
      }, 350);
    }
  };

  useEffect(() => {
    return () => {
      if (calendlyPrefillTimeout.current) {
        clearTimeout(calendlyPrefillTimeout.current);
      }
    };
  }, []);

  // Render field based on type
  const renderField = (field) => {
    switch (field.type) {
      case 'textarea':
        return (
          <div>
            <label className="block text-xs font-semibold mb-2 tracking-wider">{field.label}</label>
            <textarea
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              rows={field.rows}
              required={field.required}
              placeholder={field.placeholder}
              className="w-full border-b-2 border-gray-300 pb-3 focus:border-black focus:outline-none transition text-sm sm:text-base bg-transparent hover-target resize-none"
              suppressHydrationWarning={true}
            />
          </div>
        );

      case 'dropdown':
        return (
          <>
            <CustomDropdownMinimal
              label={field.label}
              options={field.options}
              value={formData[field.name]}
              onChange={handleChange}
              name={field.name}
              required={field.required}
              placeholder={field.placeholder}
            />
            <input type="hidden" name={field.name} value={formData[field.name]} />
          </>
        );

      default: // text, email, etc.
        return (
          <div>
            <Input
              label={field.label}
              type={field.type}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              required={field.required}
            />
          </div>
        );
    }
  };

  // Show success message if form was submitted successfully
  if (submitResult === 'success') {
    return (
      <Section
        id="contact"
        title={`${contactData.heading.title} ${contactData.heading.subtitle}`}
        description={contactData.heading.description}
        centered={true}
        className="py-16 sm:py-20 md:py-24"
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-8 bg-gray-50 border-2 border-black rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-2">Message Sent Successfully!</h3>
            <p className="text-gray-600 mb-4">{contactData.messages.success}</p>
            <div className="mt-4">
              <div className="relative w-full overflow-hidden rounded-lg border border-gray-200">
                <InlineWidget
                  url="https://calendly.com/raiyanhasan2006/30min"
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
      title={`${contactData.heading.title} ${contactData.heading.subtitle}`}
      description={contactData.heading.description}
      centered={true}
      className="py-16 sm:py-20 md:py-24"
    >
      {/* Form */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-7">
            {contactData.form.fields
              .filter((field) => field.gridColumn === 'half')
              .map((field) => (
                <div key={field.id}>{renderField(field)}</div>
              ))}
          </div>

          {/* Full width fields */}
          {contactData.form.fields
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
