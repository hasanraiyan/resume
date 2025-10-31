// ========================================
// 📦 DYNAMIC DATA FETCHING
// ========================================
import { getActiveServices } from '@/app/actions/serviceActions';

// Default fallback data in case no services are available
const fallbackData = {
  services: [
    {
      id: 1,
      text: 'WEB DESIGN',
      link: '#services/web-design',
      icon: 'fas fa-palette',
    },
    {
      id: 2,
      text: 'DEVELOPMENT',
      link: '#services/development',
      icon: 'fas fa-code',
    },
    {
      id: 3,
      text: 'BRANDING',
      link: '#services/branding',
      icon: 'fas fa-paint-brush',
    },
    {
      id: 4,
      text: 'UI/UX',
      link: '#services/ui-ux',
      icon: 'fas fa-desktop',
    },
  ],

  separator: '•',
  repeatCount: 2,

  styling: {
    textSize: 'text-xl sm:text-2xl md:text-3xl',
    fontWeight: 'font-bold',
    spacing: 'mx-4 sm:mx-6 md:mx-7',
  },
};

// ========================================
// 🎨 ENHANCED COMPONENT WITH CLICKABLE LINKS
// ========================================

/**
 * Dynamic scrolling marquee component displaying services with clickable links.
 *
 * This component fetches active services from the database and creates a
 * horizontally scrolling marquee. If no services are found, it falls back
 * to default services. The marquee repeats the service list multiple times
 * for continuous scrolling and includes separators between items.
 *
 * @returns {JSX.Element} Scrolling marquee section with service links
 */
export default async function Marquee() {
  // Fetch active services from database
  const services = await getActiveServices();

  // Format services for marquee display
  const marqueeServices =
    services.length > 0
      ? services.map((service) => ({
          id: service._id,
          text: service.title.toUpperCase(),
          link: `#services/${service.title.toLowerCase().replace(/\s+/g, '-')}`,
          icon: service.icon,
        }))
      : fallbackData.services;

  const marqueeData = {
    services: marqueeServices,
    separator: '•',
    repeatCount: 2,
    styling: fallbackData.styling,
  };
  return (
    <section className="py-6 sm:py-8 md:py-10 bg-black text-white overflow-hidden">
      <div className="marquee">
        <div className="marquee-content">
          {Array.from({ length: marqueeData.repeatCount }).map((_, repeatIndex) => (
            <span key={`repeat-${repeatIndex}`}>
              {marqueeData.services.map((service) => (
                <span key={`${service.id}-${repeatIndex}`}>
                  {service.link ? (
                    <a
                      href={service.link}
                      className={`${marqueeData.styling.textSize} ${marqueeData.styling.fontWeight} ${marqueeData.styling.spacing} hover:text-gray-300 transition`}
                    >
                      {service.text}
                    </a>
                  ) : (
                    <span
                      className={`${marqueeData.styling.textSize} ${marqueeData.styling.fontWeight} ${marqueeData.styling.spacing}`}
                    >
                      {service.text}
                    </span>
                  )}
                  <span
                    className={`${marqueeData.styling.textSize} ${marqueeData.styling.spacing}`}
                  >
                    {marqueeData.separator}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
