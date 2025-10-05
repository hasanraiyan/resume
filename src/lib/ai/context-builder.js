import dbConnect from '../dbConnect';
import HeroSection from '../../models/HeroSection';
import AboutSection from '../../models/AboutSection';
import Project from '../../models/Project';
import Article from '../../models/Article';
import ChatbotSettings from '../../models/ChatbotSettings';


/**
 * Context Builder for AI Chatbot
 * Dynamically builds context from database content
 */

export async function getCoreIdentity() {
  try {
    await dbConnect();

    const heroSection = await HeroSection.findOne({});
    if (!heroSection) {
      return {
        name: 'Raiyan',
        role: 'Full-Stack Developer',
        introduction: 'A skilled developer creating modern web applications.'
      };
    }

    return {
      name: heroSection.name || 'Raiyan',
      role: heroSection.role || 'Full-Stack Developer',
      introduction: heroSection.introduction || 'A skilled developer creating modern web applications.'
    };
  } catch (error) {
    console.error('Error fetching core identity:', error);
    return {
      name: 'Raiyan',
      role: 'Full-Stack Developer',
      introduction: 'A skilled developer creating modern web applications.'
    };
  }
}

export async function getAboutSummary() {
  try {
    await dbConnect();

    const aboutSection = await AboutSection.findOne({});
    if (!aboutSection) {
      return 'Raiyan is a skilled full-stack developer with expertise in modern web technologies.';
    }

    return aboutSection.bio || 'Raiyan is a skilled full-stack developer with expertise in modern web technologies.';
  } catch (error) {
    console.error('Error fetching about summary:', error);
    return 'Raiyan is a skilled full-stack developer with expertise in modern web technologies.';
  }
}

export async function getProjectOverview() {
  try {
    await dbConnect();

    const projects = await Project.find({}).limit(20).lean();

    if (!projects || projects.length === 0) {
      return 'Raiyan has worked on various web development projects using modern technologies.';
    }

    const projectSummaries = projects.map(project => {
      return `${project.title} - ${project.category} project${project.description ? ': ' + project.description.substring(0, 100) + '...' : ''}`;
    });

    return `Raiyan has worked on the following projects: ${projectSummaries.join(', ')}.`;
  } catch (error) {
    console.error('Error fetching project overview:', error);
    return 'Raiyan has worked on various web development projects using modern technologies.';
  }
}

export async function getArticleOverview() {
  try {
    await dbConnect();

    const articles = await Article.find({}).limit(10).lean();

    if (!articles || articles.length === 0) {
      return 'Raiyan shares insights about web development and technology.';
    }

    const articleSummaries = articles.map(article => {
      return `${article.title}${article.excerpt ? ': ' + article.excerpt.substring(0, 100) + '...' : ''}`;
    });

    return `Raiyan has written about: ${articleSummaries.join(', ')}.`;
  } catch (error) {
    console.error('Error fetching article overview:', error);
    return 'Raiyan shares insights about web development and technology.';
  }
}

export async function getChatbotSettings() {
  try {
    await dbConnect();

    const settings = await ChatbotSettings.findOne({});

    if (!settings) {
      // Return default settings if none exist
      return {
        aiName: 'Kiro',
        persona: 'You are Kiro, a professional and helpful AI assistant representing Raiyan.',
        baseKnowledge: 'Raiyan is a skilled full-stack developer.',
        servicesOffered: 'Full-stack web development, React applications, Node.js backends.',
        callToAction: 'I\'d be happy to help you get in touch with Raiyan.',
        rules: [
          'Always be professional and helpful',
          'Guide users toward the contact form when appropriate'
        ],
        isActive: true
      };
    }

    return {
      aiName: settings.aiName,
      persona: settings.persona,
      baseKnowledge: settings.baseKnowledge,
      servicesOffered: settings.servicesOffered,
      callToAction: settings.callToAction,
      rules: settings.rules,
      isActive: settings.isActive
    };
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    // Return default settings on error
    return {
      aiName: 'Kiro',
      persona: 'You are Kiro, a professional and helpful AI assistant representing Raiyan.',
      baseKnowledge: 'Raiyan is a skilled full-stack developer.',
      servicesOffered: 'Full-stack web development, React applications, Node.js backends.',
      callToAction: 'I\'d be happy to help you get in touch with Raiyan.',
      rules: [
        'Always be professional and helpful',
        'Guide users toward the contact form when appropriate'
      ],
      isActive: true
    };
  }
}

export async function buildDynamicContext() {
  try {
    // Fetch all context data in parallel
    const [coreIdentity, aboutSummary, projectOverview, articleOverview, chatbotSettings] = await Promise.all([
      getCoreIdentity(),
      getAboutSummary(),
      getProjectOverview(),
      getArticleOverview(),
      getChatbotSettings()
    ]);

    return {
      coreIdentity,
      aboutSummary,
      projectOverview,
      articleOverview,
      chatbotSettings
    };
  } catch (error) {
    console.error('Error building dynamic context:', error);
    throw error;
  }
}
