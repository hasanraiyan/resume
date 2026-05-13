/**
 * Utility to extract clean, speakable text from Coursify blocks.
 */

/**
 * Strips basic Markdown syntax to provide cleaner text for TTS.
 */
export function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep link text, remove URL
    .replace(/#{1,6}\s*(.*)/g, '$1') // Remove headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/>\s*(.*)/g, '$1') // Remove blockquotes
    .replace(/[-*+]\s+(.*)/g, '$1') // Remove list markers
    .replace(/\d+\.\s+(.*)/g, '$1') // Remove numbered list markers
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
}

/**
 * Converts structured blocks into a linear sequence of 'speakable' text segments.
 */
export function extractSpeakableSegments(blocks) {
  if (!blocks || !Array.isArray(blocks)) return [];

  const segments = [];

  blocks.forEach((block) => {
    switch (block.type) {
      case 'MdBlock':
        if (block.content) {
          const clean = stripMarkdown(block.content);
          if (clean) segments.push(clean);
        }
        break;

      case 'CalloutBlock':
        if (block.title) segments.push(block.title);
        if (block.content) {
          const clean = stripMarkdown(block.content);
          if (clean) segments.push(clean);
        }
        break;

      case 'StepByStepBlock':
        if (block.title) segments.push(block.title);
        (block.steps || []).forEach((step, idx) => {
          if (block.showNumbering !== false) {
            segments.push(`Step ${idx + 1}`);
          }
          if (step.title) segments.push(step.title);
          if (step.content) {
            const clean = stripMarkdown(step.content);
            if (clean) segments.push(clean);
          }
        });
        break;

      case 'AccordionBlock':
        if (block.title) segments.push(block.title);
        (block.items || []).forEach((item) => {
          if (item.title) segments.push(item.title);
          if (item.content) {
            const clean = stripMarkdown(item.content);
            if (clean) segments.push(clean);
          }
        });
        break;

      case 'TabsBlock':
        (block.tabs || []).forEach((tab) => {
          if (tab.title) segments.push(`Tab: ${tab.title}`);
          if (tab.content) {
            const clean = stripMarkdown(tab.content);
            if (clean) segments.push(clean);
          }
        });
        break;

      default:
        // Skip VideoBlock, QuizBlock, ResourceBlock etc.
        break;
    }
  });

  return segments;
}
