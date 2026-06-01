import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import BaseAgent from '../BaseAgent';
import { AGENT_IDS } from '@/lib/constants/agents';

const SYSTEM_PROMPT = `
You are a highly intelligent Coursify Curriculum Planning Assistant.
Your task is to parse a raw text outline, detail description, or lecture notes for a single course section/lecture, and structure it into a clean, educational JSON blueprint.

Your output must be a single, raw JSON object matching the JSON schema below. DO NOT wrap the output in markdown code blocks, do not output preambles, and do not add post-scripts. Output ONLY the raw JSON string.

## JSON Output Schema:
{
  "title": "Section or Lecture Title (extracted from outline or generated as a high-level title)",
  "summary": "A concise, professional summary of what this specific section/lecture covers",
  "learningGoals": [
    "Learning Goal 1 (specific and measurable, starting with action verbs like Analyze, Compute, etc.)",
    "Learning Goal 2 (specific and measurable)",
    "Learning Goal 3 (specific and measurable)",
    "Learning Goal 4 (specific and measurable)",
    "Learning Goal 5 (specific and measurable)"
  ]
}

## Parsing Guidelines:
1. Extract or synthesize a comprehensive, academic title and summary for this section based on the details provided.
2. You MUST generate or synthesize a MINIMUM of 5 distinct, highly specific, and measurable learning goals. Even if the raw section detail only specifies a few or none, expand and subdivide them to achieve at least 5 distinct goals covering the topics (e.g., theoretical understanding, mathematical computation, hands-on application, analysis, and architectural design). Less than 5 goals per section is strictly forbidden.
3. Preserve mathematical notations and LaTeX formatting if present in the source text (e.g. $T(n) = O(n)$, $d_{min} = s + 1$, etc.) exactly as written.
`;

class CoursifySectionPlannerAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.COURSIFY_SECTION_PLANNER, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Coursify Section Planner Agent initialized');
  }

  async _validateInput(input) {
    if (!input?.detail) throw new Error('detail is required');
  }

  async _onExecute(input) {
    const { detail } = input;

    this.logger.info('Starting CoursifySectionPlannerAgent');

    const llm = await this.createChatModel({ temperature: 0.1 });
    this.logger.info(
      `Provider: ${this.config.provider?.name}, Base URL: ${this.config.provider?.baseUrl}, Model: ${this.config.provider?.model || this.config.model}`
    );

    const messages = [
      new SystemMessage({ content: SYSTEM_PROMPT }),
      new HumanMessage({
        content: `Parse the following section details:\n\n${detail}`,
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
      this.logger.error('Failed to parse section JSON output:', parseErr, '\nRaw text was:', text);
      throw new Error('AI returned an invalid JSON response structure for section planning.');
    }

    this.logger.info('Section planning generation completed');

    return { plan: parsed };
  }

  async *_onStreamExecute(input) {
    throw new Error('CoursifySectionPlannerAgent only supports execute');
  }
}

export default CoursifySectionPlannerAgent;
