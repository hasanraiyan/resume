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
 * @returns {Object} Object containing success status and array of serialized articles, or error object
 */
export async function getAllArticles() {
  await dbConnect();

  try {
    const articles = await Article.find({}).sort({ createdAt: -1 }).lean();
    // Serialize articles to handle MongoDB ObjectIds for client components
    const serializedArticles = articles.map((article) => serializeForClient(article));
    return { success: true, articles: serializedArticles };
  } catch (error) {
    console.error('Get Articles Error:', error);
    return { success: false, articles: [] };
  }
}

/**
 * Retrieves a single article from the database by its slug.
 * Used for displaying individual blog posts and article pages.
 *
 * @param {string} slug - The unique slug identifier for the article
 * @returns {Object} Object containing success status and serialized article data, or error object with null article
 */
export async function getArticleBySlug(slug) {
  await dbConnect();

  try {
    const article = await Article.findOne({ slug }).lean();
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
 * Used for displaying published blog posts on the public blog page.
 *
 * @returns {Object} Object containing success status and array of serialized published articles, or error object
 */
export async function getAllPublishedArticles() {
  await dbConnect();

  try {
    const articles = await Article.find({ status: 'published' }).sort({ publishedAt: -1 }).lean();
    // Serialize articles to handle MongoDB ObjectIds for client components
    const serializedArticles = articles.map((article) => serializeForClient(article));
    return { success: true, articles: serializedArticles };
  } catch (error) {
    console.error('Get Published Articles Error:', error);
    return { success: false, articles: [] };
  }
}

/**
 * Retrieves the latest published articles from the database, limited by the specified number.
 * Used for displaying recent articles on homepage, sidebars, or other components that need recent content.
 *
 * @param {number} limit - Maximum number of articles to retrieve (default: 3)
 * @returns {Object} Object containing success status and array of serialized latest articles, or error object
 */
export async function getLatestArticles(limit = 3) {
  await dbConnect();

  try {
    const articles = await Article.find({ status: 'published' })
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
