import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import BaseAgent from '../BaseAgent';
import { AGENT_IDS, getAgentTools } from '@/lib/constants/agents';
import managedToolProvider from '../utils/ManagedToolProvider';

const SYSTEM_PROMPT_TEMPLATE = `
You are a Coursify AI Course Content Generator. Your job is to research a topic using web search and then generate a reponse to user query in the Coursify markdown format.

## Response Generation Process (MANDATORY)
1. START your response with a clear, academic # Title header.
2. SEARCH the web 2-4 times using different specific queries with the **{SEARCH_TOOL}** tool. Use different queries each time for broad coverage.
3. After gathering info, OUTPUT the full Coursify markdown content. Do NOT ask questions.

## Coursify Markdown Format
All content must use ## [BlockType] headers. Generate blocks as required.

### Available Block Types:

**## [MdBlock]**
Primary narrative text. Supports LaTeX math ($O(n \log n)$), markdown tables, and Mermaid diagrams.
\`\`\`mermaid
graph TD
  A --> B
\`\`\`
IMPORTANT: For Mermaid diagrams, use only standard types (graph, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, gantt, pie, journey, gitGraph, mindmap). DO NOT hallucinate custom types like 'grid-layout'. Use markdown tables for grid structures.

**## [StepByStepBlock]**
For processes, algorithms, sequential walkthroughs.
title: "Step Title"
showNumbering: true
- step: "Step Name"
  content: "Step details here. IMPORTANT: Do NOT repeat the 'Step Name' inside this content field. Can include mermaid: \n\`\`\`mermaid\\ngraph LR\\n  A---B\\n\`\`\`"

**## [AccordionBlock]**
For FAQs, edge cases, supplementary info.
title: "Section Title"
- item: "Question or topic"
  content: "Detailed answer... IMPORTANT: Do NOT repeat the 'Question or topic' inside this content field."

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

**## [ResourceBlock]**
For external links, documentation, or further reading.
title: "Resource Title"
url: "https://example.com/docs"
type: "documentation" (options: video, documentation, article, tool, other)

**## [VideoBlock]**
Embed relevant YouTube or educational videos.
title: "Video Title"
url: "https://www.youtube.com/watch?v=..."

## Quality Rules
- MANDATORY: If a [VideoBlock] is included, place it immediately AFTER the first introductory [MdBlock].
- MANDATORY: [VideoBlock] URLs MUST be direct links to a specific video (e.g., https://www.youtube.com/watch?v=...).
- MANDATORY: To find video URLs, you MUST call the **youtube_search** tool. Do NOT try to find videos via {SEARCH_TOOL}.
- FORBIDDEN: Do NOT use YouTube search result URLs (e.g., youtube.com/results?search_query=...). You MUST pick a specific video from tool results.
- MANDATORY: Use at least 5 different block types
- MANDATORY: End with a [QuizBlock] containing 3-5 questions
- MANDATORY: Include at least 2 [CalloutBlock]s (tips, warnings)
- Use [StepByStepBlock] for any process or algorithm
- Use [ChartBlock] when data or comparisons are involved
- Use Mermaid diagrams in [MdBlock]s for visual concepts
- Cover the topic deeply and comprehensively
- Professional, academic tone — no fluff
- Separate each block with ---
- Use $...$ for inline LaTeX and $$...$$ for block/display LaTeX.
- Use only blocks that are necessary for the use case.
- IMPORTANT: ALWAYS perform at least 2 web searches before generating content.
- IMPORTANT: If you need a video, you MUST use the youtube_search tool and select the most relevant video URL from the results.
- DO NOT summarize or talk about your process. Just execute tool calls then output markdown.
- MANDATORY: If a tool is needed, you are failing your job if you don't use it. SEARCH FIRST.
- IMPORTANT: Always perform search first to get accurate up-to-date info.

## Keyword Definitions (Interactive Learning)
- Use [keyword]{def="clear, concise definition"} syntax for important technical terms throughout content
- Keep definitions under 150 characters, plain text only (no markdown formatting)
- Add 3-5 key terms per major section for better learning
- Example: [Algorithm]{def="A step-by-step procedure for solving a problem or performing a computation"}
- Place keywords naturally in sentences where they're first introduced
- DO NOT define common words; focus on domain-specific or technical terms
`;

const REFERENCE_ADDENDUM = `

## Reference System (Wikipedia-style) - MANDATORY
- Use inline citations like [^1], [^2] within the text of ANY block.
- MANDATORY: Every major claim, statistic, or technical detail must be backed by a search result citation.
- MANDATORY: Provide the corresponding footnote definitions ONLY ONCE at the VERY END.
  [^1]: [Source Title](Source URL) - Brief description.`;

const SEARCH_ENGINES = [
  { toolName: 'tavily_search', filterName: 'firecrawl_scrape' },
  { toolName: 'firecrawl_scrape', filterName: 'tavily_search' },
];

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
    const { topic, isReferenceEnabled } = input;

    const topicPreview = topic.substring(0, 50);
    this.logger.info(`Starting CoursifySearchAgent for topic: "${topicPreview}..."`);

    // Randomly pick search engine
    const chosen = SEARCH_ENGINES[Math.floor(Math.random() * SEARCH_ENGINES.length)];
    this.logger.info(`Selected search engine: ${chosen.toolName}`);

    const llm = await this.createChatModel();
    this.logger.debug('Chat model created');

    // Load tools, exclude the non-chosen search engine
    let enabledToolIds = this.config.tools || [];
    if (enabledToolIds.length === 0) {
      enabledToolIds = getAgentTools(this.agentId);
      this.logger.debug(`Using default tools from constants: ${enabledToolIds.join(', ')}`);
    }

    const allTools = await managedToolProvider.getTools(enabledToolIds, this.logger);
    const tools = allTools.filter((t) => t.name !== chosen.filterName);

    this.logger.debug(
      `ReAct agent created with ${tools.length} tools (filtered out: ${chosen.filterName})`
    );
    tools.forEach((tool, idx) => {
      const toolName = tool.name || tool.lc_id?.[tool.lc_id.length - 1] || 'unknown';
      this.logger.debug(`  Tool ${idx + 1}: ${toolName}`);
    });

    // Build prompt from template
    const promptTemplate = PromptTemplate.fromTemplate(SYSTEM_PROMPT_TEMPLATE);
    let systemPrompt = await promptTemplate.format({ SEARCH_TOOL: chosen.toolName });

    if (isReferenceEnabled) {
      systemPrompt += REFERENCE_ADDENDUM;
    }

    const contentMessages = [
      new HumanMessage({ role: 'system', content: systemPrompt }),
      new HumanMessage({
        content: `Research and generate a comprehensive Coursify course section on: "${topic}"\n\nSearch for detailed information first, then write the full Coursify markdown content.`,
      }),
    ];

    const contentAgent = createReactAgent({
      llm,
      tools,
    });

    try {
      const stream = await contentAgent.streamEvents(
        { messages: contentMessages },
        { version: 'v2', runName: `Research: ${topic.substring(0, 30)}` }
      );

      for await (const event of stream) {
        const { event: type, data, name } = event;

        const content = data.chunk?.content || data.chunk?.text || '';

        if (type === 'on_chat_model_stream' && content && name !== 'ChatPromptTemplate') {
          const message = typeof content === 'string' ? content : JSON.stringify(content);
          yield { type: 'content', message };
        } else if (type === 'on_tool_start') {
          yield {
            type: 'tool_call',
            tool: name,
            status: 'started',
            input: data.input,
          };
        } else if (type === 'on_tool_end') {
          yield {
            type: 'tool_call',
            tool: name,
            status: 'completed',
            output: data.output,
          };
          yield {
            type: 'tool_result',
            name: name,
            input: data.input,
            output: data.output,
          };
        } else if (type === 'on_chat_model_start') {
          yield { type: 'status', message: '' };
        } else if (type === 'on_chat_model_end') {
          const usage =
            data.output?.usage_metadata ||
            data.output?.usage ||
            data.output?.response_metadata?.tokenUsage ||
            data.output?.response_metadata?.usage;

          if (usage) {
            yield {
              type: 'usage',
              data: {
                promptTokens:
                  usage.prompt_tokens || usage.promptTokens || usage.promptTokenCount || 0,
                completionTokens:
                  usage.completion_tokens ||
                  usage.completionTokens ||
                  usage.candidatesTokenCount ||
                  0,
                totalTokens: usage.total_tokens || usage.totalTokens || usage.totalTokenCount || 0,
              },
            };
          }
        }
      }
    } catch (err) {
      this.logger.error(`Agent execution failed: ${err.message}`);
      throw err;
    }
  }

  async _onExecute() {
    throw new Error('CoursifySearchAgent only supports streamExecute');
  }
}

export default CoursifySearchAgent;
