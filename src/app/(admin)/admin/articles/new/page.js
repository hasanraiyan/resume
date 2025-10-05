import { ArticleForm } from '@/components/admin/ArticleForm';

export default function NewArticlePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Article</h1>
        <p className="text-gray-600">Create a new blog article</p>
      </div>

      <ArticleForm />
    </div>
  );
}
