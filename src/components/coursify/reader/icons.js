export function QuizIcon({ className }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="1" width="12" height="14" rx="1.5" />
      <circle cx="5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
      <line x1="7.5" y1="5.5" x2="11.5" y2="5.5" />
      <circle cx="5" cy="8.5" r="0.9" stroke="currentColor" fill="none" />
      <line x1="7.5" y1="8.5" x2="11.5" y2="8.5" />
      <circle cx="5" cy="11.5" r="0.9" stroke="currentColor" fill="none" />
      <line x1="7.5" y1="11.5" x2="11.5" y2="11.5" />
    </svg>
  );
}
