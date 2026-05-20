import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { EventType } from '@ag-ui/core';
import BaseAgent from '../BaseAgent';
import { AGENT_IDS } from '@/lib/constants/agents';
import managedToolProvider from '../utils/ManagedToolProvider';
import { COURSIFY_MARKDOWN_FORMAT } from './coursify-prompts';

const ANALYSIS_PROMPT = `
You are a Research Planner. Given a topic, decide whether external research is needed before
generating Coursify course content.

Output ONLY valid JSON with this exact structure:
{
  "researchMode": "none | web | video | both",
  "webQueries": ["query 1", "query 2"],
  "videoQuery": "best search term for YouTube, or empty string",
  "rationale": "short reason for the chosen mode",
  "topicSummary": "one sentence topic overview"
}

Rules:
- Prefer "none" when the topic can be answered from stable general knowledge.
- Use "web" only for current, recent, fast-changing, statistical, legal, product, API, or citation-heavy topics.
- Use "video" only when the user explicitly asks for videos or the topic needs visual demonstration.
- Use "both" only when both web freshness and video discovery are clearly useful.
- If using web, generate 1-3 specific web queries covering different aspects.
- If using video, generate 1 optimized YouTube search query.
- Do not choose external research just because the task is to create course content.
- Be precise and academic in approach.
`;

const RESEARCH_MODES = new Set(['none', 'web', 'video', 'both']);

function normalizeResearchPlan(plan, topic) {
  const researchMode = RESEARCH_MODES.has(plan?.researchMode) ? plan.researchMode : 'none';
  const needsWeb = researchMode === 'web' || researchMode === 'both';
  const needsVideo = researchMode === 'video' || researchMode === 'both';
  const webQueries = needsWeb
    ? (Array.isArray(plan?.webQueries) ? plan.webQueries : [])
        .filter((query) => typeof query === 'string' && query.trim())
        .slice(0, 3)
    : [];
  const videoQuery =
    needsVideo && typeof plan?.videoQuery === 'string' && plan.videoQuery.trim()
      ? plan.videoQuery.trim()
      : '';

  return {
    researchMode,
    needsWeb,
    needsVideo,
    webQueries: needsWeb && webQueries.length > 0 ? webQueries : needsWeb ? [topic] : [],
    videoQuery: needsVideo ? videoQuery || topic : '',
    rationale:
      typeof plan?.rationale === 'string' && plan.rationale.trim()
        ? plan.rationale.trim()
        : 'External research is not required for this topic.',
    topicSummary:
      typeof plan?.topicSummary === 'string' && plan.topicSummary.trim()
        ? plan.topicSummary.trim()
        : topic,
  };
}

function getResearchStepName({ needsWeb, needsVideo }) {
  if (needsWeb && needsVideo) return 'Searching web and video sources...';
  if (needsWeb) return 'Searching web sources...';
  if (needsVideo) return 'Searching video sources...';
  return 'Skipping external search...';
}

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
    const { topic } = input;

    const topicPreview = topic.substring(0, 50);
    this.logger.info(`Starting CoursifyResearchAgent for topic: "${topicPreview}..."`);

    const { ChatOpenAI } = await import('@langchain/openai');
    const llm = new ChatOpenAI({
      modelName: 'antigravity-gemini-3-flash',
      apiKey: 'local-dummy-key',
      configuration: { baseURL: 'http://localhost:3001/v1' },
    });
    this.logger.debug('Using local LangChain server: http://localhost:3001/v1');

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
      let researchPlan = normalizeResearchPlan(null, topic);

      try {
        const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          researchPlan = normalizeResearchPlan(parsed, topic);
        }
      } catch (err) {
        this.logger.error(`Failed to parse analysis result: ${err.message}`);
      }

      const {
        researchMode,
        needsWeb,
        needsVideo,
        webQueries,
        videoQuery,
        rationale,
        topicSummary,
      } = researchPlan;

      this.logger.info(`Analysis complete: ${topicSummary}`);
      this.logger.debug(`Research mode: ${researchMode}`);
      this.logger.debug(`Research rationale: ${rationale}`);
      if (needsWeb) this.logger.debug(`Web queries: ${webQueries.join(', ')}`);
      if (needsVideo) this.logger.debug(`Video query: ${videoQuery}`);

      yield {
        type: EventType.CUSTOM,
        name: 'coursify_research_plan',
        value: {
          mode: researchMode,
          rationale,
          topicSummary,
          webQueries,
          videoQuery,
        },
      };

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
          `Research mode: ${researchMode}`,
          `Reason: ${rationale}`,
          ``,
          ...(needsWeb
            ? [`Web queries:`, ...webQueries.map((q, i) => `  ${i + 1}. ${q}`), ``]
            : []),
          ...(needsVideo ? [`Video query: ${videoQuery}`] : []),
        ].join('\n'),
      };
      yield { type: EventType.REASONING_MESSAGE_END, messageId: reasoningId };
      yield { type: EventType.REASONING_END };

      yield {
        type: EventType.STEP_FINISHED,
        stepName: 'Analyzing topic and generating search queries...',
      };

      // ─── Step 2: Conditional search branch ───
      const searchStepName = getResearchStepName(researchPlan);
      yield { type: EventType.STEP_STARTED, stepName: searchStepName };

      let tavilyTool = null;
      let youtubeTool = null;

      if (needsWeb || needsVideo) {
        const toolIds = [
          ...(needsWeb ? ['tavily_search'] : []),
          ...(needsVideo ? ['youtube_search'] : []),
        ];
        const allTools = await managedToolProvider.getTools(toolIds, this.logger);
        tavilyTool = needsWeb ? allTools.find((t) => t.name === 'tavily_search') : null;
        youtubeTool = needsVideo ? allTools.find((t) => t.name === 'youtube_search') : null;

        if (needsWeb && !tavilyTool) throw new Error('tavily_search tool not found');
        if (needsVideo && !youtubeTool) throw new Error('youtube_search tool not found');

        this.logger.debug(`Tools loaded: ${toolIds.join(', ')}`);
      }

      const searchTasks = [
        ...(needsWeb
          ? webQueries.slice(0, 3).map((query) => ({
              query,
              tool: tavilyTool,
              toolName: 'tavily_search',
            }))
          : []),
        ...(needsVideo
          ? [{ query: videoQuery, tool: youtubeTool, toolName: 'youtube_search' }]
          : []),
      ];

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

      const results =
        taskMeta.length > 0
          ? await Promise.allSettled(
              taskMeta.map((meta) =>
                meta.tool.invoke({ query: meta.query }).catch((err) => {
                  this.logger.error(`${meta.toolName} failed for "${meta.query}": ${err.message}`);
                  return null;
                })
              )
            )
          : [];

      const webSearchResults = [];
      let videoSearchResult = null;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const meta = taskMeta[i];

        yield { type: EventType.TOOL_CALL_END, toolCallId: meta.toolCallId };

        if (result.status === 'fulfilled' && result.value) {
          // TOOL_CALL_RESULT: send structured display payload
          let resultPayload;
          try {
            const val = result.value;
            if (meta.toolName === 'youtube_search') {
              const outputStr = typeof val === 'string' ? val : val?.output || '';
              const videos = typeof outputStr === 'string' ? JSON.parse(outputStr) : outputStr;
              resultPayload = JSON.stringify({
                thumbnails: (Array.isArray(videos) ? videos : []).map((v) => ({
                  thumbnail: v.thumbnail,
                  title: v.title,
                })),
              });
            } else {
              const obj = typeof val === 'object' ? val : JSON.parse(val);
              if (Array.isArray(obj.results)) {
                resultPayload = JSON.stringify({
                  urls: obj.results.map((r) => r.url).filter(Boolean),
                });
              } else {
                resultPayload = JSON.stringify(val).substring(0, 1500);
              }
            }
          } catch {
            const fallback =
              typeof result.value === 'string' ? result.value : JSON.stringify(result.value);
            resultPayload = fallback.substring(0, 1500);
          }
          yield {
            type: EventType.TOOL_CALL_RESULT,
            toolCallId: meta.toolCallId,
            result: resultPayload,
          };

          if (meta.toolName === 'tavily_search') {
            webSearchResults.push({ query: meta.query, result: result.value });
          } else if (meta.toolName === 'youtube_search') {
            videoSearchResult = result.value;
          }
        }
      }

      yield { type: EventType.STEP_FINISHED, stepName: searchStepName };

      // ─── Step 3: Generate content ───
      yield { type: EventType.STEP_STARTED, stepName: 'Generating course content...' };

      const researchContext = `
## Research Plan
Mode: ${researchMode}
Rationale: ${rationale}

## Web Search Results
${
  webSearchResults
    .map((item) => `### Query: ${item.query}\n${item.result || 'No results'}`)
    .join('\n\n') || 'Web search was not used for this topic.'
}

## YouTube Search Results
${videoSearchResult || 'Video search was not used for this topic.'}
`;

      const systemPrompt =
        `
You are a Coursify AI Course Content Generator. Your job is to generate a response to the user query in the Coursify markdown format. Use external research only when it was provided by the planner.

## Research Results (Provided Below)
${researchContext}

## Response Generation Process (MANDATORY)
1. START your response with a clear, academic # Title header.
2. Use the provided research results when available. If search was skipped, rely on stable general knowledge and do not invent citations or sources.
3. OUTPUT the full Coursify markdown content. Do NOT ask questions.
` + COURSIFY_MARKDOWN_FORMAT;

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
