import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import BaseAgent from '../BaseAgent';
import { AGENT_IDS } from '@/lib/constants/agents';

const SYSTEM_PROMPT = `
You are a highly intelligent Coursify Curriculum Planning Assistant.
Your task is to parse a raw text syllabus or lecture plan for a single course module and structure it into a clean, educational JSON blueprint.

Your output must be a single, raw JSON object matching the JSON schema below. DO NOT wrap the output in markdown code blocks, do not output preambles, and do not add post-scripts. Output ONLY the raw JSON string.

## JSON Output Schema:
{
  "title": "Module Title (extracted from syllabus or generated as a high-level title)",
  "summary": "A concise, professional summary of what this module covers",
  "learningGoals": ["Goal 1", "Goal 2", "Goal 3", "Goal 4", "Goal 5"],
  "sections": [
    {
      "title": "Section or Lecture Title",
      "summary": "Brief summary/description of this section/lecture",
      "learningGoals": [
        "Learning Goal 1 (specific and measurable)",
        "Learning Goal 2 (specific and measurable)",
        "Learning Goal 3 (specific and measurable)",
        "Learning Goal 4 (specific and measurable)",
        "Learning Goal 5 (specific and measurable)"
      ]
    }
  ]
}

## Parsing Guidelines:
1. Extract or synthesize a comprehensive title and summary for the entire module based on the syllabus context.
2. Break down the provided lecture plan into individual sections.
3. For each lecture/section, you MUST generate or synthesize a MINIMUM of 5 distinct, highly specific, and measurable learning goals. Even if the raw syllabus only specifies a few or none, expand and subdivide them to achieve at least 5 distinct goals covering the topics (e.g., theoretical understanding, mathematical computation, hands-on application, analysis, and architectural design). Less than 5 goals per section is strictly forbidden.
4. Preserve mathematical notations and LaTeX formatting if present in the source text (e.g. $T(n) = O(n)$, $d_{min} = s + 1$, etc.) exactly as written.
`;

class CoursifyModulePlannerAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.COURSIFY_MODULE_PLANNER, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Coursify Module Planner Agent initialized');
  }

  async _validateInput(input) {
    if (!input?.syllabus) throw new Error('syllabus is required');
  }

  async _onExecute(input) {
    const { syllabus } = input;

    this.logger.info('Starting CoursifyModulePlannerAgent');

    const llm = await this.createChatModel({ temperature: 0.1 });
    this.logger.info(
      `Provider: ${this.config.provider?.name}, Base URL: ${this.config.provider?.baseUrl}, Model: ${this.config.provider?.model || this.config.model}`
    );

    const messages = [
      new SystemMessage({ content: SYSTEM_PROMPT }),
      new HumanMessage({
        content: `Parse the following syllabus/plan:\n\n${syllabus}`,
      }),
    ];

    const response = await llm.invoke(messages);
    const text = response.content.trim();

    let parsed;
    try {
      let cleaned = text;
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '');
        cleaned = cleaned.replace(/\n```$/, '');
      }
      parsed = JSON.parse(cleaned.trim());
    } catch (parseErr) {
      this.logger.error('Failed to parse syllabus JSON output:', parseErr, '\nRaw text was:', text);
      throw new Error('AI returned an invalid JSON response structure.');
    }

    this.logger.info('Syllabus planning generation completed');

    return { plan: parsed };
  }

  async *_onStreamExecute(input) {
    throw new Error('CoursifyModulePlannerAgent only supports execute');
  }
}

export default CoursifyModulePlannerAgent;
