import { getAllArticles } from '@/app/actions/articleActions';
import { ArticleForm } from '@/components/admin/ArticleForm';
import { notFound } from 'next/navigation';

export default async function EditArticlePage({ params }) {
  // Await params in Next.js 15
  const { id } = await params;

  console.log('EditArticlePage - params:', params);
  console.log('EditArticlePage - params.id:', id);

  const { success, articles } = await getAllArticles();
  console.log('EditArticlePage - success:', success);
  console.log('EditArticlePage - articles count:', articles?.length || 0);

  if (articles) {
    articles.forEach((article, index) => {
      console.log(`Article ${index}:`, {
        id: article._id,
        title: article.title,
        slug: article.slug,
        matches: article._id === id,
      });
    });
  }

  const article = articles?.find((a) => a._id === id || String(a._id) === String(id));

  console.log('EditArticlePage - found article:', article?.title || 'NOT FOUND');

  if (!success || !article) {
    console.log('EditArticlePage - Article not found, calling notFound()');
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
        <p className="text-gray-600">Update your blog article</p>
      </div>

      <ArticleForm article={article} />
    </div>
  );
}
