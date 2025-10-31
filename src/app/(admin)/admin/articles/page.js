import { getAllArticles } from '@/app/actions/articleActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge } from '@/components/ui';
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
    <AdminPageWrapper
      title="Articles"
      description="Create and manage your blog articles and news posts."
      actionButton={
        <Button href="/admin/articles/new" variant="primary">
          <i className="fas fa-plus mr-2"></i> New Article
        </Button>
      }
    >
      <div className="space-y-4">
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-newspaper text-neutral-400 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">No articles yet</h3>
            <p className="text-neutral-600 mb-8">
              Get started by creating your first article or blog post.
            </p>
            <Button href="/admin/articles/new" variant="primary">
              <i className="fas fa-plus mr-2"></i>
              Create First Article
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card
                key={article._id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group"
              >
                {/* Article Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <i className="fas fa-newspaper text-lg"></i>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="tag"
                        className={
                          article.status === 'published'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }
                      >
                        <i
                          className={`fas ${article.status === 'published' ? 'fa-check-circle' : 'fa-clock'} mr-1`}
                        ></i>
                        {article.status}
                      </Badge>
                      <Badge
                        variant="tag"
                        className={
                          article.visibility === 'private'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : article.visibility === 'unlisted'
                              ? 'bg-gray-100 text-gray-800 border border-gray-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }
                      >
                        <i
                          className={`fas ${article.visibility === 'private' ? 'fa-lock' : article.visibility === 'unlisted' ? 'fa-eye-slash' : 'fa-globe'} mr-1`}
                        ></i>
                        {article.visibility}
                      </Badge>
                    </div>
                  </div>

                  {/* Article Content */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-black mb-2 group-hover:text-neutral-700 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-neutral-600 text-sm line-clamp-3">{article.excerpt}</p>
                  </div>

                  {/* Article Meta */}
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <i className="fas fa-calendar-alt mr-1"></i>
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                      {article.publishedAt && (
                        <span className="flex items-center">
                          <i className="fas fa-eye mr-1"></i>
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      href={`/admin/articles/${article._id}/edit`}
                      variant="ghost"
                      size="small"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
