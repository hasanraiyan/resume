import { HumanMessage, SystemMessage } from '@langchain/core/messages';
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

    // Use local LangChain server (OpenAI-compatible)
    const { ChatOpenAI } = await import('@langchain/openai');
    const llm = new ChatOpenAI({
      modelName: 'antigravity-gemini-3-flash',
      apiKey: 'local-dummy-key',
      configuration: {
        baseURL: 'http://localhost:3001/v1',
      },
    });
    this.logger.debug('Using local LangChain server: http://localhost:3001/v1');

    // Load tools once - pick first instance of each type
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
      // Step 1: Analyze input and generate search queries
      yield { type: 'status', message: 'Analyzing topic and generating search queries...' };

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

      // Step 2: Execute all searches in parallel
      yield { type: 'status', message: 'Searching web and video sources...' };

      // Create search tasks for parallel execution
      const searchTasks = webQueries.slice(0, 3).map((query, idx) => ({
        query,
        tool: tavilyTool,
        toolName: 'tavily_search',
      }));

      // Add YouTube search
      searchTasks.push({
        query: videoQuery,
        tool: youtubeTool,
        toolName: 'youtube_search',
      });

      // Emit all tool_call started events
      for (const task of searchTasks) {
        yield {
          type: 'tool_call',
          tool: task.toolName,
          status: 'started',
          input: { query: task.query },
        };
      }

      // Execute all searches in parallel
      const results = await Promise.allSettled(
        searchTasks.map((task) =>
          task.tool.invoke({ query: task.query }).catch((err) => {
            this.logger.error(`${task.toolName} failed for "${task.query}": ${err.message}`);
            return null;
          })
        )
      );

      // Process results and emit completed events
      const webSearchResults = [];
      let videoSearchResult = null;

      for (let idx = 0; idx < results.length; idx++) {
        const result = results[idx];
        const task = searchTasks[idx];
        if (result.status === 'fulfilled' && result.value) {
          yield {
            type: 'tool_call',
            tool: task.toolName,
            status: 'completed',
            output: result.value?.substring?.(0, 200) || 'Completed',
          };

          if (task.toolName === 'tavily_search') {
            webSearchResults.push({ query: task.query, result: result.value });
          } else if (task.toolName === 'youtube_search') {
            videoSearchResult = result.value;
          }
        } else {
          yield {
            type: 'tool_call',
            tool: task.toolName,
            status: 'failed',
            output: result.reason?.message || 'Failed',
          };
        }
      }

      // Step 3: Combine research into structured context
      yield { type: 'status', message: 'Generating course content...' };

      const researchContext = `
## Web Search Results
${webSearchResults
  .map((item, idx) => `### Query: ${item.query}\n${item.result || 'No results'}`)
  .join('\n\n')}

## YouTube Search Results
${videoSearchResult || 'No video results found'}
`;

      // Step 4: Generate final content with single LLM call
      let systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{researchContext}', researchContext);

      if (isReferenceEnabled) {
        systemPrompt += REFERENCE_ADDENDUM;
      }

      const contentPrompt = await llm.invoke([
        new SystemMessage({ content: systemPrompt }),
        new HumanMessage({
          content: `Research and generate a comprehensive Coursify course section on: "${topic}"\n\nTopic Summary: ${topicSummary || topic}`,
        }),
      ]);

      // Extract and emit title event (first # header)
      const content = contentPrompt.content || contentPrompt.text || '';
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch && titleMatch[1]) {
        yield { type: 'title', text: titleMatch[1].trim() };
      }

      // Stream content
      yield { type: 'content', message: content };

      // Emit tool results for compatibility
      for (const item of webSearchResults) {
        yield {
          type: 'tool_result',
          name: 'tavily_search',
          input: { query: item.query },
          output: item.result,
        };
      }

      if (videoSearchResult) {
        yield {
          type: 'tool_result',
          name: 'youtube_search',
          input: { query: videoQuery },
          output: videoSearchResult,
        };
      }

      // Usage metadata
      const usage =
        contentPrompt?.usage_metadata ||
        contentPrompt?.usage ||
        contentPrompt?.response_metadata?.tokenUsage ||
        contentPrompt?.response_metadata?.usage;

      if (usage) {
        yield {
          type: 'usage',
          data: {
            promptTokens: usage.prompt_tokens || usage.promptTokens || usage.promptTokenCount || 0,
            completionTokens:
              usage.completion_tokens || usage.completionTokens || usage.candidatesTokenCount || 0,
            totalTokens: usage.total_tokens || usage.totalTokens || usage.totalTokenCount || 0,
          },
        };
      }

      yield { type: 'status', message: 'Content generation complete' };
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
