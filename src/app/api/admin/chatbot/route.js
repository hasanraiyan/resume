/**
 * @fileoverview Admin Chatbot Settings API route for managing AI chatbot configuration.
 * This module provides endpoints for retrieving and updating chatbot settings,
 * including AI personality, knowledge base, services offered, and behavioral rules.
 *
 * @description This API endpoint allows administrators to:
 * - Retrieve current chatbot configuration settings
 * - Update AI name, persona, and behavioral parameters
 * - Configure base knowledge and services information
 * - Set call-to-action messages and interaction rules
 * - Enable/disable chatbot functionality
 * - Configure AI model settings
 *
 * The chatbot settings are stored in the database and used by the main
 * chat API to customize AI responses and behavior.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ChatbotSettings from '@/models/ChatbotSettings';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { encrypt } from '@/lib/crypto';
import { revalidateTag } from 'next/cache';

// GET - Fetch current chatbot settings

/**
 * Retrieves the current chatbot configuration settings from the database.
 * If no settings exist, creates and returns default settings.
 *
 * @async
 * @function GET
 * @returns {Promise<NextResponse>} JSON response with current chatbot settings
 *
 * @description This endpoint returns the complete chatbot configuration including:
 * - AI name and personality settings
 * - Base knowledge and services information
 * - Call-to-action messages and behavioral rules
 * - Activation status and AI model configuration
 *
 * If no settings are found in the database, it automatically creates
 * default settings and returns them to ensure the chatbot has valid configuration.
 *
 * @example
 * // Get current chatbot settings
 * GET /api/admin/chatbot
 *
 * @example Response:
 * {
 *   "aiName": "Kiro",
 *   "persona": "You are Kiro, a professional AI assistant...",
 *   "baseKnowledge": "Raiyan is a skilled full-stack developer...",
 *   "servicesOffered": ["Web Development", "Mobile Apps", "AI Integration"],
 *   "callToAction": "I'd be happy to help you get in touch with Raiyan.",
 *   "rules": ["Always be professional", "Guide to contact form"],
 *   "isActive": true,
 *   "modelName": "gpt-3.5-turbo"
 * }
 */
export async function GET() {
  try {
    await dbConnect();

    let settings = await ChatbotSettings.findOne({});

    if (!settings) {
      // Create default settings if none exist
      settings = new ChatbotSettings({});
      await settings.save();
    }

    // Migration: Migrate string values to object slots
    let isModified = false;
    const migrateSlot = (slotData) => {
      if (typeof slotData === 'string') {
        isModified = true;
        // Map old strings to the default OpenAI ID if they existed, but with no model default
        return { providerId: 'default-openai', model: slotData || '' };
      }
      return slotData;
    };

    settings.modelName = migrateSlot(settings.modelName);
    settings.fastModel = migrateSlot(settings.fastModel);
    settings.thinkingModel = migrateSlot(settings.thinkingModel);
    settings.proModel = migrateSlot(settings.proModel);

    if (isModified) {
      await settings.save();
    }

    // Mask API keys for frontend
    const sanitizedProviders = settings.providers.map((p) => ({
      id: p.id,
      name: p.name,
      baseUrl: p.baseUrl,
      apiKey: p.apiKey ? '********' : '',
      isActive: p.isActive,
      supportsTools: p.supportsTools,
    }));

    return NextResponse.json({
      aiName: settings.aiName,
      persona: settings.persona,
      baseKnowledge: settings.baseKnowledge,
      servicesOffered: settings.servicesOffered,
      callToAction: settings.callToAction,
      rules: settings.rules,
      isActive: settings.isActive,
      modelName: settings.modelName,
      fastModel: settings.fastModel,
      thinkingModel: settings.thinkingModel,
      proModel: settings.proModel,
      providers: sanitizedProviders,
    });
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update chatbot settings

/**
 * Updates or creates chatbot configuration settings in the database.
 * Validates input data and handles both creation of new settings and updates to existing ones.
 *
 * @async
 * @function POST
 * @param {Request} request - Next.js request object containing chatbot settings data
 * @returns {Promise<NextResponse>} JSON response with success message and updated settings
 *
 * @description This endpoint allows administrators to configure:
 * - AI name and personality (persona)
 * - Base knowledge about the portfolio owner
 * - Services offered for lead generation
 * - Call-to-action messages for user engagement
 * - Behavioral rules and guidelines
 * - Chatbot activation status
 * - AI model selection for responses
 *
 * The function validates all required fields and filters out empty rules
 * before saving to the database. If no settings exist, it creates new ones.
 *
 * @example
 * // Update chatbot settings
 * POST /api/admin/chatbot
 * Body: {
 *   "aiName": "Kiro",
 *   "persona": "You are Kiro, a professional AI assistant...",
 *   "baseKnowledge": "Raiyan is a skilled full-stack developer...",
 *   "servicesOffered": ["Web Development", "Mobile Apps", "AI Integration"],
 *   "callToAction": "I'd be happy to help you get in touch with Raiyan.",
 *   "rules": ["Always be professional", "Guide to contact form"],
 *   "isActive": true,
 *   "modelName": "gpt-3.5-turbo"
 * }
 *
 * @example Response:
 * {
 *   "message": "Chatbot settings saved successfully",
 *   "settings": {
 *     "aiName": "Kiro",
 *     "persona": "You are Kiro, a professional AI assistant...",
 *     // ... other settings
 *   }
 * }
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check if the request body is empty
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Unsupported media type' }, { status: 415 });
    }

    const bodyText = await request.text();
    if (!bodyText || bodyText.trim() === '') {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error('[Admin API] JSON Parse Error:', e);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      aiName,
      persona,
      baseKnowledge,
      servicesOffered,
      callToAction,
      rules,
      isActive = true,
      modelName = {
        providerId: '',
        model: '',
      },
      fastModel = { providerId: '', model: '' },
      thinkingModel = { providerId: '', model: '' },
      proModel = { providerId: '', model: '' },
      providers = [],
    } = body;

    // Validate required fields
    if (!aiName || !persona || !baseKnowledge || !servicesOffered || !callToAction) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Filter out empty rules
    const filteredRules = rules.filter((rule) => rule.trim() !== '');

    // Find existing settings or create new one
    let settings = await ChatbotSettings.findOne({});

    // Process providers: encrypt API keys if they are newly provided or updated
    let updatedProviders = [];
    if (providers && Array.isArray(providers)) {
      updatedProviders = providers.map((p) => {
        let encryptedKey = p.apiKey;
        // If the key is '********', it means the user didn't update it, so we retain the old one
        if (p.apiKey === '********' && settings && settings.providers) {
          const existingProvider = settings.providers.find((ep) => ep.id === p.id);
          if (existingProvider) {
            encryptedKey = existingProvider.apiKey;
          }
        } else if (p.apiKey && p.apiKey !== '********') {
          encryptedKey = encrypt(p.apiKey);
        }

        return {
          id: p.id,
          name: p.name,
          baseUrl: p.baseUrl,
          apiKey: encryptedKey,
          isActive: p.isActive,
          supportsTools: p.supportsTools,
        };
      });
    }

    if (settings) {
      // Update existing settings
      settings.aiName = aiName;
      settings.persona = persona;
      settings.baseKnowledge = baseKnowledge;
      settings.servicesOffered = servicesOffered;
      settings.callToAction = callToAction;
      settings.rules = filteredRules;
      settings.isActive = isActive;
      settings.modelName = modelName;
      settings.fastModel = fastModel;
      settings.thinkingModel = thinkingModel;
      settings.proModel = proModel;
      settings.providers = updatedProviders;

      await settings.save();
    } else {
      // Create new settings
      settings = new ChatbotSettings({
        aiName,
        persona,
        baseKnowledge,
        servicesOffered,
        callToAction,
        rules: filteredRules,
        isActive,
        modelName,
        fastModel,
        thinkingModel,
        proModel,
        providers: updatedProviders,
      });

      await settings.save();
    }

    // Clear the AI context cache to ensure the chatbot picks up the new providers/models immediately
    try {
      revalidateTag('ai-context');
      revalidateTag('chatbot-settings');
      console.log('[Admin API] AI Context revalidated');
    } catch (revalidateError) {
      console.error('[Admin API] Revalidation failed:', revalidateError);
    }

    // Mask API keys for response
    const sanitizedProviders = settings.providers.map((p) => ({
      id: p.id,
      name: p.name,
      baseUrl: p.baseUrl,
      apiKey: p.apiKey ? '********' : '',
      isActive: p.isActive,
      supportsTools: p.supportsTools,
    }));

    return NextResponse.json({
      message: 'Chatbot settings saved successfully',
      settings: {
        aiName: settings.aiName,
        persona: settings.persona,
        baseKnowledge: settings.baseKnowledge,
        servicesOffered: settings.servicesOffered,
        callToAction: settings.callToAction,
        rules: settings.rules,
        isActive: settings.isActive,
        modelName: settings.modelName,
        fastModel: settings.fastModel,
        thinkingModel: settings.thinkingModel,
        proModel: settings.proModel,
        providers: sanitizedProviders,
      },
    });
  } catch (error) {
    console.error('Error saving chatbot settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
