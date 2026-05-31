import { z } from 'zod';
import { createAllPocketlyMcpTools } from './pocketly-tools';

export const MCP_SCOPES = {
  TEST_CALCULATE: 'test:calculate',
  POCKETLY_READ: 'pocketly:read',
  POCKETLY_WRITE: 'pocketly:write',
};

export const MCP_SCOPE_DESCRIPTIONS = {
  [MCP_SCOPES.TEST_CALCULATE]: 'Call the add and multiply calculator tools.',
  [MCP_SCOPES.POCKETLY_READ]: 'Read accounts, categories, transactions, and financial analysis.',
  [MCP_SCOPES.POCKETLY_WRITE]: 'Create, update, and delete transactions.',
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
  {
    key: 'pocketly',
    name: 'Pocketly Finance Server',
    version: '1.0.0',
    description:
      'Personal finance tracker — query accounts, categories, transactions, and financial analysis. Create, update, and delete transactions.',
    instructions:
      'Use these tools to query and manage personal financial data. All monetary amounts are plain numbers in INR (e.g., 50.75 = ₹50.75). Always resolve account and category IDs via get_accounts / get_categories before creating or updating transactions — never invent IDs. Transactions can be income, expense, or transfer. Transfers move money between two accounts and do not use a category.',
    defaultScopes: [MCP_SCOPES.POCKETLY_READ],
    supportedScopes: [MCP_SCOPES.POCKETLY_READ, MCP_SCOPES.POCKETLY_WRITE],
    scopeDescriptions: MCP_SCOPE_DESCRIPTIONS,
    createTools({ scopes = [] } = {}) {
      return createAllPocketlyMcpTools({ scopes });
    },
  },
];
