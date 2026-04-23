import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models using relative paths or absolute paths if needed
// Since we are running this with node/tsx, we need to handle the DB connection manually
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

// Define Schemas directly in the script to avoid import issues with Next.js specific paths
const AchievementSectionSchema = new mongoose.Schema({
  achievementTitle: { type: String, default: 'Achievements' },
  achievementDescription: { type: String, default: 'Milestones that inspire' },
  certificationTitle: { type: String, default: 'Certifications' },
  certificationDescription: { type: String, default: 'Continuous learning & professional growth' },
});

const AchievementSchema = new mongoose.Schema({
  title: String,
  description: String,
  src: String,
  alt: String,
  type: { type: String, enum: ['achievement', 'certification'] },
  displayOrder: Number,
  isActive: { type: Boolean, default: true },
});

const TestimonialSectionSchema = new mongoose.Schema({
  title: String,
  description: String,
});

const TestimonialSchema = new mongoose.Schema({
  name: String,
  company: String,
  companyLink: String,
  avatar: String,
  rating: Number,
  content: String,
  project: String,
  projectLink: String,
  displayOrder: Number,
  isActive: { type: Boolean, default: true },
});

const ProjectSectionSchema = new mongoose.Schema({
  title: String,
  description: String,
  viewAllText: String,
  viewAllLink: String,
});

const ToolTeaserSectionSchema = new mongoose.Schema({
  imageAiTitle: String,
  imageAiDescription: String,
  imageAiPlaceholder: String,
  imageAiButtonText: String,
  imageAiButtonLink: String,
  presentationTitle: String,
  presentationDescription: String,
  presentationPlaceholder: String,
  presentationButtonText: String,
  presentationButtonLink: String,
});

const SiteConfigSchema = new mongoose.Schema(
  {
    siteName: String,
    ownerName: String,
    navigation: [{ id: Number, label: String, href: String }],
    navbarCta: { text: String, href: String },
    newsletterTitle: String,
    newsletterDescription: String,
    newsletterPlaceholder: String,
    newsletterButtonText: String,
    privacyText: String,
  },
  { strict: false }
);

const AchievementSection = mongoose.model('AchievementSection', AchievementSectionSchema);
const Achievement = mongoose.model('Achievement', AchievementSchema);
const TestimonialSection = mongoose.model('TestimonialSection', TestimonialSectionSchema);
const Testimonial = mongoose.model('Testimonial', TestimonialSchema);
const ProjectSection = mongoose.model('ProjectSection', ProjectSectionSchema);
const ToolTeaserSection = mongoose.model('ToolTeaserSection', ToolTeaserSectionSchema);
const SiteConfig = mongoose.model('SiteConfig', SiteConfigSchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // 1. Seed Achievements & Certifications
    console.log('Seeding Achievements...');
    await Achievement.deleteMany({});
    await AchievementSection.deleteMany({});

    await AchievementSection.create({
      achievementTitle: 'Achievements',
      achievementDescription: 'Milestones that inspire',
      certificationTitle: 'Certifications',
      certificationDescription: 'Continuous learning & professional growth',
    });

    const achievements = [
      {
        src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1772214725/portfolio_assets/yhe9pmxetss39hfaxwyn.jpg',
        alt: 'CLIMB Competition 3rd Place - Dostify Project',
        title: 'CLIMB Competition — 3rd Place',
        description:
          'Secured 3rd place in the CLIMB Innovation Competition for Dostify, presenting a solution-driven project with strong technical execution and real-world impact.',
        type: 'achievement',
        displayOrder: 1,
      },
      {
        src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1772214725/portfolio_assets/yyiciqegiexqyaslnwyf.jpg',
        alt: 'CLIMB Competition Team Triumph - Dostify',
        title: 'CLIMB Competition — Team Triumph',
        description:
          'Celebrating our 3rd place finish at the CLIMB Competition with Team Dostify, recognized for innovation, collaboration, and impactful problem-solving.',
        type: 'achievement',
        displayOrder: 2,
      },
      {
        src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1772214725/portfolio_assets/lbevyaxkxxhvmoznulcy.jpg',
        alt: 'Dostify Project Funding - ₹40,000 Grant',
        title: 'Dostify — ₹40,000 Project Grant',
        description:
          'Awarded ₹40,000 in funding by the MIT Muzaffarpur Alumni Association International for Dostify, recognizing the project’s innovation, feasibility, and real-world potential.',
        type: 'achievement',
        displayOrder: 3,
      },
      {
        src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1772214725/portfolio_assets/sh6efuvk5lpllzeaylgo.jpg',
        alt: 'CLIMB Competition 3rd Position Medal - Dostify',
        title: 'CLIMB — 3rd Position Medal',
        description:
          'Awarded 3rd position at the CLIMB Innovation Competition for Dostify, recognizing persistence, technical execution, and impactful problem-solving.',
        type: 'achievement',
        displayOrder: 4,
      },
      {
        src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762678856/portfolio_assets/u9vr8j427iy1wocnrm6n.png',
        alt: 'MIT Muzaffarpur Magazine 2025',
        title: 'MIT Magazine 2025 — Featured Innovator',
        description:
          'Featured for building PYQDeck, an AI platform that streamlines exam prep for students.',
        type: 'achievement',
        displayOrder: 5,
      },
    ];

    const certifications = [
      {
        src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1763631873/portfolio_assets/iaeau07wjimbx3vlbhhw.png',
        alt: 'LangChain Essentials Certificate',
        title: 'LangChain Essentials — TypeScript',
        description:
          'Completed the LangChain Academy course on building LLM applications using TypeScript and LangChain.js.',
        type: 'certification',
        displayOrder: 1,
      },
      {
        src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762785755/portfolio_assets/qgkdrzy7nrlnzighzrck.jpg',
        alt: 'NIELIT ML Internship',
        title: 'ML Intern — NIELIT Patna',
        description:
          '4-week internship on ML with Python, covering data pipelines, models, and scikit-learn.',
        type: 'certification',
        displayOrder: 2,
      },
      {
        src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1763960607/portfolio_assets/cj3fmc7qu8hsbmhovk12.png',
        alt: 'Foundation: Intro to the LangGraph Certificate',
        title: 'Foundation — Intro to LangGraph',
        description:
          'Completed foundational training on LangGraph, focusing on graph-based LLM workflows and agentic development.',
        type: 'certification',
        displayOrder: 3,
      },
    ];

    await Achievement.insertMany([...achievements, ...certifications]);

    // 2. Seed Testimonials
    console.log('Seeding Testimonials...');
    await Testimonial.deleteMany({});
    await TestimonialSection.deleteMany({});

    await TestimonialSection.create({
      title: 'Client Testimonials',
      description: 'What my clients say about working with me',
    });

    await Testimonial.create({
      name: 'Shivam Kumar Singh',
      company: 'Career Simplify Multi Utility Private Limited',
      companyLink: 'https://careersimplify.in',
      avatar: 'https://careersimplify.in/assets/cslogo-C1vdCqlW.svg',
      rating: 5,
      content:
        'Raiyan demonstrated exceptional ownership by independently building our platform from the ground up and delivering a functional, stable product. He managed every stage of development backend, frontend, database architecture, and deployment while resolving major performance bottlenecks with practical and scalable solutions. The platform is now live and expanding on the solid technical foundation he created. Raiyan consistently proved to be reliable, proactive, and continues to provide valuable support and improvements post-launch.',
      project: 'Career Simplify Website',
      projectLink: '/projects/careersimplify',
      displayOrder: 1,
    });

    // 3. Seed Tool Teasers
    console.log('Seeding Tool Teasers...');
    await ToolTeaserSection.deleteMany({});
    await ToolTeaserSection.create({
      imageAiTitle: 'Try My AI Artist',
      imageAiDescription:
        'Experience the same AI technology I use for my projects. Describe anything, and watch it manifest in seconds.',
      imageAiPlaceholder: 'A futuristic city in a glass bottle...',
      imageAiButtonText: 'Enter full AI Creative Studio',
      imageAiButtonLink: '/tools/image-ai',
      presentationTitle: 'Create Slides with AI',
      presentationDescription:
        'Just describe your topic. The AI agent researches, outlines, and generates complete visual presentation slides in seconds.',
      presentationPlaceholder: 'The Future of Quantum Computing...',
      presentationButtonText: 'Open Presentation Studio',
      presentationButtonLink: '/tools/presentation',
    });

    // 4. Seed Project Section
    console.log('Seeding Project Section...');
    await ProjectSection.deleteMany({});
    await ProjectSection.create({
      title: 'Featured Works',
      description: 'A curated selection of my best projects',
      viewAllText: 'View All Projects',
      viewAllLink: '/projects',
    });

    // 5. Update SiteConfig with Navigation
    console.log('Updating SiteConfig...');
    const siteConfig = await SiteConfig.findOne();
    if (siteConfig) {
      siteConfig.navigation = [
        { id: 1, label: 'Home', href: '/' },
        { id: 2, label: 'About', href: '/#about' },
        { id: 3, label: 'Work', href: '/#work' },
        { id: 4, label: 'Projects', href: '/projects' },
        { id: 5, label: 'Blog', href: '/blog' },
        { id: 6, label: 'Apps', href: '/apps' },
      ];
      siteConfig.navbarCta = {
        text: "Let's Talk",
        href: '/#contact',
      };
      siteConfig.newsletterTitle = 'Stay Updated';
      siteConfig.newsletterDescription =
        'Subscribe to our newsletter for the latest projects, articles, and insights.';
      siteConfig.newsletterPlaceholder = 'Enter your email address';
      siteConfig.newsletterButtonText = 'Subscribe';
      siteConfig.privacyText =
        "Join our newsletter for updates on new projects, articles, and insights. We respect your privacy and won't spam you.";

      await siteConfig.save();
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
