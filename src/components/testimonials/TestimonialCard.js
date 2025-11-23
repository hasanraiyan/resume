/**
 * @fileoverview Individual testimonial card component
 * @description This component displays a single testimonial in card format with
 * client information, rating, and testimonial content. Used in the testimonials grid.
 */

'use client';

export default function TestimonialCard({ testimonial, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
        isActive
          ? 'border-black ring-2 ring-black ring-offset-2'
          : 'border-transparent hover:border-neutral-200'
      }`}
    >
      {/* Rating */}
      <div className="flex items-center mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-lg">
            ★
          </span>
        ))}
        {[...Array(5 - testimonial.rating)].map((_, i) => (
          <span key={i} className="text-neutral-300 text-lg">
            ★
          </span>
        ))}
      </div>

      {/* Testimonial Content */}
      <blockquote className="text-neutral-700 mb-6 leading-relaxed">
        "{testimonial.content.substring(0, 150)}
        {testimonial.content.length > 150 ? '...' : ''}"
      </blockquote>

      {/* Client Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <div className="font-semibold text-black">{testimonial.name}</div>
            <div className="text-sm text-neutral-600">{testimonial.position}</div>
            <div className="text-sm text-neutral-500">{testimonial.company}</div>
          </div>
        </div>

        {isActive && (
          <div className="text-black">
            <span className="text-2xl">›</span>
          </div>
        )}
      </div>

      {/* Project Tag */}
      <div className="mt-4 pt-4 border-t border-neutral-100">
        <span className="text-xs text-neutral-500 font-medium">Project: {testimonial.project}</span>
      </div>
    </div>
  );
}
