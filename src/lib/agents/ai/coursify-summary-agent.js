import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import BaseAgent from '../BaseAgent';
import { AGENT_IDS } from '@/lib/constants/agents';

const SYSTEM_PROMPT = `
You are a Coursify Content Summarizer. Your job is to generate a concise summary of an article.

## Instructions
- Read the full article content carefully
- Write ONE short paragraph (1-2 sentences) capturing the core topic
- Then list 3-5 bullet points of the key takeaways
- Use clear, simple language
- Focus on WHAT was covered, not HOW it was generated
- Do NOT include meta-commentary about the content format or structure
- Keep the entire summary under 100 words
- DO NOT ask questions or add fluff
- Output ONLY the summary text, nothing else

## Math & LaTeX Rules (IMPORTANT)
- If the source material contains mathematical notation, equations, recurrences, complexity expressions, formulas, or symbols (e.g. T(n), O(n log n), Σ, integrals, etc.), you MUST preserve them using proper LaTeX delimiters:
  - Inline math: $...$   (example: $T(n) = T(n-1) + n$)
  - Display math (rarely needed in summaries): $$...$$
- NEVER output raw math without the dollar signs.
- Never escape the dollar signs.
- When in doubt, wrap any technical/math expression in $...$.
`;

class CoursifySummaryAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.COURSIFY_SUMMARY, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Coursify Summary Agent initialized');
  }

  async _validateInput(input) {
    if (!input?.content) throw new Error('content is required');
  }

  async _onExecute(input) {
    const { content } = input;

    this.logger.info('Starting CoursifySummaryAgent');

    const llm = await this.createChatModel();
    this.logger.info(
      `Provider: ${this.config.provider?.name}, Base URL: ${this.config.provider?.baseUrl}, Model: ${this.config.provider?.model || this.config.model}`
    );

    const messages = [
      new SystemMessage({ content: SYSTEM_PROMPT }),
      new HumanMessage({
        content: `Summarize the following Coursify course content:\n\n${content}`,
      }),
    ];

    const response = await llm.invoke(messages);

    const summary = response.content.trim();

    this.logger.info('Summary generation completed');

    return { summary };
  }

  async *_onStreamExecute(input) {
    throw new Error('CoursifySummaryAgent only supports execute');
  }
}

export default CoursifySummaryAgent;
