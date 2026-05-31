import { z } from 'zod';

export const MCP_SCOPES = {
  TEST_CALCULATE: 'test:calculate',
};

function createMathTool({ name, description, calculate }) {
  return {
    name,
    description,
    schema: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    }),
    async invoke({ a, b }) {
      return JSON.stringify({
        a,
        b,
        result: calculate(a, b),
      });
    },
  };
}

export const MCP_SERVER_DEFINITIONS = [
  {
    key: 'test',
    name: 'Test MCP Server',
    version: '1.0.0',
    description: 'Example MCP server that demonstrates how to register simple tools.',
    defaultScopes: [MCP_SCOPES.TEST_CALCULATE],
    supportedScopes: [MCP_SCOPES.TEST_CALCULATE],
    createTools() {
      return [
        createMathTool({
          name: 'add',
          description: 'Add two numbers and return the result.',
          calculate: (a, b) => a + b,
        }),
        createMathTool({
          name: 'multiply',
          description: 'Multiply two numbers and return the result.',
          calculate: (a, b) => a * b,
        }),
      ];
    },
  },
];
