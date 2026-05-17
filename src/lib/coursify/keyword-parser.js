// Parse [keyword]{def="..."} syntax and extract keyword definitions
const KEYWORD_PATTERN = /\[([^\]]+)\]\{def="([^"]+)"\}/g;

export function parseKeywords(text) {
  const keywords = [];
  let match;

  while ((match = KEYWORD_PATTERN.exec(text)) !== null) {
    keywords.push({
      keyword: match[1],
      definition: match[2],
      fullMatch: match[0],
    });
  }

  return keywords;
}

export function tokenizeWithKeywords(text) {
  const tokens = [];
  let lastIndex = 0;

  let match;
  KEYWORD_PATTERN.lastIndex = 0;

  while ((match = KEYWORD_PATTERN.exec(text)) !== null) {
    // Add text before keyword
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // Add keyword token
    tokens.push({
      type: 'keyword',
      keyword: match[1],
      definition: match[2],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', content: text }];
}

export function replaceKeywordsInText(text, replaceFn) {
  const tokens = tokenizeWithKeywords(text);
  return tokens.map((token) => {
    if (token.type === 'keyword') {
      return replaceFn(token.keyword, token.definition);
    }
    return token.content;
  });
}
