'use client';

const FALLBACK_SERVICES = [
  {
    id: 1,
    text: 'WEB DESIGN',
    link: '#services/web-design',
  },
  {
    id: 2,
    text: 'DEVELOPMENT',
    link: '#services/development',
  },
  {
    id: 3,
    text: 'BRANDING',
    link: '#services/branding',
  },
  {
    id: 4,
    text: 'UI/UX',
    link: '#services/ui-ux',
  },
];

const STYLING = {
  textSize: 'text-xl sm:text-2xl md:text-3xl',
  fontWeight: 'font-bold',
  spacing: 'mx-4 sm:mx-6 md:mx-7',
};

const SEPARATOR = '•';
const REPEAT_COUNT = 2;

/**
 * Client-safe scrolling marquee that renders already-fetched services.
 * Does not call server actions — data must be passed from a Server Component.
 */
export default function ClientMarquee({ services = [] }) {
  const marqueeServices =
    services.length > 0
      ? services.map((service) => ({
          id: service._id || service.id || service.title,
          text: service.title?.toUpperCase() || 'SERVICE',
          link: `#services/${service.title?.toLowerCase().replace(/\s+/g, '-') || 'service'}`,
        }))
      : FALLBACK_SERVICES;

  return (
    <section className="py-6 sm:py-8 md:py-10 bg-black text-white overflow-hidden">
      <div className="marquee">
        <div className="marquee-content">
          {Array.from({ length: REPEAT_COUNT }).map((_, repeatIndex) => (
            <span key={`repeat-${repeatIndex}`}>
              {marqueeServices.map((service) => (
                <span key={`${service.id}-${repeatIndex}`}>
                  {service.link ? (
                    <a
                      href={service.link}
                      className={`${STYLING.textSize} ${STYLING.fontWeight} ${STYLING.spacing} hover:text-gray-300 transition`}
                    >
                      {service.text}
                    </a>
                  ) : (
                    <span
                      className={`${STYLING.textSize} ${STYLING.fontWeight} ${STYLING.spacing}`}
                    >
                      {service.text}
                    </span>
                  )}
                  <span className={`${STYLING.textSize} ${STYLING.spacing}`}>{SEPARATOR}</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
