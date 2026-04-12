# Portfolio & Multi-App Platform

A modern, full-stack portfolio website built with **Next.js 15**, featuring an advanced multi-agent AI system, built-in productivity apps (Pocketly and Taskly), comprehensive analytics, and a powerful Admin CMS.

## 🚀 Key Features

### 🏢 Core Portfolio
- **Dynamic Content:** Fully dynamic hero, about, services, skills, testimonials, and contact sections.
- **Projects & Articles Showcase:** A CMS-backed display of projects (with image galleries and tags) and markdown-supported blog articles.
- **Advanced Global Search:** Real-time fuzzy search across projects and articles powered by `Fuse.js`.

### 🤖 Multi-Agent AI System
The platform integrates LangChain and various LLM providers (OpenAI, Google Gemini) to power an ecosystem of specialized agents:
- **Chat Assistants:** Configurable chatbots for fast, pro, or deep-thinking conversational interactions.
- **Media & Visual Agents:**
  - *Image Analyzer & Embedder:* Analyzes image contents and creates vector embeddings for visual semantic search (via Qdrant).
  - *Image Generator & Editor:* Generates images from text or edits existing ones using AI.
- **Content & Coding Agents:**
  - *Blog Writer Agent:* Helps draft, outline, and synthesize markdown articles.
  - *Code Reporter Agent:* Analyzes codebase snippets.
- **Integration Agents:** Dedicated AI handlers for external platforms like Telegram and WhatsApp.
- **App Builder Agent:** Dynamically creates or updates UI components using natural language.

### 💼 Integrated Apps
- **Pocketly Tracker:** A comprehensive finance tracking application integrated right into the platform, featuring accounts, transactions, categorization, and AI-driven finance chat insights.
- **Taskly:** A robust task management and project board application, helping you stay on top of issues and kanban boards seamlessly.

### 🛡️ Admin CMS & Security
- **Role-based Dashboard:** A highly secured Admin panel (protected by NextAuth.js middleware) to manage content, configurations, and analytics.
- **Content Management:** Create and edit Projects, Blog Posts, Heroes, Contributors, and more.
- **SnapLinks:** Built-in URL shortener to track custom redirect links (`/r/slug`).
- **Media Library:** Manage uploads via Cloudinary or UploadThing.
- **Privacy-focused Analytics:** Local session tracking, bot filtering, and real-time Chart.js visual insights without relying on third-party cookies.
- **Robust Security:** AES encryption for secret keys and API credentials, combined with rigorous rate limiting.

---

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router), React 19
- **Styling & Animation:** Tailwind CSS 4, GSAP, Framer Motion
- **Database:** MongoDB with Mongoose, Qdrant (Vector DB for AI)
- **AI Integration:** LangChain, @google/genai, @langchain/openai, Model Context Protocol (MCP)
- **Authentication:** NextAuth.js
- **Media:** UploadThing, Cloudinary
- **State/Search:** React Context, Fuse.js

---

## 📁 Project Structure

```
resume/
├── scripts/                  # Setup, seed, and migration scripts
├── src/
│   ├── app/                  # Next.js App Router (Pages & API Handlers)
│   │   ├── (admin)/          # Protected Admin CMS routes
│   │   ├── api/              # API endpoints (Auth, AI, Search, CMS CRUD)
│   │   ├── apps/             # Integrated Apps (e.g. AppEditor)
│   │   ├── pocketly/         # Pocketly Tracker frontend
│   │   ├── r/                # SnapLinks short URL handler
│   │   ├── taskly/           # Taskly task management frontend
│   │   └── page.js           # Main Portfolio Homepage
│   ├── components/           # Reusable React UI Components
│   │   ├── admin/            # Admin Panel components
│   │   ├── pocketly-tracker/ # Pocketly components (Charts, Modals, Chat)
│   │   ├── search/           # Global Search Overlay
│   │   ├── taskly/           # Taskly Kanban boards and settings
│   │   └── ui/               # Base UI elements (Buttons, Dialogs, etc.)
│   ├── lib/                  # Utilities, integrations, and Agents
│   │   └── agents/           # Core Multi-Agent Architecture definitions
│   ├── models/               # Mongoose DB Schemas
│   └── context/              # Global React Contexts
├── package.json              # Dependencies and scripts
└── middleware.js             # Next.js middleware (Auth protection)
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **pnpm**, **npm**, **yarn**, or **bun**
- **MongoDB** Instance (Local or Atlas)
- **API Keys** (OpenAI, Google Gemini, Cloudinary, etc., depending on features used)

### 1. Clone the repository
```bash
git clone https://github.com/hasanraiyan/resume.git
cd resume
```

### 2. Install dependencies
Using `pnpm` is recommended for this workspace:
```bash
pnpm install
```

### 3. Setup Environment Variables
The repository includes a helpful setup script to configure your database and securely generate encryption/authentication secrets automatically.

**Run the interactive setup:**
```bash
pnpm run project-setup
```
This script will guide you through creating your `.env` file.

*Alternatively, you can manually copy `.env.example` to `.env` and fill in your keys.*

### 4. Database Setup (Optional Seeding)
The platform will auto-initialize DB schemas when connecting. To add sample data:
```bash
node scripts/seed-cms.js
```

### 5. Start Development Server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application. Access the admin dashboard at `/admin`.

---

## 👨‍💻 Development Scripts

- `pnpm run dev`: Starts the Next.js development server with Turbopack.
- `pnpm run build`: Builds the application for production.
- `pnpm start`: Starts the production server.
- `pnpm run lint`: Runs ESLint.
- `pnpm run format`: Formats code using Prettier.
- `pnpm run check-format`: Checks code formatting.
- `pnpm run project-setup`: Interactive environment setup wizard.

---

## 🤝 Contributing
Contributions are welcome! If you'd like to improve the code, add new features, or fix bugs:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
