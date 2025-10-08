import Link from 'next/link';

// Utility function to highlight search terms
function highlightSearchTerm(text, searchQuery) {
  if (!searchQuery || !text) return text;

  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function SearchResultItem({ result, onNavigate, searchQuery, isSelected = false }) {
  const getTypeColor = (type) => {
    return type === 'project' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getHref = (result) => {
    return result.type === 'project' ? `/projects/${result.slug}` : `/blog/${result.slug}`;
  };

  return (
    <Link
      href={getHref(result)}
      onClick={onNavigate}
      className={`block p-4 border rounded-lg transition-colors ${
        isSelected
          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
          : 'hover:bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 hover:text-blue-600">
              {highlightSearchTerm(result.title, searchQuery)}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(result.type)}`}
            >
              {result.type === 'project' ? 'Project' : 'Article'}
            </span>
          </div>

          {result.category && (
            <p className="text-sm text-gray-600 mb-2">
              Category: {highlightSearchTerm(result.category, searchQuery)}
            </p>
          )}

          <p className="text-gray-700 text-sm line-clamp-2">
            {highlightSearchTerm(result.excerpt, searchQuery)}
          </p>

          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  {highlightSearchTerm(typeof tag === 'string' ? tag : tag.name, searchQuery)}
                </span>
              ))}
              {result.tags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  +{result.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="ml-4 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
