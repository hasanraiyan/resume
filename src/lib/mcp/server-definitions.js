import { z } from 'zod';

export const MCP_SCOPES = {
  TEST_CALCULATE: 'test:calculate',
};

export const MCP_SCOPE_DESCRIPTIONS = {
  [MCP_SCOPES.TEST_CALCULATE]: 'Call the add and multiply calculator tools.',
};

const mathInputSchema = z.object({
  a: z.number().describe('First number'),
  b: z.number().describe('Second number'),
});

const mathOutputSchema = z.object({
  a: z.number().describe('First number used in the calculation'),
  b: z.number().describe('Second number used in the calculation'),
  result: z.number().describe('Calculated result'),
});

function createMathTool({ name, title, description, calculate }) {
  return {
    name,
    title,
    description,
    schema: mathInputSchema,
    outputSchema: mathOutputSchema,
    annotations: {
      title,
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke({ a, b }) {
      return {
        a,
        b,
        result: calculate(a, b),
      };
    },
  };
}

export const MCP_SERVER_DEFINITIONS = [
  {
    key: 'test',
    name: 'Test MCP Server',
    version: '1.0.0',
    description: 'Example MCP server that demonstrates how to register simple tools.',
    instructions:
      'Use the calculator tools for deterministic arithmetic only. Results are returned as structured JSON and text.',
    defaultScopes: [MCP_SCOPES.TEST_CALCULATE],
    supportedScopes: [MCP_SCOPES.TEST_CALCULATE],
    scopeDescriptions: MCP_SCOPE_DESCRIPTIONS,
    createTools() {
      return [
        createMathTool({
          name: 'add',
          title: 'Add Numbers',
          description: 'Add two numbers and return the calculation inputs plus the numeric result.',
          calculate: (a, b) => a + b,
        }),
        createMathTool({
          name: 'multiply',
          title: 'Multiply Numbers',
          description:
            'Multiply two numbers and return the calculation inputs plus the numeric result.',
          calculate: (a, b) => a * b,
        }),
      ];
    },
  },
];
