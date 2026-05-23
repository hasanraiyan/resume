'use client';

import * as Icons from 'lucide-react';

function ChatIcon({ className, strokeWidth = 1.5 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M11 4H7.2C5.0998 4 4.0497 4 3.24757 4.4087C2.54203 4.76807 1.96807 5.34203 1.6087 6.04757C1.2 6.8497 1.2 7.0998 1.2 9.2V16.8C1.2 18.9002 1.2 19.9503 1.6087 20.7524C1.96807 21.458 2.54203 22.0319 3.24757 22.3913C4.0497 22.8 5.0998 22.8 7.2 22.8H14.8C16.9002 22.8 17.9503 22.8 18.7524 22.3913C19.458 22.0319 20.0319 21.458 20.3913 20.7524C20.8 19.9503 20.8 18.9002 20.8 16.8V13"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M11.8327 15.1741L8.14064 15.8454C7.45802 15.9695 6.8778 15.3893 7.00193 14.7067L7.6732 11.0146C7.72462 10.7318 7.86315 10.4728 8.06917 10.2668L17.7574 2.57859C18.7337 1.60228 20.3166 1.60228 21.2929 2.57859C22.2692 3.5549 22.2692 5.13781 21.2929 6.11412L11.8327 15.1741Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RuPaySVG({ className }) {
  // Simple RuPay logo mark (solid rounded shape + stylized R) sized to fit
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#0052CC" />
      <path
        d="M7 16V8h3a3 3 0 010 6H7"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 16h3a3 3 0 000-6h-3"
        stroke="#ffb400"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IPPBSVG({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <rect width="24" height="24" rx="3" fill="#3a0f1a" />
      <circle cx="9.5" cy="10.5" r="3.2" fill="#d92b2b" />
      <path
        d="M4 8c2 0 4 2 7 2"
        stroke="#ffd036"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 10c2 0 4 2 7 2"
        stroke="#ffd036"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12c2 0 4 2 7 2"
        stroke="#ffd036"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PNBSVG({ className }) {
  return <img src="/images/pnb.png" className={className} alt="PNB" />;
}

function PurseSVG({ className }) {
  // Use the purse.svg from public/images
  return <img src="/images/purse.svg" className={className} alt="Purse" />;
}

export default function IconRenderer({ name, className = 'w-4 h-4', fallback = 'circle' }) {
  if (!name) name = fallback;

  // Custom local icon: rupay
  if (name === 'rupay' || name === 'ru-pay' || name === 'ru_pay') {
    return <RuPaySVG className={className} />;
  }
  // Custom local icon: ippb
  if (name === 'ippb' || name === 'ip-pb' || name === 'ip_pb') {
    return <IPPBSVG className={className} />;
  }
  // Custom local icon: pnb (Punjab National Bank style mark)
  if (name === 'pnb' || name === 'pn-b' || name === 'pn_b') {
    return <PNBSVG className={className} />;
  }
  // Custom local icon: purse
  if (name === 'purse' || name === 'wallet') {
    return <PurseSVG className={className} />;
  }

  const pascalName =
    name
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') || fallback;

  const Icon =
    Icons[pascalName] ||
    Icons[fallback.charAt(0).toUpperCase() + fallback.slice(1)] ||
    Icons.Circle;
  return <Icon className={className} />;
}

export { PurseSVG, ChatIcon };
