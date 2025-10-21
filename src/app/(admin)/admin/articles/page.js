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
          articles.map((article) => (
            <Card key={article._id} className="p-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-newspaper text-neutral-600 text-lg"></i>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-bold">{article.title}</p>
                    <Badge
                      variant={article.status === 'published' ? 'success' : 'secondary'}
                      className={
                        article.status === 'published'
                          ? 'bg-green-100 p-2 text-green-800'
                          : 'p-2 bg-gray-100 text-gray-800'
                      }
                    >
                      {article.status}
                    </Badge>
                    <Badge
                      variant={
                        article.visibility === 'private'
                          ? 'warning'
                          : article.visibility === 'unlisted'
                            ? 'secondary'
                            : 'info'
                      }
                      className={
                        article.visibility === 'private'
                          ? 'bg-orange-100 p-2 text-orange-800'
                          : article.visibility === 'unlisted'
                            ? 'bg-gray-100 p-2 text-gray-800'
                            : 'bg-blue-100 p-2 text-blue-800'
                      }
                    >
                      {article.visibility}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {article.excerpt.length > 80
                      ? `${article.excerpt.substring(0, 80)}...`
                      : article.excerpt}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Created: {new Date(article.createdAt).toLocaleDateString()}
                    {article.publishedAt && (
                      <> • Published: {new Date(article.publishedAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button href={`/admin/articles/${article._id}/edit`} variant="ghost" size="small">
                  Edit
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </AdminPageWrapper>
  );
}
