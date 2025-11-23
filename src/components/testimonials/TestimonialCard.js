/**
 * @fileoverview Individual testimonial card component
 * @description Displays a single testimonial with quote icon, ratings, client info, and links
 */

'use client';

export default function TestimonialCard({ testimonial }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 h-full flex flex-col relative">
      {/* Quote Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute top-6 right-6 text-blue-100 w-10 h-10"
        aria-hidden="true"
      >
        <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
        <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
      </svg>

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

      {/* Content */}
      <blockquote className="text-neutral-700 mb-6 leading-relaxed flex-grow">
        "{testimonial.content}"
      </blockquote>

      {/* Client Info */}
      <div className="flex items-center space-x-4 pt-4 border-t border-neutral-100">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-12 object-contain flex-shrink-0 bg-white p-1"
        />
        <div className="flex-grow">
          <div className="font-semibold text-black">{testimonial.name}</div>
          <div className="text-sm text-neutral-600">{testimonial.position}</div>
          <div className="text-sm text-neutral-500">
            {testimonial.companyLink ? (
              <a
                href={testimonial.companyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-700 transition-colors"
              >
                {testimonial.company}
              </a>
            ) : (
              testimonial.company
            )}
          </div>
        </div>
      </div>

      {/* Project Tag */}
      <div className="mt-4">
        {testimonial.projectLink ? (
          <a
            href={testimonial.projectLink}
            className="text-xs text-neutral-500 font-medium bg-neutral-50 px-3 py-1 rounded-full hover:bg-neutral-100 transition-colors inline-block"
          >
            {testimonial.project}
          </a>
        ) : (
          <span className="text-xs text-neutral-500 font-medium bg-neutral-50 px-3 py-1 rounded-full">
            {testimonial.project}
          </span>
        )}
      </div>
    </div>
  );
}
