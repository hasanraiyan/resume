import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { EventType } from '@ag-ui/core';
import BaseAgent from '../BaseAgent';
import { AGENT_IDS, getAgentTools } from '@/lib/constants/agents';
import managedToolProvider from '../utils/ManagedToolProvider';
import { COURSIFY_MARKDOWN_FORMAT, REFERENCE_ADDENDUM } from './coursify-prompts';

const ANALYSIS_PROMPT = `
You are a Research Query Analyzer. Given a topic, generate specific search queries for web and video research.

Output ONLY valid JSON with this exact structure:
{{
  "webQueries": ["query 1", "query 2", "query 3"],
  "videoQuery": "best search term for YouTube",
  "topicSummary": "one sentence topic overview"
}}

Rules:
- Generate 3 specific web queries covering different aspects
- Generate 1 optimized YouTube search query
- Be precise and academic in approach
`;

const SYSTEM_PROMPT_TEMPLATE =
  `
You are a Coursify AI Course Content Generator. Your job is to research a topic using web search and then generate a response to user query in the Coursify markdown format.

## Research Results (Provided Below)
{researchContext}

## Response Generation Process (MANDATORY)
1. START your response with a clear, academic # Title header.
2. Use the provided research results to generate comprehensive content.
3. OUTPUT the full Coursify markdown content. Do NOT ask questions.
` + COURSIFY_MARKDOWN_FORMAT;

class CoursifyResearchAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.COURSIFY_RESEARCH, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Coursify Research Agent initialized');
  }

  async _validateInput(input) {
    if (!input?.topic) throw new Error('topic is required');
  }

  async *_onStreamExecute(input) {
    const { topic, isReferenceEnabled } = input;

    const topicPreview = topic.substring(0, 50);
    this.logger.info(`Starting CoursifyResearchAgent for topic: "${topicPreview}..."`);

    const { ChatOpenAI } = await import('@langchain/openai');
    const llm = new ChatOpenAI({
      modelName: 'antigravity-gemini-3-flash',
      apiKey: 'local-dummy-key',
      configuration: { baseURL: 'http://localhost:3001/v1' },
    });
    this.logger.debug('Using local LangChain server: http://localhost:3001/v1');

    const allTools = await managedToolProvider.getTools(
      ['tavily_search', 'youtube_search'],
      this.logger
    );
    const tavilyTool = allTools.find((t) => t.name === 'tavily_search');
    const youtubeTool = allTools.find((t) => t.name === 'youtube_search');

    if (!tavilyTool) throw new Error('tavily_search tool not found');
    if (!youtubeTool) throw new Error('youtube_search tool not found');

    this.logger.debug(`Tools loaded: tavily_search, youtube_search`);

    try {
      // ─── Step 1: Analyze topic ───
      yield {
        type: EventType.STEP_STARTED,
        stepName: 'Analyzing topic and generating search queries...',
      };

      const analysisResult = await llm.invoke([
        new SystemMessage({ content: ANALYSIS_PROMPT }),
        new HumanMessage({ content: `Topic: "${topic}"` }),
      ]);

      const analysisContent = analysisResult.content || analysisResult.text || '';
      let webQueries = [topic];
      let videoQuery = topic;
      let topicSummary = topic;

      try {
        const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          webQueries = parsed.webQueries || [topic];
          videoQuery = parsed.videoQuery || topic;
          topicSummary = parsed.topicSummary || topic;
        }
      } catch (err) {
        this.logger.error(`Failed to parse analysis result: ${err.message}`);
      }

      this.logger.info(`Analysis complete: ${topicSummary}`);
      this.logger.debug(`Web queries: ${webQueries.join(', ')}`);
      this.logger.debug(`Video query: ${videoQuery}`);

      // ─── Reasoning: expose the generated plan ───
      const reasoningId = `reasoning-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      yield { type: EventType.REASONING_START };
      yield { type: EventType.REASONING_MESSAGE_START, messageId: reasoningId, role: 'assistant' };
      yield {
        type: EventType.REASONING_MESSAGE_CONTENT,
        messageId: reasoningId,
        delta: [
          `Summary: ${topicSummary}`,
          ``,
          `Web queries:`,
          ...webQueries.map((q, i) => `  ${i + 1}. ${q}`),
          ``,
          `Video: ${videoQuery}`,
        ].join('\n'),
      };
      yield { type: EventType.REASONING_MESSAGE_END, messageId: reasoningId };
      yield { type: EventType.REASONING_END };

      yield {
        type: EventType.STEP_FINISHED,
        stepName: 'Analyzing topic and generating search queries...',
      };

      // ─── Step 2: Parallel searches ───
      yield { type: EventType.STEP_STARTED, stepName: 'Searching web and video sources...' };

      const searchTasks = webQueries.slice(0, 3).map((query) => ({
        query,
        tool: tavilyTool,
        toolName: 'tavily_search',
      }));
      searchTasks.push({ query: videoQuery, tool: youtubeTool, toolName: 'youtube_search' });

      const taskMeta = searchTasks.map((task) => ({
        ...task,
        toolCallId: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      }));

      for (const meta of taskMeta) {
        yield {
          type: EventType.TOOL_CALL_START,
          toolCallId: meta.toolCallId,
          toolCallName: meta.toolName,
        };
        yield {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: meta.toolCallId,
          delta: JSON.stringify({ query: meta.query }),
        };
      }

      const results = await Promise.allSettled(
        taskMeta.map((meta) =>
          meta.tool.invoke({ query: meta.query }).catch((err) => {
            this.logger.error(`${meta.toolName} failed for "${meta.query}": ${err.message}`);
            return null;
          })
        )
      );

      const webSearchResults = [];
      let videoSearchResult = null;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const meta = taskMeta[i];

        yield { type: EventType.TOOL_CALL_END, toolCallId: meta.toolCallId };

        if (result.status === 'fulfilled' && result.value) {
          const resultStr =
            typeof result.value === 'string' ? result.value : JSON.stringify(result.value);

          // TOOL_CALL_RESULT: trimmed excerpt for inline display
          yield {
            type: EventType.TOOL_CALL_RESULT,
            toolCallId: meta.toolCallId,
            result: resultStr.substring(0, 600),
          };

          if (meta.toolName === 'tavily_search') {
            webSearchResults.push({ query: meta.query, result: result.value });
          } else if (meta.toolName === 'youtube_search') {
            videoSearchResult = result.value;
          }
        }
      }

      yield { type: EventType.STEP_FINISHED, stepName: 'Searching web and video sources...' };

      // ─── Step 3: Generate content ───
      yield { type: EventType.STEP_STARTED, stepName: 'Generating course content...' };

      const researchContext = `
## Web Search Results
${webSearchResults
  .map((item) => `### Query: ${item.query}\n${item.result || 'No results'}`)
  .join('\n\n')}

## YouTube Search Results
${videoSearchResult || 'No video results found'}
`;

      let systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{researchContext}', researchContext);
      if (isReferenceEnabled) {
        systemPrompt += REFERENCE_ADDENDUM;
      }

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };

      const stream = await llm.stream([
        new SystemMessage({ content: systemPrompt }),
        new HumanMessage({
          content: `Research and generate a comprehensive Coursify course section on: "${topic}"\n\nTopic Summary: ${topicSummary || topic}`,
        }),
      ]);

      let fullContent = '';
      let titleExtracted = false;

      for await (const chunk of stream) {
        const text = chunk.content || chunk.text || '';
        if (text) {
          fullContent += text;

          if (!titleExtracted) {
            const m = fullContent.match(/^#\s+(.+)$/m);
            if (m) {
              yield {
                type: EventType.CUSTOM,
                name: 'coursify_title',
                value: { text: m[1].trim() },
              };
              titleExtracted = true;
            }
          }

          yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: text };
        }
      }

      yield { type: EventType.TEXT_MESSAGE_END, messageId };

      const lastChunk = stream.response;
      const usage =
        lastChunk?.usage_metadata ||
        lastChunk?.usage ||
        lastChunk?.response_metadata?.tokenUsage ||
        lastChunk?.response_metadata?.usage;

      if (usage) {
        yield {
          type: EventType.CUSTOM,
          name: 'coursify_usage',
          value: {
            promptTokens: usage.prompt_tokens || usage.promptTokens || usage.promptTokenCount || 0,
            completionTokens:
              usage.completion_tokens || usage.completionTokens || usage.candidatesTokenCount || 0,
            totalTokens: usage.total_tokens || usage.totalTokens || usage.totalTokenCount || 0,
          },
        };
      }

      yield { type: EventType.STEP_FINISHED, stepName: 'Generating course content...' };
    } catch (err) {
      this.logger.error(`Agent execution failed: ${err.message}`);
      throw err;
    }
  }

  async _onExecute() {
    throw new Error('CoursifyResearchAgent only supports streamExecute');
  }
}

export default CoursifyResearchAgent;
