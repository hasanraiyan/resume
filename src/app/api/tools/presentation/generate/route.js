import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import dbConnect from '@/lib/dbConnect';
import ChatbotSettings from '@/models/ChatbotSettings';
import { decrypt } from '@/lib/crypto';
import { RunnableSequence } from '@langchain/core/runnables';

// Define the expected JSON output schema for a presentation
const slideSchema = z.object({
  slides: z.array(
    z.object({
      slideNumber: z.number().describe('The slide number in sequence (1, 2, 3...)'),
      title: z.string().describe('The headline or title of the slide'),
      content: z.string().describe('The main bullet points or text content for the slide'),
      speakerNotes: z.string().describe('Detailed notes for the presenter'),
      imagePrompt: z.string().describe(
        'A highly detailed 7-part image generation prompt based on the "Nano Banana Pro" methodology. It must include: Subject, Composition, Action, Location, Style, Camera/Light, and end with "Aspect Ratio: 16:9 Landscape".'
      ),
    })
  ).describe('An array of presentation slides'),
});

const parser = StructuredOutputParser.fromZodSchema(slideSchema);

export async function POST(request) {
  try {
    const { topic, numSlides = 5 } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'A valid topic is required.' }, { status: 400 });
    }

    // Connect to DB and fetch AI provider settings
    await dbConnect();
    const settings = await ChatbotSettings.findOne({});
    if (!settings || !settings.providers || settings.providers.length === 0) {
      return NextResponse.json({ error: 'AI provider is not configured.' }, { status: 500 });
    }

    // Attempt to find a 'thinking' or 'pro' model, fallback to first available
    let provider = null;
    let selectedModel = null;
    let useGoogle = false;

    // We prefer a Gemini thinking/pro model if available
    for (const p of settings.providers) {
      if (!p.isActive) continue;

      const isGoogle = p.baseUrl?.includes('googleapis') || p.name?.toLowerCase().includes('google');
      if (isGoogle && Array.isArray(p.models)) {
        // Look for thinking/pro models
        const proModel = p.models.find(m => m.toLowerCase().includes('pro') || m.toLowerCase().includes('thinking'));
        if (proModel) {
          provider = p;
          selectedModel = proModel;
          useGoogle = true;
          break;
        }
      }
    }

    // Fallback: Just grab the first active provider and its first model
    if (!provider) {
      provider = settings.providers.find(p => p.isActive);
      if (provider) {
         selectedModel = provider.models?.[0] || 'gpt-4o'; // Assume OpenAI default if empty
         useGoogle = provider.baseUrl?.includes('googleapis') || provider.name?.toLowerCase().includes('google');
      }
    }

    if (!provider || !selectedModel) {
       return NextResponse.json({ error: 'No active AI models found.' }, { status: 500 });
    }

    const apiKey = decrypt(provider.apiKey);

    // Initialize LangChain Chat Model
    let llm;
    if (useGoogle) {
      llm = new ChatGoogleGenerativeAI({
        model: selectedModel.replace(/^models\//, ''),
        apiKey: apiKey,
        temperature: 0.7,
      });
    } else {
      llm = new ChatOpenAI({
        modelName: selectedModel,
        openAIApiKey: apiKey,
        configuration: { baseURL: provider.baseUrl },
        temperature: 0.7,
      });
    }

    // Create the structured extraction chain
    const formatInstructions = parser.getFormatInstructions();

    const promptTemplate = new PromptTemplate({
      template: `You are an expert Presentation Architect utilizing the "Nano Banana Pro" methodology for next-generation slide synthesis.

Your task is to take the following topic/document and extract its "narrative spine" into a highly structured presentation with exactly {numSlides} slides.

Strategic Extraction Vectors:
1. Contextual Extraction: Convert dense technical research into digestible, narrative-driven bullet points.
2. Logical Hierarchy: Autonomously identify headings, subtopics, and "hero" data points.

Image Prompt Generation (The 7-Part Anatomy of a Professional Prompt):
For EVERY slide, you MUST generate a highly descriptive image prompt tailored for an AI image generator. The prompt MUST follow this strict 7-part structure:
1. Subject: Detailed focus of the asset.
2. Composition: Spatial arrangement/framing.
3. Action: Dynamic state or engagement.
4. Location: Setting and environmental context.
5. Style: Visual language and medium.
6. Camera/Light: Lens specifics and light sources.
7. Aspect Ratio: MUST end with "Aspect Ratio: 16:9 Landscape".

Example Image Prompt: "A 40-year-old female surgeon in green scrubs. Rule of thirds, subject positioned far-left. Reviewing a holographic 3D heart model. A high-tech operating suite, midnight blue tones. Editorial photography, high-contrast realism. 35mm lens, f/1.8, cinematic rim lighting. Aspect Ratio: 16:9 Landscape."

Topic / Source Material:
{topic}

{format_instructions}

Please synthesize the presentation now.`,
      inputVariables: ['topic', 'numSlides'],
      partialVariables: { format_instructions: formatInstructions },
    });

    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      parser
    ]);

    const result = await chain.invoke({
      topic: topic,
      numSlides: numSlides,
    });

    return NextResponse.json({ success: true, presentation: result });

  } catch (error) {
    console.error('[Presentation API] Error generating presentation outline:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate presentation' }, { status: 500 });
  }
}
