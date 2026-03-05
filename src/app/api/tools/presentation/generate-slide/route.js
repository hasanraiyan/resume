import { NextResponse } from 'next/server';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';

function normalizeSlideResponse(sourceSlide, generatedSlide) {
  const title = generatedSlide?.title || sourceSlide?.title || sourceSlide?.fallbackText || 'Slide';

  return {
    title,
    fallbackText: generatedSlide?.fallbackText || sourceSlide?.fallbackText || title,
    visualPrompt: generatedSlide?.visualPrompt || sourceSlide?.visualPrompt || '',
    prompt: generatedSlide?.prompt || sourceSlide?.prompt || sourceSlide?.visualPrompt || '',
    imageUrl: generatedSlide?.imageUrl || null,
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      slide,
      designSystem,
      slideBrief,
      topic,
      existingSlides = [],
      insertionIndex = 0,
    } = body;

    if (!slide && !slideBrief) {
      return NextResponse.json(
        { error: 'Either slide data or a continuation slide brief is required' },
        { status: 400 }
      );
    }

    if (slide && !slide.visualPrompt) {
      return NextResponse.json({ error: 'Slide visual prompt is required' }, { status: 400 });
    }

    if (!slide && (!topic || !slideBrief?.trim())) {
      return NextResponse.json(
        { error: 'Topic and slide brief are required for continuation slide generation' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Use Presentation Agent
    const presentationAgent = agentRegistry.get(AGENT_IDS.PRESENTATION_SYNTHESIZER);
    const normalizedInsertionIndex = Number.parseInt(insertionIndex, 10);
    const normalizedExistingSlides = Array.isArray(existingSlides) ? existingSlides : [];

    const sourceSlide =
      slide ||
      (await presentationAgent.draftContinuationSlide({
        topic,
        slideBrief: slideBrief.trim(),
        existingSlides: normalizedExistingSlides,
        insertionIndex: Number.isFinite(normalizedInsertionIndex) ? normalizedInsertionIndex : 0,
        designSystem,
      }));

    // Generate single slide visual
    const result = await presentationAgent.generateSlideImage(sourceSlide, designSystem);

    return NextResponse.json({
      success: true,
      slide: normalizeSlideResponse(sourceSlide, result),
    });
  } catch (error) {
    console.error('Slide Generate Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate slide' },
      { status: 500 }
    );
  }
}
