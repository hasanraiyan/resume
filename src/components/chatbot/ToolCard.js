export default function ToolCard({ label, Icon, pending }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-300 ${
        pending
          ? 'border-neutral-300/80 bg-neutral-50 text-neutral-600'
          : 'border-green-200/80 bg-green-50/80 text-green-700'
      }`}
    >
      <div className="relative shrink-0">
        {Icon && (
          <Icon className={`w-3.5 h-3.5 ${pending ? 'text-neutral-500' : 'text-green-600'}`} />
        )}
        {pending && (
          <span className="absolute inset-0 rounded-full bg-neutral-400 animate-ping opacity-30" />
        )}
      </div>
      <span>{label}</span>
      {!pending && <span className="text-green-500 text-xs">✓</span>}
    </div>
  );
}
