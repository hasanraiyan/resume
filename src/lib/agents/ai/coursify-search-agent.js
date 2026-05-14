import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { TavilySearch } from '@langchain/tavily';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const SYSTEM_PROMPT = `You are a Coursify AI Course Content Generator. Your job is to research a topic using web search and then generate a single, comprehensive, university-level course section in the Coursify markdown format.

## Your Process (MANDATORY)
1. SEARCH the web 2-4 times using different specific queries to gather comprehensive, accurate information about the topic.
2. After searching, OUTPUT the full Coursify markdown content. Do NOT ask questions — just generate immediately.

## Coursify Markdown Format
All content must use \`## [BlockType]\` headers. Generate 10-15 blocks minimum.

### Available Block Types:

**## [MdBlock]**
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
- Never write raw exam tags like [2024 Q3 PYQ]
- Separate each block with ---`;

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

    const llm = await this.createChatModel();

    const searchTool = new TavilySearch({
      maxResults: 6,
      apiKey: process.env.TAVILY_API_KEY,
    });

    const agent = createReactAgent({
      llm,
      tools: [searchTool],
    });

    const messages = [
      new SystemMessage({ content: SYSTEM_PROMPT }),
      new HumanMessage({
        content: `Research and generate a comprehensive Coursify course section on: "${topic}"\n\nSearch for detailed information first, then write the full Coursify markdown content.`,
      }),
    ];

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

    for await (const event of eventStream) {
      const { event: type, data, name } = event;

      if (type === 'on_chat_model_stream' && data.chunk?.content) {
        yield { type: 'content', message: data.chunk.content };
      } else if (type === 'on_tool_start' && name !== 'agent') {
        yield { type: 'status', message: TOOL_STATUS[name] || `🔍 Searching...` };
      } else if (type === 'on_tool_end' && name !== 'agent') {
        yield { type: 'status', message: '✅ Found relevant information, generating content...' };
      }
    }
  }

  async _onExecute() {
    throw new Error('CoursifySearchAgent only supports streamExecute');
  }
}

export default CoursifySearchAgent;
