# Portfolio Resume Website

A modern, full-stack portfolio website built with Next.js 15, featuring an AI-powered chatbot, comprehensive analytics, content management system, and dynamic project showcase.

> [!CAUTION]
> **DEVELOPMENT STATUS**: This project is currently in active development. Features are being added and refined daily. Use with caution in production environments.

## 🚀 Features

### Core Features

- **Dynamic Portfolio Management**: Full CRUD operations for projects and articles with image galleries
- **AI-Powered Chatbot**: Intelligent assistant using OpenAI with function calling and dynamic context
- **Advanced Search**: Fuzzy search across projects and articles using Fuse.js
- **Analytics System**: Privacy-focused analytics with session tracking and bot detection
- **Admin Dashboard**: Comprehensive admin interface for content and settings management
- **Responsive Design**: Mobile-first design with smooth animations using GSAP

### Technical Highlights

- **Next.js 15** with App Router and React Server Components
- **MongoDB** with Mongoose for data persistence
- **NextAuth.js** for authentication and authorization
- **OpenAI Integration** for AI chatbot with streaming responses
- **Real-time Updates** with custom hooks and event-driven architecture
- **SEO Optimized** with dynamic sitemap generation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm**, **npm**, **yarn**, or **bun**
- **MongoDB** (local instance or MongoDB Atlas account)
- **OpenAI API Key** (for chatbot functionality)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/hasanraiyan/resume.git
cd resume
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Quick Setup

The easiest way to configure the project is to use the interactive setup script:

```bash
pnpm run project-setup
```

This script will:

- Guide you through the configuration of Database, Admin, and API keys.
- **Automatically generate** secure random secrets for `NEXTAUTH_SECRET` and `ENCRYPTION_SECRET`.
- Create and populate your `.env` file based on your inputs.

#### Manual Configuration (Alternative)

If you prefer to configure manually, copy `.env.example` to `.env` and fill in the required variables.

### 4. Database Setup

The application will automatically create necessary indexes on first run. To seed initial data (optional):

```bash
# Start MongoDB (if running locally)
mongod

# Run the development server (will auto-initialize DB)
npm run dev
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
resume/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/               # API endpoints (fully documented)
│   │   │   ├── chat/          # AI chatbot API with streaming
│   │   │   ├── search/        # Unified search API
│   │   │   ├── analytics/     # Analytics tracking & admin dashboard
│   │   │   ├── projects/      # Projects CRUD with slug validation
│   │   │   ├── auth/          # NextAuth.js authentication
│   │   │   ├── admin/         # Admin-only APIs (analytics, chatbot, telegram)
│   │   │   ├── subscribe/     # Newsletter subscription API
│   │   │   ├── stats/         # Statistics section API
│   │   │   ├── hero/          # Hero section management
│   │   │   ├── about/         # About section management
│   │   │   └── contacts/      # Contact form submissions
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── projects/          # Project showcase pages
│   │   ├── blog/              # Blog/article pages
│   │   └── page.js            # Homepage
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI components
│   │   ├── projects/          # Project-specific components
│   │   ├── search/            # Search components
│   │   └── admin/             # Admin panel components
│   ├── lib/                   # Utility libraries
│   │   ├── ai/                # AI context builder & tools
│   │   ├── search/            # Search functionality (Fuse.js)
│   │   ├── analytics.js       # Analytics tracker
│   │   ├── dbConnect.js       # MongoDB connection
│   │   ├── serialize.js       # Data serialization
│   │   ├── crypto.js          # Encryption utilities
│   │   └── rateLimit.js       # Rate limiting for APIs
│   ├── models/                # MongoDB Mongoose models
│   │   ├── Project.js         # Project schema with galleries
│   │   ├── Article.js         # Article/blog schema
│   │   ├── Analytics.js       # Analytics events schema
│   │   ├── User.js            # User schema
│   │   ├── HeroSection.js     # Homepage hero schema
│   │   ├── AboutSection.js    # About section schema
│   │   ├── StatsSection.js    # Statistics section schema
│   │   ├── ChatbotSettings.js # AI chatbot configuration
│   │   ├── ChatLog.js         # Chat conversation logs
│   │   ├── Contact.js         # Contact form submissions
│   │   ├── Subscriber.js      # Newsletter subscribers
│   │   └── TelegramSettings.js # Telegram bot integration
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAnalytics.js    # Analytics hooks
│   │   └── useHeroData.js     # Hero data management
│   ├── context/               # React Context providers
│   │   ├── LoadingContext.js  # Loading state management
│   │   └── SiteContext.js     # Site-wide data
│   ├── styles/                # Global styles and design tokens
│   └── utils/                 # Utility functions
├── middleware.js              # Next.js middleware for auth
└── package.json               # Dependencies and scripts
```

## 🏗️ Architecture Overview

### Backend Architecture

#### Database Models

- **Project**: Portfolio projects with galleries, tags, and metadata
- **Article**: Blog posts with draft/published workflow
- **Analytics**: Event tracking with automatic expiration (1 year)
- **User**: Admin user accounts
- **HeroSection**, **AboutSection**: Editable homepage content
- **ChatbotSettings**: AI assistant configuration

#### API Routes

- `/api/chat` - AI chatbot with streaming responses
- `/api/search` - Unified search across content
- `/api/analytics` - Event tracking endpoint
- `/api/projects` - CRUD operations for projects
- `/api/admin/*` - Admin-only endpoints

### Frontend Architecture

#### Key Components

- **Hero**: Animated homepage hero section
- **Work**: Project showcase with filtering
- **ProjectGallery**: Image carousel with thumbnails
- **SearchOverlay**: Full-screen search interface
- **Chatbot**: AI assistant interface

#### Custom Hooks

- `useAnalytics`: Comprehensive analytics tracking
- `useHeroData`: Real-time hero data management
- `useLoadingStatus`: Coordinated loading states
- `useSiteContext`: Global site data access

#### State Management

- React Context for global state
- Server Components for data fetching
- Client Components for interactivity

## 🔧 Development

### Available Scripts

# Development server with Turbopack

pnpm run dev

# Production build

pnpm run build

# Start production server

pnpm start

# Lint code

pnpm run lint

# Format code with Prettier

pnpm run format

# Check formatting

pnpm run check-format

### Code Style

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **lint-staged** for staged file linting

Code is automatically formatted on commit.

### Code Documentation

This project maintains comprehensive documentation following JSDoc standards:

- ✅ **API Routes**: All API endpoints are fully documented with request/response schemas
- ✅ **Database Models**: All Mongoose models include detailed schema documentation and usage examples
- ✅ **Action Functions**: Server actions have complete parameter and return type documentation
- ✅ **Core Components**: Main UI components (Hero, About, Contact, etc.) are documented
- 🚧 **Component Library**: Additional components are being documented systematically
- ✅ **Utility Functions**: Helper functions include detailed docstrings

All public functions, classes, and components must include JSDoc comments:

```javascript
/**
 * Brief description of the function.
 *
 * @param {Type} paramName - Parameter description
 * @returns {ReturnType} Return value description
 */
function example(paramName) {
  // Implementation
}
```

**Documentation Status**: See `documentation-todo.md` for current documentation progress and remaining tasks.

## 🎨 Key Technologies

### Core Stack

- **Next.js 15.5** - React framework with App Router
- **React 19** - UI library
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Tailwind CSS 4** - Utility-first CSS

### Features & Libraries

- **NextAuth.js** - Authentication
- **OpenAI SDK** - AI integration
- **Fuse.js** - Fuzzy search
- **GSAP** - Animations
- **Chart.js** - Analytics visualizations
- **React Markdown** - Markdown rendering
- **Lucide React** - Icons

## 🔒 Security

### Authentication

- NextAuth.js with MongoDB adapter
- Role-based access control (Admin roles)
- Protected admin routes via middleware

### Data Protection

- Environment variables for sensitive data
- Password hashing (handled by NextAuth)
- Input validation and sanitization
- Bot detection in analytics

### Best Practices

- HTTPS required in production
- Secure session management
- MongoDB connection pooling
- Content Security Policy headers

## 📊 Analytics

The built-in analytics system tracks:

- **Page Views**: With session tracking
- **Custom Events**: Click tracking, form submissions
- **Chatbot Interactions**: AI usage statistics
- **User Sessions**: Duration and page count
- **Bot Filtering**: Automatic bot detection

Analytics data automatically expires after 1 year.

## 🤖 AI Chatbot

The AI chatbot features:

- **Function Calling**: Access to projects and articles
- **Streaming Responses**: Real-time message generation
- **Context Awareness**: Dynamic context from database
- **Tool Usage**: Search, list, and detail retrieval
- **Configurable Persona**: Customizable via admin panel

### Available Tools

1. `listAllProjects` - Get all projects
2. `getProjectDetails` - Get specific project
3. `listAllArticles` - Get all articles
4. `getArticleDetails` - Get specific article
5. `searchPortfolio` - Search content

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The application can be deployed to any Node.js hosting platform:

- Railway
- Render
- DigitalOcean App Platform
- AWS/GCP/Azure

**Requirements**:

- Node.js 18+ runtime
- MongoDB database access
- Environment variables configured

## 📝 Configuration

### Chatbot Settings

Configure the AI assistant via the admin panel at `/admin/chatbot`:

- AI Name and Persona
- Base Knowledge
- Services Offered
- Call-to-Action message
- Behavioral Rules
- Model Selection

### Content Management

Manage content via the admin dashboard:

- Projects: `/admin/projects`
- Articles: `/admin/blog`
- Hero Section: `/admin/hero`
- About Section: `/admin/about`
- Analytics: `/admin/analytics`

## 🐛 Troubleshooting

### Database Connection Issues

- Verify MongoDB is running
- Check `MONGODB_URI` in `.env.local`
- Ensure network access (for Atlas)

### OpenAI API Errors

- Verify API key is correct
- Check API quota and billing
- Ensure model name is valid

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall
- Check Node.js version compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Built with ❤️ by Raiyan Hasan.

## 🆘 Support & Issues

If you encounter any issues:

1. Check the [Documentation](#-features) above.
2. Search through [Existing Issues](https://github.com/hasanraiyan/resume/issues).
3. If your issue is new, please [Create a New Issue](https://github.com/hasanraiyan/resume/issues/new/choose) using the provided templates.
