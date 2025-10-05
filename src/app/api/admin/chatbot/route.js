import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import ChatbotSettings from '../../../../models/ChatbotSettings';

// GET - Fetch current chatbot settings
export async function GET() {
  try {
    await dbConnect();

    let settings = await ChatbotSettings.findOne({});

    if (!settings) {
      // Create default settings if none exist
      settings = new ChatbotSettings({});
      await settings.save();
    }

    return NextResponse.json({
      aiName: settings.aiName,
      persona: settings.persona,
      baseKnowledge: settings.baseKnowledge,
      servicesOffered: settings.servicesOffered,
      callToAction: settings.callToAction,
      rules: settings.rules,
      isActive: settings.isActive
    });
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update chatbot settings
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      aiName,
      persona,
      baseKnowledge,
      servicesOffered,
      callToAction,
      rules,
      isActive
    } = body;

    // Validate required fields
    if (!aiName || !persona || !baseKnowledge || !servicesOffered || !callToAction) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Filter out empty rules
    const filteredRules = rules.filter(rule => rule.trim() !== '');

    // Find existing settings or create new one
    let settings = await ChatbotSettings.findOne({});

    if (settings) {
      // Update existing settings
      settings.aiName = aiName;
      settings.persona = persona;
      settings.baseKnowledge = baseKnowledge;
      settings.servicesOffered = servicesOffered;
      settings.callToAction = callToAction;
      settings.rules = filteredRules;
      settings.isActive = isActive !== undefined ? isActive : true;

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
        isActive: isActive !== undefined ? isActive : true
      });

      await settings.save();
    }

    return NextResponse.json({
      message: 'Chatbot settings saved successfully',
      settings: {
        aiName: settings.aiName,
        persona: settings.persona,
        baseKnowledge: settings.baseKnowledge,
        servicesOffered: settings.servicesOffered,
        callToAction: settings.callToAction,
        rules: settings.rules,
        isActive: settings.isActive
      }
    });
  } catch (error) {
    console.error('Error saving chatbot settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
