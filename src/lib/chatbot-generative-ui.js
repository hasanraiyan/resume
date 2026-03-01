/**
 * @fileoverview Utility to map raw array/object database results
 * from chatbot tool calls into structured, deterministic UI payloads
 * for the frontend to render.
 */

export function getUIBlockForToolResult(toolName, rawResult) {
  let parsedResult = rawResult;

  // LangGraph streams tool outputs as stringified JSON if the tool returns a string.
  // In v2 streamEvents, it might be wrapped in a ToolMessage object where output is in .content
  let targetString = null;

  if (typeof rawResult === 'string') {
    targetString = rawResult;
  } else if (rawResult && typeof rawResult.content === 'string') {
    targetString = rawResult.content;
  }

  if (targetString) {
    try {
      parsedResult = JSON.parse(targetString);
    } catch (e) {
      // If it's a regular string that can't be parsed, it has no UI
      return null;
    }
  }

  // If no result or it's an error object, don't try to render a UI block
  if (!parsedResult || parsedResult.error) {
    return null;
  }

  try {
    switch (toolName) {
      case 'listAllProjects':
        // Expects { data: [{ title, slug, description, category }] }
        if (parsedResult.data && Array.isArray(parsedResult.data)) {
          return {
            component: 'project_list',
            payload: { items: parsedResult.data },
          };
        }
        break;

      case 'getProjectDetails':
        // Expects { data: { title, slug, tags, links, description } }
        if (parsedResult.data) {
          return {
            component: 'project_card',
            payload: parsedResult.data,
          };
        }
        break;

      case 'listAllArticles':
        if (parsedResult.data && Array.isArray(parsedResult.data)) {
          return {
            component: 'article_list',
            payload: { items: parsedResult.data },
          };
        }
        break;

      case 'getArticleDetails':
        if (parsedResult.data) {
          return {
            component: 'article_card',
            payload: parsedResult.data,
          };
        }
        break;

      case 'searchPortfolio':
        if (parsedResult.data && Array.isArray(parsedResult.data)) {
          return {
            component: 'search_results',
            payload: { items: parsedResult.data },
          };
        }
        break;

      case 'draftContactLead':
        if (parsedResult.data) {
          return {
            component: 'contact_prefill',
            payload: parsedResult.data,
          };
        }
        break;
    }
  } catch (err) {
    console.error('[GenUI Mapper] Failed to map tool result:', err);
  }

  return null;
}
