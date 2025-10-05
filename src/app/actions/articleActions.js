'use server';

import dbConnect from '@/lib/dbConnect';
import Article from '@/models/Article';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { serializeForClient } from '@/lib/serialize';

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
      message: error.code === 11000 ? 'Slug already exists.' : 'Failed to create article.'
    };
  }

  redirect('/admin/articles');
}

export async function updateArticle(id, formData) {
  await dbConnect();

  try {
    const articleData = processFormData(formData);
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      articleData,
      { new: true, runValidators: true }
    );

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
      message: error.code === 11000 ? 'Slug already exists.' : 'Failed to update article.'
    };
  }

  // No redirect here to allow success message to show on edit page
}

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

export async function getAllArticles() {
  await dbConnect();

  try {
    const articles = await Article.find({}).sort({ createdAt: -1 }).lean();
    // Serialize articles to handle MongoDB ObjectIds for client components
    const serializedArticles = articles.map(article => serializeForClient(article));
    return { success: true, articles: serializedArticles };
  } catch (error) {
    console.error('Get Articles Error:', error);
    return { success: false, articles: [] };
  }
}

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

export async function getAllPublishedArticles() {
  await dbConnect();

  try {
    const articles = await Article.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .lean();
    // Serialize articles to handle MongoDB ObjectIds for client components
    const serializedArticles = articles.map(article => serializeForClient(article));
    return { success: true, articles: serializedArticles };
  } catch (error) {
    console.error('Get Published Articles Error:', error);
    return { success: false, articles: [] };
  }
}

export async function getLatestArticles(limit = 3) {
  await dbConnect();

  try {
    const articles = await Article.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
    // Serialize articles to handle MongoDB ObjectIds for client components
    const serializedArticles = articles.map(article => serializeForClient(article));
    return { success: true, articles: serializedArticles };
  } catch (error) {
    console.error('Get Latest Articles Error:', error);
    return { success: false, articles: [] };
  }
}
