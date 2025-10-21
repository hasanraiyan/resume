# AGENTS.md - Portfolio Resume Project Guide

## Build, Lint, Test Commands

- **Dev server**: `pnpm run dev` (uses Turbopack)
- **Build**: `pnpm run build` (clears cache, skips lint)
- **Production**: `pnpm start`
- **Lint**: `pnpm run lint` (ESLint)
- **Format**: `pnpm run format` (Prettier write)
- **Check format**: `pnpm run check-format`
- **No test framework** is currently configured

## Architecture & Structure

- **Next.js 15.5** with App Router (React 19, Server Components)
- **Database**: MongoDB with Mongoose ODM
- **Auth**: NextAuth.js with MongoDB adapter, role-based access (Admin)
- **Key folders**: `src/app/` (pages & API routes), `src/components/` (UI), `src/models/` (Mongoose), `src/lib/` (utilities), `src/hooks/` (custom hooks)
- **API routes**: `/api/chat` (AI chatbot), `/api/search` (fuzzy search), `/api/analytics`, `/api/projects`, `/api/admin/*` (protected)
- **AI Integration**: OpenAI SDK with function calling and streaming responses
- **State**: React Context (LoadingContext, SiteContext), Server Components for data

## Code Style & Conventions

- **Formatting**: Prettier (semi: true, singleQuote: true, trailingComma: es5, tabWidth: 2, printWidth: 100)
- **Linting**: ESLint extends next/core-web-vitals, Prettier errors enforced
- **Imports**: Use `@/` alias for `src/` directory (e.g., `@/app/actions/mediaActions`)
- **Components**: Use 'use client' directive for client components, default export
- **Naming**: camelCase for variables/functions, PascalCase for components/models
- **Types**: JSDoc comments required for all public functions, classes, and components
- **Error handling**: Use try-catch in API routes, return structured JSON responses
- **File headers**: Include file path comment (e.g., `// src/components/admin/MediaLibraryClient.js`)
- **Env vars**: Store in `.env.local` (MONGODB_URI, NEXTAUTH_SECRET, OPENAI_API_KEY)
- **Pre-commit**: Husky + lint-staged automatically formats on commit
