import Link from 'next/link';

export default function SearchResultItem({ result, onNavigate }) {
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
      className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 hover:text-blue-600">
              {result.title}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(result.type)}`}>
              {result.type === 'project' ? 'Project' : 'Article'}
            </span>
          </div>

          {result.category && (
            <p className="text-sm text-gray-600 mb-2">
              Category: {result.category}
            </p>
          )}

          <p className="text-gray-700 text-sm line-clamp-2">
            {result.excerpt}
          </p>

          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {typeof tag === 'string' ? tag : tag.name}
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
