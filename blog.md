# Blog and Articles System Documentation

This document explains how the blog and articles functionality works in this Next.js application, including the user experience, admin workflows, technical implementation, and key components.

## Overview

The blog system is a complete content management solution built with Next.js, MongoDB, and Mongoose. It supports a full article lifecycle from creation to publication, with features like draft/published states, tagging, search, social sharing, and engagement metrics.

## Database Model

### Article Schema

The core of the system is the `Article` model defined in `src/models/Article.js`:

```javascript
const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true },
    coverImage: { type: String },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },
    tags: [{ type: String }],
    likes: { type: Number, default: 0 },
    claps: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);
```

**Key Features:**

- **Status Workflow**: Articles can be in `draft` or `published` state
- **Visibility Control**: Articles can be `public` (visible to all) or `private` (visible only to authenticated users)
- **Automatic Publishing**: `publishedAt` is automatically set when status changes to `published`
- **Full-Text Search**: Text index on title, excerpt, content, and tags
- **Engagement Tracking**: Likes and claps counters
- **URL-Friendly Slugs**: Unique slugs for SEO-friendly URLs

## Server Actions

Article operations are handled by server actions in `src/app/actions/articleActions.js`:

### CRUD Operations

- `createArticle(formData)` - Creates new articles
- `updateArticle(id, formData)` - Updates existing articles
- `deleteArticle(id)` - Deletes articles
- `getAllArticles()` - Retrieves all articles (admin use)
- `getAllPublishedArticles()` - Gets only published articles
- `getArticleBySlug(slug)` - Fetches single article by slug
- `getLatestArticles(limit)` - Gets recent published articles

**Features:**

- Database connection management
- Cache revalidation after changes
- Serialization for client components
- Error handling with user-friendly messages

## User Flow

### Public Blog Experience

1. **Blog Listing Page** (`/blog`)
   - Displays all published articles in reverse chronological order
   - Shows article cards with title, excerpt, publish date, and tags
   - Includes search and tag filtering functionality
   - Responsive grid layout with smooth animations

2. **Individual Article Page** (`/blog/[slug]`)
   - Full article content with markdown rendering
   - Cover image display (if available)
   - Social sharing buttons
   - Like and clap engagement buttons
   - Newsletter subscription CTA
   - SEO-optimized metadata
   - Static generation for performance

### Article Display Features

- **Rich Content**: Markdown rendering with custom styling
- **Social Integration**: Share buttons for Twitter, LinkedIn, etc.
- **Engagement**: Like and clap counters with interactive buttons
- **Newsletter Integration**: Subscription forms at article end
- **Responsive Design**: Optimized for all device sizes
- **Visibility Control**: Public articles visible to all, private articles require authentication

## Admin Flow

### Admin Interface

1. **Articles Dashboard** (`/admin/articles`)
   - Lists all articles (both draft and published)
   - Shows status badges, creation/publication dates
   - Quick edit access for each article
   - Empty state with call-to-action for first article

2. **Create New Article** (`/admin/articles/new`)
   - Rich form with title, slug, excerpt, content fields
   - Cover image upload via media library
   - Tag management
   - **Visibility control**: Set articles as public (visible to all) or private (authenticated users only)
   - Save as draft or publish immediately
   - Auto-slug generation from title

3. **Edit Article** (`/admin/articles/[id]/edit`)
   - Pre-populated form with existing data
   - Same features as create form
   - Update and delete capabilities

### Article Form Features

- **Rich Text Editor**: WYSIWYG content editing
- **Media Library Integration**: Image selection from uploaded assets
- **Tag System**: Comma-separated tag input
- **Status Management**: Draft/Published workflow
- **Visibility Control**: Public/Private article access settings
- **Auto-save Drafts**: Save progress without publishing
- **Validation**: Required field checking
- **Success Notifications**: Toast messages for user feedback

## Technical Implementation

### Frontend Components

#### BlogPageClient (`src/components/blog/BlogPageClient.js`)

- Client-side filtering by tags and search
- GSAP animations for scroll-triggered effects
- Loading states and empty states
- Real-time search across title, excerpt, content, and tags

#### BlogCard (`src/components/blog/BlogCard.js`)

- Article preview cards
- Date formatting and tag display
- Hover effects and responsive layout
- Image handling with fallbacks

#### ArticleForm (`src/components/admin/ArticleForm.js`)

- Form state management with React hooks
- Server action integration
- Media library modal for image selection
- Rich text editor integration

### Static Generation

The system uses Next.js static generation for optimal performance:

```javascript
export async function generateStaticParams() {
  const { success, articles } = await getAllPublishedArticles();
  if (!success) return [];
  return articles.map((article) => ({ slug: article.slug }));
}
```

- Pre-generates all published article pages
- Automatic revalidation on content changes
- SEO metadata generation per article

### Search and Filtering

- **Tag Filtering**: Filter articles by specific tags
- **Text Search**: Full-text search across multiple fields
- **Client-side Performance**: Debounced search with loading states
- **MongoDB Text Indexes**: Efficient database-level search

## Content Workflow

### Article Lifecycle

1. **Draft Creation**: Admin creates article in draft state
2. **Content Editing**: Rich text editing with media integration
3. **Review**: Save drafts multiple times
4. **Publishing**: Change status to published (sets publishedAt automatically)
5. **Public Access**: Article appears on blog listing and individual page
6. **Engagement**: Users can like, clap, and share
7. **Updates**: Admin can edit published articles
8. **Archiving**: Articles can be deleted if needed

### Publishing Automation

- When `status` changes to `'published'`, `publishedAt` is automatically set to current date
- Cache is invalidated to reflect changes immediately
- Static pages are regenerated for new content

## Integration Points

### Related Systems

- **Newsletter**: Subscription forms integrated into article pages
- **Media Library**: Image management for cover images
- **Search API**: Full-text search integration
- **Analytics**: Article engagement tracking
- **Social Sharing**: External platform integration

### API Endpoints

- `/api/search` - Search functionality
- `/api/chat` - Chatbot integration
- `/api/admin/analytics` - Analytics data
- `/sitemap.xml` - SEO sitemap generation

## Performance Optimizations

- **Static Generation**: Pre-built article pages
- **Image Optimization**: Next.js Image component with lazy loading
- **Caching**: Next.js cache revalidation on updates
- **Database Indexing**: Optimized queries with proper indexes
- **Client-side Filtering**: Fast UI updates without server requests

## Security Considerations

- **Server Actions**: Secure server-side operations
- **Input Validation**: Form data sanitization
- **Authentication**: Admin-only access to creation/editing
- **Article Visibility**: Private articles require authentication for access
- **Session-based Access**: JWT tokens control authenticated user permissions
- **Slug Uniqueness**: Prevents URL conflicts
- **Error Handling**: User-friendly error messages without exposing internals

This system provides a complete, production-ready blog solution with modern UX patterns, performance optimizations, and scalable architecture.
