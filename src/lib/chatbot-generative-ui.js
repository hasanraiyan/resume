/**
 * @fileoverview Utility to map raw array/object database results
 * from chatbot tool calls into structured, deterministic UI payloads
 * for the frontend to render.
 */

export function getUIBlockForToolResult(toolName, rawResult) {
  // If no result or it's just an error string/object, don't try to render a UI block
  if (!rawResult || typeof rawResult === 'string' || rawResult.error) {
    return null;
  }

  // The executeToolCall function currently returns markdown strings for everything.
  // To make this work, we need it to return the RAW data, and let the route.js stringify it for the LLM.
  // Because tool execution is currently returning strings, this initial parser attempts to infer block arrays.
  // Note: We'll need to refactor `listAllProjects`, etc., to return { markdown: "...", data: [...] }

  try {
    switch (toolName) {
      case 'listAllProjects':
        // Expects { data: [{ title, slug, description, category }] }
        if (rawResult.data && Array.isArray(rawResult.data)) {
          return {
            component: 'project_list',
            payload: { items: rawResult.data },
          };
        }
        break;

      case 'getProjectDetails':
        // Expects { data: { title, slug, tags, links, description } }
        if (rawResult.data) {
          return {
            component: 'project_card',
            payload: rawResult.data,
          };
        }
        break;

      case 'listAllArticles':
        if (rawResult.data && Array.isArray(rawResult.data)) {
          return {
            component: 'article_list',
            payload: { items: rawResult.data },
          };
        }
        break;

      case 'getArticleDetails':
        if (rawResult.data) {
          return {
            component: 'article_card',
            payload: rawResult.data,
          };
        }
        break;

      case 'searchPortfolio':
        if (rawResult.data && Array.isArray(rawResult.data)) {
          return {
            component: 'search_results',
            payload: { items: rawResult.data },
          };
        }
        break;

      case 'draftContactLead':
        if (rawResult.data) {
          return {
            component: 'contact_prefill',
            payload: rawResult.data,
          };
        }
        break;
    }
  } catch (err) {
    console.error('[GenUI Mapper] Failed to map tool result:', err);
  }

  return null;
}
