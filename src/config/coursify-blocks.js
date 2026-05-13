/**
 * Coursify Block Configuration
 *
 * Defines the source of truth for supported blocks in the frontend
 * and allowed aliases in the authoring environment (Markdown files).
 */

export const SUPPORTED_BLOCKS = [
  'MdBlock',
  'QuizBlock',
  'VideoBlock',
  'ResourceBlock',
  'StepByStepBlock',
  'AccordionBlock',
];

/**
 * Aliases allow authors to use specialized headers in Markdown files
 * that get transformed into standard blocks during parsing.
 */
export const AUTHORING_ALIASES = {
  MermaidBlock: {
    target: 'MdBlock',
    wrap: (content) => `\`\`\`mermaid\n${content}\n\`\`\``,
  },
  CodeBlock: {
    target: 'MdBlock',
    wrap: (content) => `\`\`\`\n${content}\n\`\`\``,
  },
};

export const ALL_VALID_AUTHORING_BLOCKS = [...SUPPORTED_BLOCKS, ...Object.keys(AUTHORING_ALIASES)];
