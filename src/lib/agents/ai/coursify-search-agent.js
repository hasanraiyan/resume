import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { TavilySearch } from '@langchain/tavily';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { RunnableParallel, RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const SYSTEM_PROMPT = `
You are a Coursify AI Course Content Generator. Your job is to research a topic using web search and then generate a reponse to user query in the Coursify markdown format.

## Response Generation Process (MANDATORY)
1. SEARCH the web 2-4 times using different specific queries to gather comprehensive, accurate information about the topic.
2. After searching, OUTPUT the full Coursify markdown content. Do NOT ask questions — just generate immediately.

## Coursify Markdown Format
All content must use \`## [BlockType]\` headers. Generate blocks as required.

### Available Block Types:

**## [MdBlock]**
** Heading **
Primary narrative text. Supports LaTeX math ($O(n \\log n)$), markdown tables, Mermaid diagrams.
\`\`\`mermaid
graph TD
  A --> B
\`\`\`

**## [StepByStepBlock]**
For processes, algorithms, sequential walkthroughs.
title: "Step Title"
showNumbering: true
- step: "Step Name"
  content: "Step details here. Can include mermaid: \\n\`\`\`mermaid\\ngraph LR\\n  A---B\\n\`\`\`"

**## [AccordionBlock]**
For FAQs, edge cases, supplementary info.
title: "Section Title"
- item: "Question or topic"
  content: "Detailed answer..."

**## [QuizBlock]**
Multiple choice questions (ALWAYS include at end).
- question: "Question text"
  type: "multiple_choice"
  options:
    - "Option A"
    - "Option B"
    - "Option C"
    - "Option D"
  correctAnswer: "Option A"
  explanation: "Why this is correct."
  points: 1

**## [CalloutBlock]**
Highlighted alert boxes. Types: info (blue), tip (green), warning (yellow), danger (red).
type: "tip"
title: "Pro Tip"
content: "Important thing to remember."

**## [TabsBlock]**
Side-by-side comparison or multi-language examples.
- tab: "JavaScript"
  content: "\`\`\`javascript\\nconsole.log('Hello');\\n\`\`\`"
- tab: "Python"
  content: "\`\`\`python\\nprint('Hello')\\n\`\`\`"

**## [ChartBlock]**
Data visualizations (bar, line, pie, radar, doughnut).
type: "bar"
title: "Chart Title"
description: "Subtitle"
data:
  labels: ["A", "B", "C"]
  datasets:
    - label: "Series 1"
      data: [10, 20, 15]
      color: "#1f644e"
options:
  showLegend: true
  showGrid: true
  beginAtZero: true

## Quality Rules
- MANDATORY: Use at least 5 different block types
- MANDATORY: End with a [QuizBlock] containing 3-5 questions
- MANDATORY: Include at least 2 [CalloutBlock]s (tips, warnings)
- Use [StepByStepBlock] for any process or algorithm
- Use [ChartBlock] when data or comparisons are involved
- Use Mermaid diagrams in [MdBlock]s for visual concepts
- Cover the topic deeply and comprehensively
- Professional, academic tone — no fluff
- Separate each block with ---
- Use only block tht i nceeasayr for the use case okay`;

const TOOL_STATUS = {
  tavily_search: '🔍 Searching the web...',
};

class CoursifySearchAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.COURSIFY_SEARCH, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Coursify Search Agent initialized');
  }

  async _validateInput(input) {
    if (!input?.topic) throw new Error('topic is required');
  }

  async *_onStreamExecute(input) {
    const { topic } = input;

    this.logger.info(`🚀 Starting CoursifySearchAgent for topic: "${topic}"`);

    const llm = await this.createChatModel();
    this.logger.debug('✅ Chat model created');

    // ─── Title Generator (fast, runs in parallel) ───────────────────────
    const titlePrompt = ChatPromptTemplate.fromTemplate(
      `Generate a concise, academic course section title (4-8 words) for: "{topic}"\n\nRespond with ONLY the title, nothing else.`
    );
    const titleChain = titlePrompt.pipe(llm);

    // ─── Content Generator (ReAct agent with search) ───────────────────
    const searchTool = new TavilySearch({
      maxResults: 6,
      apiKey: process.env.TAVILY_API_KEY,
    });
    this.logger.debug('✅ TavilySearch tool initialized');

    const contentAgent = createReactAgent({
      llm,
      tools: [searchTool],
    });
    this.logger.debug('✅ ReAct agent created');

    const contentMessages = [
      new SystemMessage({ content: SYSTEM_PROMPT }),
      new HumanMessage({
        content: `Research and generate a comprehensive Coursify course section on: "${topic}"\n\nSearch for detailed information first, then write the full Coursify markdown content.`,
      }),
    ];

    // ─── Run title and content in parallel ──────────────────────────────
    this.logger.info('📡 Starting parallel execution: title + content...');

    // Title generation (simple, completes fast)
    this.logger.info('📋 Generating title...');
    try {
      const titleStream = await titleChain.stream({ topic });
      let titleText = '';
      for await (const chunk of titleStream) {
        if (chunk.content) {
          titleText += chunk.content;
        }
      }
      const cleanTitle = titleText.trim();
      this.logger.info(`✅ Title generated: "${cleanTitle}"`);
      yield { type: 'title', text: cleanTitle };
    } catch (err) {
      this.logger.warn(`⚠️  Title generation failed: ${err.message}`);
    }

    // Content generation (agent with search)
    this.logger.info('📖 Starting content generation (with search)...');
    const contentEventStream = await contentAgent.streamEvents(
      { messages: contentMessages },
      { version: 'v2' }
    );

    let eventCount = 0;
    for await (const event of contentEventStream) {
      eventCount++;
      const { event: type, data, name } = event;

      this.logger.debug(`📊 Event #${eventCount}: type="${type}", name="${name}"`);

      if (type === 'on_chat_model_stream' && data.chunk?.content) {
        this.logger.debug(`📝 Streaming content: "${data.chunk.content.substring(0, 50)}..."`);
        yield { type: 'content', message: data.chunk.content };
      } else if (type === 'on_tool_start' && name !== 'agent') {
        this.logger.info(`🔧 Tool starting: "${name}"`);
        if (data.input) {
          this.logger.debug(`   Input: ${JSON.stringify(data.input).substring(0, 100)}`);
        }
        yield {
          type: 'tool_call',
          tool: name,
          status: 'started',
          input: data.input,
        };
      } else if (type === 'on_tool_end' && name !== 'agent') {
        this.logger.info(`✅ Tool completed: "${name}"`);
        if (data.output) {
          this.logger.debug(`   Output: ${JSON.stringify(data.output).substring(0, 100)}`);
        }
        yield {
          type: 'tool_call',
          tool: name,
          status: 'completed',
          output: data.output,
        };
      } else if (type === 'on_chat_model_start') {
        this.logger.debug(`🤖 Chat model starting (${name})`);
        yield { type: 'status', message: '' };
      } else if (type === 'on_chat_model_end') {
        this.logger.debug(`🤖 Chat model ended (${name})`);
        if (data.output) {
          this.logger.debug(`   Generated: ${JSON.stringify(data.output).substring(0, 100)}`);
        }
      } else if (type === 'on_chain_start') {
        this.logger.info(`⛓️  Chain starting: "${name}"`);
        if (data.input) {
          const inputStr = typeof data.input === 'string' ? data.input : JSON.stringify(data.input);
          this.logger.debug(`   Input: ${inputStr.substring(0, 100)}`);
        }
      } else if (type === 'on_chain_end') {
        this.logger.info(`⛓️  Chain completed: "${name}"`);
        if (data.output) {
          const outputStr =
            typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
          this.logger.debug(`   Output: ${outputStr.substring(0, 100)}`);
        }
      } else if (type === 'on_chain_stream') {
        this.logger.debug(
          `📡 Chain streaming (${name}): ${JSON.stringify(data).substring(0, 100)}`
        );
      } else if (type === 'on_agent_action') {
        this.logger.info(`⚙️  Agent action: ${JSON.stringify(data).substring(0, 150)}`);
      } else if (type === 'on_agent_finish') {
        this.logger.info(`🏁 Agent finished: ${JSON.stringify(data).substring(0, 150)}`);
      } else {
        this.logger.debug(`❓ Unhandled event type: "${type}"`);
      }
    }

    this.logger.info(`✨ Event stream completed after ${eventCount} events`);
  }

  async _onExecute() {
    throw new Error('CoursifySearchAgent only supports streamExecute');
  }
}

export default CoursifySearchAgent;
