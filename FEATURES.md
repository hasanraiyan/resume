# 🌟 Project Features: Portfolio Resume Website

This document serves as a comprehensive overview of all features implemented across the Portfolio application.

## 🚀 Core Web Architecture

- **Modern Stack**: Built with **Next.js 15 (App Router)** and **React 19 Server Components** for optimal performance and SEO.
- **Database**: **MongoDB** with Mongoose ODM for structured, scalable data persistence.
- **Aesthetics**: Premium, responsive UI powered by **Tailwind CSS 4** and smooth micro-animations using **GSAP** and framer-motion principles.
- **Interactive Search**: Real-time fuzzy search across all entities (projects, articles, etc.) powered by **Fuse.js**.

## 🧠 Sophisticated AI Agents System

A fully modular AI Agent Architecture utilizing multi-provider support (OpenAI, Google Gemini) via LangChain.

### 💬 Conversational Agents (Chatbots)

- **Chat Fast**: Optimized for speed and low cost (e.g., GPT-4o-mini).
- **Chat Pro**: High-quality intelligent chat optimized for accuracy (e.g., GPT-4o).
- **Chat Thinking**: Deep reasoning agent optimized for complex logic (e.g., o1-preview).
- **Function Calling**: AI has access to `listAllProjects`, `getProjectDetails`, `listAllArticles`, `getArticleDetails`, and `searchPortfolio` directly in chat context.
- **Integration Agents**: Dedicated handler agents for WhatsApp and Telegram bots.

### 🎨 Media & Visual Agents (Prisma / SmallClaw)

- **Image Analyzer**: Analyzes and indexes images with AI-generated descriptions for semantic search.
- **Image Generator**: Generates high-fidelity images directly from text prompts.
- **Image Editor**: Makes precise modifications to existing images using inpainting/outpainting.
- **Image Embedder**: Creates vector embeddings for semantic visual search using Qdrant.
- **Visual Search Agent**: Enables deep vector-based semantic search across all uploaded visual media.

### 📝 Content Creation & Synthesis Agents

- **Blog Writer**: Structures, outlines, and helps write high-quality blog posts.
- **Presentation Synthesizer**: Researches topics and synthesizes complete, visually rich presentation slides using Gemini 1.5 Pro.
- **Code Reporter**: Analyzes uploaded codebase snippets for reviews and issue templates.

## 🛠️ Comprehensive Admin Dashboard (CMS)

A protected, role-based backend to manage every aspect of the site.

- **Project Management**: Full CRUD operations for portfolio projects, including tags, categories, and image galleries.
- **Article Publishing**: Draft, write, and publish blog articles with full markdown (`react-simplemde-editor`, `react-markdown`) support.
- **Contact & Subscribers List**: View incoming messages and manage newsletter subscribers.
- **SnapLinks (URL Shortener)**: Create, manage, and track custom redirect links (`/r/slug`) with individual click analytics.
- **Media / Storage Manager**: Control and review Cloudinary / UploadThing uploads out of the box.
- **Agent Configuration**: Fine-tune Chatbot persona, base knowledge, and active AI tools dynamically from the UI.

## 📊 Privacy-Focused Custom Analytics

- **Session Tracking**: Generates anonymized session tracking without relying on invasive third-party cookies.
- **Bot Filtering**: Automatically detects and separates genuine user traffic from bots/crawlers using robust User-Agent parsing.
- **Event Tracking**: Logs interactions such as page views, button clicks, AI usage, and form submissions.
- **Data Expiration**: Automatic 1-year data expiration policy prioritizing user privacy.
- **Real-time Insights**: View engagement charts (via Chart.js) directly in the Admin Backend.

## 🔒 Security & Optimization

- **Authentication**: Robust NextAuth.js credential management, enforcing Server-Side rendering checks across all `/admin` routes.
- **Rate Limiting**: Custom API rate-limiting middleware to prevent abuse (DDoS mitigation on bots and subscriptions).
- **Encryption Key Vault**: Secure AES encryption of sensitive user data and specialized API Keys out of the source code.
- **Setup Scripting**: Ships with a powerful `scripts/setup.js` wizard automatically generating robust 256-bit secure secret tokens mapped out to your `.env` config.
