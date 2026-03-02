'use server';

import dbConnect from '@/lib/dbConnect';
import Article from '@/models/Article';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { serializeForClient } from '@/lib/serialize';

/**
 * Processes form data from article creation/update forms into a structured object.
 *
 * @param {FormData} formData - The form data object containing article fields
 * @returns {Object} Processed article data object with title, slug, excerpt, coverImage, content, status, and tags
 */
function processFormData(formData) {
  return {
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt'),
    coverImage: formData.get('coverImage'),
    content: formData.get('content'),
    status: formData.get('status'),
    visibility: formData.get('visibility') || 'public',
    tags: JSON.parse(formData.get('tags') || '[]'),
  };
}

/**
 * Creates a new article in the database with the provided form data.
 * Handles database connection, article creation, cache revalidation, and redirects to articles admin page.
 *
 * @param {FormData} formData - Form data containing article information (title, slug, excerpt, coverImage, content, status, tags)
 * @returns {Object} Error object if creation fails, otherwise redirects to admin articles page
 */
export async function createArticle(formData) {
  await dbConnect();

  try {
    const articleData = processFormData(formData);
    const newArticle = new Article(articleData);
    await newArticle.save();

    revalidatePath('/blog');
    revalidatePath('/blog/[slug]');
    revalidatePath('/admin/articles');
    revalidatePath('/');
  } catch (error) {
    console.error('Create Article Error:', error);
    return {
      success: false,
      message: error.code === 11000 ? 'Slug already exists.' : 'Failed to create article.',
    };
  }

  redirect('/admin/articles');
}

/**
 * Updates an existing article in the database with the provided form data.
 * Handles database connection, article update, cache revalidation, and returns appropriate response.
 * Does not redirect to allow success message to show on edit page.
 *
 * @param {string} id - The MongoDB ObjectId of the article to update
 * @param {FormData} formData - Form data containing updated article information
 * @returns {Object} Success or error object with message
 */
export async function updateArticle(id, formData) {
  await dbConnect();

  try {
    const articleData = processFormData(formData);
    const updatedArticle = await Article.findByIdAndUpdate(id, articleData, {
      new: true,
      runValidators: true,
    });

    if (!updatedArticle) {
      return { success: false, message: 'Article not found.' };
    }

    revalidatePath('/blog');
    revalidatePath(`/blog/${updatedArticle.slug}`);
    revalidatePath('/admin/articles');
    revalidatePath('/');
  } catch (error) {
    console.error('Update Article Error:', error);
    return {
      success: false,
      message: error.code === 11000 ? 'Slug already exists.' : 'Failed to update article.',
    };
  }

  // No redirect here to allow success message to show on edit page
}

/**
 * Deletes an article from the database by its ID.
 * Handles database connection, article deletion, cache revalidation, and redirects to articles admin page.
 *
 * @param {string} id - The MongoDB ObjectId of the article to delete
 * @returns {Object} Error object if deletion fails, otherwise redirects to admin articles page
 */
export async function deleteArticle(id) {
  await dbConnect();
  try {
    const deletedArticle = await Article.findByIdAndDelete(id);
    if (!deletedArticle) {
      return { success: false, message: 'Article not found.' };
    }
    revalidatePath('/blog');
    revalidatePath('/admin/articles');
    revalidatePath('/');
  } catch (error) {
    console.error('Delete Article Error:', error);
    return { success: false, message: 'Failed to delete article.' };
  }
  redirect('/admin/articles');
}

/**
 * Retrieves all articles from the database, sorted by creation date in descending order.
 * Used primarily in admin interfaces for listing and managing all articles.
 *
 * @param {Object} options - Pagination and search options
 * @param {number} options.page - The page number to retrieve (default: 1)
 * @param {number} options.limit - The number of articles per page (default: 10)
 * @param {string} options.search - Optional search string to filter articles by title, excerpt, or tags
 * @returns {Object} Object containing success status, array of serialized articles, and pagination metadata
 */
export async function getAllArticles({ page = 1, limit = 10, search = '' } = {}) {
  await dbConnect();

  try {
    const query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { tags: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [articles, totalArticles] = await Promise.all([
      Article.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(query),
    ]);

    // Serialize articles to handle MongoDB ObjectIds for client components
    const serializedArticles = articles.map((article) => serializeForClient(article));

    return {
      success: true,
      articles: serializedArticles,
      totalArticles,
      totalPages: Math.ceil(totalArticles / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Get Articles Error:', error);
    return {
      success: false,
      articles: [],
      totalArticles: 0,
      totalPages: 0,
      currentPage: 1
    };
  }
}

/**
 * Retrieves a single article from the database by its slug.
 * Checks visibility: authenticated users can access private and unlisted articles, non-authenticated can access public and unlisted.
 * Used for displaying individual blog posts and article pages.
 *
 * @param {string} slug - The unique slug identifier for the article
 * @param {boolean} isAuthenticated - Whether the user is authenticated (default: false)
 * @returns {Object} Object containing success status and serialized article data, or error object with null article
 */
export async function getArticleBySlug(slug, isAuthenticated = false) {
  await dbConnect();

  try {
    const visibilityFilter = isAuthenticated
      ? { $in: ['public', 'private', 'unlisted'] }
      : { $in: ['public', 'unlisted'] };
    const article = await Article.findOneAndUpdate(
      {
        slug,
        status: 'published',
        visibility: visibilityFilter,
      },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!article) {
      return { success: false, article: null };
    }
    // Serialize article to handle MongoDB ObjectIds for client components
    const serializedArticle = serializeForClient(article);
    return { success: true, article: serializedArticle };
  } catch (error) {
    console.error('Get Article Error:', error);
    return { success: false, article: null };
  }
}

/**
 * Retrieves all published articles from the database, sorted by publication date in descending order.
 * Filters by visibility: authenticated users see public, private, and unlisted articles, non-authenticated see only public.
 * Used for displaying published blog posts on the public blog page.
 *
 * @param {boolean} isAuthenticated - Whether the user is authenticated (default: false)
 * @param {Object} options - Pagination and filter options
 * @param {number} options.page - The page number to retrieve (default: 1)
 * @param {number} options.limit - The number of articles per page (default: 10)
 * @param {string} options.search - Optional search string to filter articles
 * @param {string} options.tag - Optional tag string to filter articles by tag
 * @returns {Object} Object containing success status, array of serialized published articles, and pagination metadata
 */
export async function getAllPublishedArticles(isAuthenticated = false, { page = 1, limit = 10, search = '', tag = '' } = {}) {
  await dbConnect();

  try {
    const visibilityFilter = isAuthenticated
      ? { $in: ['public', 'private', 'unlisted'] }
      : 'public';

    const query = {
      status: 'published',
      visibility: visibilityFilter,
    };

    // Get all unique tags for the available published articles and sort by frequency
    const uniqueTagsAgg = await Article.aggregate([
      { $match: { status: 'published', visibility: visibilityFilter } },
      { $unwind: "$tags" },
      { $group: { _id: { $toLower: "$tags" }, count: { $sum: 1 }, original: { $first: "$tags" } } },
      { $sort: { count: -1 } }
    ]);
    const uniqueTags = uniqueTagsAgg.map(t => t.original);

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { content: searchRegex },
        { tags: searchRegex },
      ];
    }

    if (tag && tag !== 'all') {
      // Create regex for exact match ignoring case
      const tagRegex = new RegExp(`^${tag}$`, 'i');
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { tags: tagRegex }
        ];
        delete query.$or;
      } else {
        query.tags = tagRegex;
      }
    }

    const skip = (page - 1) * limit;

    const [articles, totalArticles] = await Promise.all([
      Article.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(query),
    ]);

    // Serialize articles to handle MongoDB ObjectIds for client components
    const serializedArticles = articles.map((article) => serializeForClient(article));

    return {
      success: true,
      articles: serializedArticles,
      totalArticles,
      totalPages: Math.ceil(totalArticles / limit),
      currentPage: page,
      allTags: uniqueTags
    };
  } catch (error) {
    console.error('Get Published Articles Error:', error);
    return {
      success: false,
      articles: [],
      totalArticles: 0,
      totalPages: 0,
      currentPage: 1,
      allTags: []
    };
  }
}

/**
 * Retrieves the latest published articles from the database, limited by the specified number.
 * Filters by visibility: authenticated users see public, private, and unlisted articles, non-authenticated see only public.
 * Used for displaying recent articles on homepage, sidebars, or other components that need recent content.
 *
 * @param {number} limit - Maximum number of articles to retrieve (default: 3)
 * @param {boolean} isAuthenticated - Whether the user is authenticated (default: false)
 * @returns {Object} Object containing success status and array of serialized latest articles, or error object
 */
export async function getLatestArticles(limit = 3, isAuthenticated = false) {
  await dbConnect();

  try {
    const visibilityFilter = isAuthenticated
      ? { $in: ['public', 'private', 'unlisted'] }
      : 'public';
    const articles = await Article.find({
      status: 'published',
      visibility: visibilityFilter,
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
    // Serialize articles to handle MongoDB ObjectIds for client components
    const serializedArticles = articles.map((article) => serializeForClient(article));
    return { success: true, articles: serializedArticles };
  } catch (error) {
    console.error('Get Latest Articles Error:', error);
    return { success: false, articles: [] };
  }
}
