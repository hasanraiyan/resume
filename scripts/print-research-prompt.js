const { RunnableLambda } = require('@langchain/core/runnables');
const { HumanMessage } = require('@langchain/core/messages');

// Load the markdown format string from the codebase
const { COURSIFY_MARKDOWN_FORMAT } = require('../src/lib/agents/ai/coursify-prompts');

class CustomSafeReactPrompt {
  constructor(templateString) {
    this.templateString = templateString;
    this.inputVariables = ['tools', 'tool_names', 'agent_scratchpad', 'input'];
  }

  async partial(values) {
    let partiallyFormatted = this.templateString;
    if (values.tools !== undefined) {
      partiallyFormatted = partiallyFormatted.replace('{tools}', values.tools);
    }
    if (values.tool_names !== undefined) {
      partiallyFormatted = partiallyFormatted.replace('{tool_names}', values.tool_names);
    }

    const runnable = RunnableLambda.from(async (inputs) => {
      let finalPrompt = partiallyFormatted;
      if (inputs.input !== undefined) {
        finalPrompt = finalPrompt.replace('{input}', inputs.input);
      }
      if (inputs.agent_scratchpad !== undefined) {
        finalPrompt = finalPrompt.replace('{agent_scratchpad}', inputs.agent_scratchpad);
      }
      return [new HumanMessage({ content: finalPrompt })];
    });

    runnable.inputVariables = ['input', 'agent_scratchpad'];
    return runnable;
  }
}

const SYSTEM_PROMPT =
  `You are a Coursify AI Course Content Generator. Your job is to research a topic using web search and video search tools, then generate a response in the strict Coursify markdown block format.

You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

## Response Generation Process (MANDATORY)
1. START your response with a clear, academic # Title header.
2. SEARCH the web using Tavily or YouTube search 2-4 times with specific, distinct queries to gather sufficient context and video content before compiling the results.
3. OUTPUT the full Coursify markdown content inside the "Final Answer" section. Do NOT ask questions.

` + COURSIFY_MARKDOWN_FORMAT;

const REACT_PROMPT = new CustomSafeReactPrompt(
  SYSTEM_PROMPT + `\n\nBegin!\n\nQuestion: {input}\nThought: {agent_scratchpad}`
);

// Define tools
const mockTools = [
  {
    name: 'tavily_search',
    description:
      'A search engine optimized for comprehensive, accurate, and fast results. Useful for when you need to answer questions about current events or gather broad information.',
  },
  {
    name: 'youtube_search',
    description:
      'Search for educational, tutorial, or informational videos on YouTube. Returns video details and thumbnail links.',
  },
];

function renderTextDescription(tools) {
  return tools.map((tool) => `${tool.name}: ${tool.description}`).join('\n');
}

async function main() {
  const topic = process.argv[2] || 'Introduction to Machine Learning';
  const scratchpad =
    process.argv[3] || 'I should search for fundamental machine learning concepts.';

  const toolNames = mockTools.map((t) => t.name);
  const toolsDescription = renderTextDescription(mockTools);

  const partialedPrompt = await REACT_PROMPT.partial({
    tools: toolsDescription,
    tool_names: toolNames.join(', '),
  });

  const formattedPrompt = await partialedPrompt.invoke({
    input: topic,
    agent_scratchpad: scratchpad,
  });

  console.log('='.repeat(80));
  console.log('EXACT FINAL PROMPT SENT TO AI:');
  console.log('='.repeat(80));
  console.log(formattedPrompt[0].content);
  console.log('='.repeat(80));
}

main().catch(console.error);
