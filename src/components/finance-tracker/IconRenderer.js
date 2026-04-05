'use client';

import * as Icons from 'lucide-react';

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
  // Prefer using the real PNB logo placed at /public/images/pnb.png.
  // If that file isn't present this will simply 404 and fall back to the existing
  // simple SVG in other contexts. Using an <img> keeps sizing consistent with
  // how IconRenderer is used elsewhere (tailwind className sizing).
  return <img src="/images/pnb.png" className={className} alt="PNB" />;
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
