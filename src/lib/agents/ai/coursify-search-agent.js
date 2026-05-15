import { AGENT_IDS } from '@/lib/constants/agents'; // trigger rebuild
import BaseAgent from '../BaseAgent';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { TavilySearch } from '@langchain/tavily';
import { youtubeSearch } from '../utils/youtube-tools';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { RunnableParallel, RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const SYSTEM_PROMPT = `
You are a Coursify AI Course Content Generator. Your job is to research a topic using web search and then generate a reponse to user query in the Coursify markdown format.

## Response Generation Process (MANDATORY)
1. SEARCH the web 2-4 times using different specific queries to gather comprehensive information.
2. SEARCH YouTube for educational videos if the topic benefits from visual explanation.
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

**## [StepByStepBlock]**
For processes, algorithms, sequential walkthroughs.
title: "Step Title"
showNumbering: true
- step: "Step Name"
  content: "Step details here. Can include mermaid: \n\`\`\`mermaid\\ngraph LR\\n  A---B\\n\`\`\`"

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
- IMPORTANT: If you need a video, you MUST search YouTube.
- DO NOT summarize or talk about your process. Just execute tool calls then output markdown.
- MANDATORY: If you don't use tools, you are failing your job. SEARCH FIRST.
- IMPORTANT: Always perform search first to get accurate up-to-date info.`;

const TOOL_STATUS = {
  tavily_search: '🔍 Searching the web...',
  youtube_search: '🎥 Searching YouTube for videos...',
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
    const tools = [
      new TavilySearch({ maxResults: 5, apiKey: process.env.TAVILY_API_KEY }),
      youtubeSearch,
    ];
    this.logger.debug('✅ Tools initialized');

    const contentAgent = createReactAgent({
      llm,
      tools,
    });
    this.logger.debug('✅ ReAct agent created');

    const contentMessages = [
      new SystemMessage({ content: SYSTEM_PROMPT }),
      new HumanMessage({
        content: `Research and generate a comprehensive Coursify course section on: "${topic}"\n\nSearch for detailed information first, then write the full Coursify markdown content.`,
      }),
    ];

    // ─── Create parallel execution chain ──────────────────────────────────
    this.logger.info('📡 Starting parallel execution: title + content...');

    // Adapters to extract the right input for each chain from parallel input
    const titleAdapter = new RunnableLambda({
      func: (input) => ({ topic: input.title.topic }),
    });

    const contentAdapter = new RunnableLambda({
      func: (input) => ({ messages: input.content.messages }),
    });

    const parallelChain = RunnableParallel.from({
      title: titleAdapter.pipe(titleChain),
      content: contentAdapter.pipe(contentAgent.withConfig({ runName: 'contentAgent' })),
    });

    // ─── Run title and content truly in parallel ───────────────────────────
    try {
      const parallelStream = await parallelChain.streamEvents(
        {
          title: { topic },
          content: { messages: contentMessages },
        },
        { version: 'v2' }
      );

      let eventCount = 0;
      for await (const event of parallelStream) {
        eventCount++;
        const { event: type, data, name } = event;

        this.logger.debug(`📊 Event #${eventCount}: type="${type}", name="${name}"`);

        // ─── Title chain events ────────────────────────────────────────────
        if (name === 'ChatPromptTemplate' && type === 'on_chain_stream') {
          if (data.chunk?.content) {
            this.logger.debug(`📋 Title chunk: "${data.chunk.content.substring(0, 50)}..."`);
            yield { type: 'title', text: data.chunk.content };
          }
        }

        // ─── Content chain events ──────────────────────────────────────────
        if (
          type === 'on_chat_model_stream' &&
          data.chunk?.content &&
          name !== 'ChatPromptTemplate'
        ) {
          this.logger.debug(`📝 Streaming content: "${data.chunk.content.substring(0, 50)}..."`);
          yield { type: 'content', message: data.chunk.content };
        } else if (type === 'on_tool_start') {
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
        } else if (type === 'on_tool_end') {
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
          // Also yield tool_result for BaseAgent to track stats explicitly
          yield {
            type: 'tool_result',
            name: name,
            output: data.output,
          };
        } else if (type === 'on_chat_model_start') {
          this.logger.debug(`🤖 Chat model starting (${name})`);
          yield { type: 'status', message: '' };
        } else if (type === 'on_chat_model_end') {
          this.logger.debug(`🤖 Chat model ended (${name})`);
          // DEBUG: Log the full output to find usage structure
          this.logger.debug(`   Output Structure: ${Object.keys(data.output || {}).join(', ')}`);
          if (data.output?.response_metadata) {
            this.logger.debug(
              `   Metadata: ${Object.keys(data.output.response_metadata).join(', ')}`
            );
          }

          let usage =
            data.output?.usage ||
            data.output?.response_metadata?.tokenUsage ||
            data.output?.response_metadata?.usage;

          // ─── Token Estimation Fallback ───
          if (!usage && data.output?.content) {
            const charCount =
              typeof data.output.content === 'string' ? data.output.content.length : 0;
            // Rough estimate: 1 token ≈ 4 chars
            const estimatedTokens = Math.ceil(charCount / 4);
            if (estimatedTokens > 0) {
              this.logger.debug(
                `⚠️ No usage from provider. Estimating ${estimatedTokens} tokens from content.`
              );
              usage = {
                prompt_tokens: Math.ceil(estimatedTokens * 0.2), // Assume 20% prompt
                completion_tokens: Math.ceil(estimatedTokens * 0.8),
                total_tokens: estimatedTokens,
              };
            }
          }

          if (usage) {
            const p = usage.prompt_tokens || usage.promptTokens || 0;
            const c = usage.completion_tokens || usage.completionTokens || 0;
            const t = usage.total_tokens || usage.totalTokens || p + c;

            yield {
              type: 'usage',
              data: {
                promptTokens: p,
                completionTokens: c,
                totalTokens: t,
              },
            };
          }
          if (data.output) {
            this.logger.debug(`   Generated: ${JSON.stringify(data.output).substring(0, 100)}`);
          }
        } else if (type === 'on_chain_start') {
          this.logger.info(`⛓️  Chain starting: "${name}"`);
          if (data.input) {
            const inputStr =
              typeof data.input === 'string' ? data.input : JSON.stringify(data.input);
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
    } catch (err) {
      this.logger.error(`❌ Parallel execution failed: ${err.message}`);
      throw err;
    }
  }

  async _onExecute() {
    throw new Error('CoursifySearchAgent only supports streamExecute');
  }
}

export default CoursifySearchAgent;
