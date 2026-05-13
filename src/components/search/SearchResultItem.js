import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ChevronRight, FileText, Layout } from 'lucide-react';

// Utility function to highlight search terms
function highlightSearchTerm(text, searchQuery) {
  if (!searchQuery?.trim() || !text) return text;

  const words = searchQuery
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length === 0) return text;

  const pattern = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-300 px-0.5 rounded-sm font-semibold text-black">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function SearchResultItem({ result, onNavigate, searchQuery, isSelected = false }) {
  const getTypeIcon = (type) => {
    if (type === 'project') return <Layout className="w-3.5 h-3.5" />;
    if (type === 'course') return <BookOpen className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
  };

  const getTypeStyles = (type) => {
    if (type === 'project') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (type === 'course') return 'bg-purple-50 text-purple-700 border-purple-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  const getHref = (result) => {
    if (result.type === 'project') return `/projects/${result.slug}`;
    if (result.type === 'course') return `/coursify/${result.slug || result._id}`;
    return `/blog/${result.slug}`;
  };

  return (
    <Link
      href={getHref(result)}
      onClick={onNavigate}
      className={`group flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
        isSelected ? 'bg-[#f0f5f2] ring-1 ring-[#1f644e]/20' : 'hover:bg-gray-50'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-24 sm:w-32 aspect-video bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
        {result.thumbnail ? (
          <Image
            src={result.thumbnail}
            alt={result.title}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            {getTypeIcon(result.type)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getTypeStyles(result.type)}`}
          >
            {getTypeIcon(result.type)}
            {result.type}
          </span>
          {result.difficulty && (
            <span className="text-[10px] font-bold text-[#b0bfbb] uppercase tracking-wider">
              • {result.difficulty}
            </span>
          )}
        </div>

        <h3 className="font-bold text-[#1e3a34] text-sm sm:text-base leading-tight truncate group-hover:text-[#1f644e] transition-colors mb-1">
          {highlightSearchTerm(result.title, searchQuery)}
        </h3>

        <p className="text-xs text-[#7c8e88] line-clamp-1 sm:line-clamp-2 leading-relaxed">
          {highlightSearchTerm(result.excerpt || result.description, searchQuery)}
        </p>
      </div>

      {/* Arrow */}
      <div className="shrink-0 text-gray-300 group-hover:text-[#1f644e] transition-colors pr-1">
        <ChevronRight
          className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1' : ''}`}
        />
      </div>
    </Link>
  );
}
