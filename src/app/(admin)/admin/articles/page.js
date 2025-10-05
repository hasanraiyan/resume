import { getAllArticles } from '@/app/actions/articleActions';
import Link from 'next/link';

export default async function ArticlesPage() {
  const { success, articles } = await getAllArticles();

  if (!success) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error loading articles. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
        <Link
          href="/admin/articles/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          New Article
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No articles found.</div>
          <Link
            href="/admin/articles/new"
            className="text-blue-600 hover:text-blue-800"
          >
            Create your first article
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {articles.map((article) => (
              <li key={article._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {article.title}
                        </p>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            article.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {article.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 truncate">
                        {article.excerpt}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Created: {new Date(article.createdAt).toLocaleDateString()}
                        {article.publishedAt && (
                          <> • Published: {new Date(article.publishedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link
                        href={`/admin/articles/${article._id}/edit`}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
