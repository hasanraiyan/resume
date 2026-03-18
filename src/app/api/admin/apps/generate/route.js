import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import agentRegistry from '@/lib/agents/AgentRegistry';
import { AGENT_IDS } from '@/lib/constants/agents';

export async function POST(req) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const { name, description, designSchema } = body;

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    // Use the AppBuilderAgent via the registry
    const appBuilder = agentRegistry.get(AGENT_IDS.APP_BUILDER);

    // Execute the LangGraph workflow
    const result = await appBuilder.execute({
      name,
      description,
      designSchema: designSchema || 'modern',
    });

    return NextResponse.json({
      content: result.content,
      todoList: result.todoList,
    });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('AI App Generation Failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate app' }, { status: 500 });
  }
}
