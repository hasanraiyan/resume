'use client';

import { getAllArticles } from '@/app/actions/articleActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge } from '@/components/ui';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 9; // Display 9 articles per page for a 3-column grid

  const fetchArticles = async (page, search) => {
    setLoading(true);
    const {
      success,
      articles: fetchedArticles,
      totalPages: fetchedTotalPages,
      totalArticles: fetchedTotalArticles,
    } = await getAllArticles({ page, limit, search });

    if (success) {
      setArticles(fetchedArticles);
      setTotalPages(fetchedTotalPages);
      setTotalArticles(fetchedTotalArticles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <AdminPageWrapper
        title="Articles"
        description="Create and manage your blog articles and news posts."
        searchable={true}
        searchPlaceholder="Search articles..."
        onSearch={handleSearch}
        actionButton={
          <Button href="/admin/articles/new" variant="primary">
            <i className="fas fa-plus mr-2"></i> New Article
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-2 border-transparent">
              <div className="aspect-video bg-neutral-200" />
              <div className="p-6 pb-4 space-y-4">
                <div className="space-y-2">
                  <div className="h-5 bg-neutral-200 rounded w-4/5" />
                  <div className="h-5 bg-neutral-200 rounded w-2/3" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                  <div className="h-3 bg-neutral-100 rounded w-3/4" />
                </div>
                <div className="flex justify-between pt-2">
                  <div className="h-3 bg-neutral-100 rounded w-20" />
                  <div className="h-3 bg-neutral-100 rounded w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </AdminPageWrapper>
    );
  }

  if (articles.length === 0 && !searchQuery) {
    return (
      <AdminPageWrapper
        title="Articles"
        description="Create and manage your blog articles and news posts."
        searchable={true}
        searchPlaceholder="Search articles..."
        onSearch={handleSearch}
        actionButton={
          <Button href="/admin/articles/new" variant="primary">
            <i className="fas fa-plus mr-2"></i> New Article
          </Button>
        }
      >
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
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper
      title="Articles"
      description="Create and manage your blog articles and news posts."
      searchable={true}
      searchPlaceholder="Search articles by title, excerpt, or tags..."
      onSearch={handleSearch}
      actionButton={
        <Button href="/admin/articles/new" variant="primary">
          <i className="fas fa-plus mr-2"></i> New Article
        </Button>
      }
    >
      {articles.length === 0 && searchQuery ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-search text-neutral-400 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">No articles found</h3>
          <p className="text-neutral-600 mb-8">
            Try adjusting your search terms or clear the search to see all articles.
          </p>
          <Button onClick={() => handleSearch('')} variant="secondary">
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card
                key={article._id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group"
              >
                {/* Article Image */}
                <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                  {article.coverImage ? (
                    <Image
                      src={article.coverImage.trimStart()}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized={article.coverImage?.includes('utfs.io')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-image text-neutral-400 text-2xl"></i>
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
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
                <div className="p-6 pb-4">
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
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        href={`/blog/${article.slug}`}
                        variant="ghost"
                        size="small"
                        external={true}
                      >
                        <i className="fas fa-external-link-alt"></i>
                      </Button>
                      <Button
                        href={`/admin/articles/${article._id}/edit`}
                        variant="ghost"
                        size="small"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-100 pt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`text-sm font-medium transition-colors px-4 py-2 rounded-md ${
                  currentPage <= 1
                    ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                    : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
                }`}
              >
                &larr; Previous
              </button>

              <div className="text-sm text-neutral-600">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`text-sm font-medium transition-colors px-4 py-2 rounded-md ${
                  currentPage >= totalPages
                    ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                    : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
                }`}
              >
                Next &rarr;
              </button>
            </div>
          )}

          <div className="text-right text-xs text-neutral-500">Total Articles: {totalArticles}</div>
        </div>
      )}
    </AdminPageWrapper>
  );
}
