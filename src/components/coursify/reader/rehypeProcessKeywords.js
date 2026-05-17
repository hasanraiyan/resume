// Rehype plugin to transform keyword syntax into special elements
export const rehypeProcessKeywords = () => (tree) => {
  const visit = (node) => {
    if (node.type === 'text') {
      // Split text by keyword pattern and return array of nodes
      const KEYWORD_PATTERN = /\[([^\]]+)\]\{def="([^"]+)"\}/g;
      let lastIndex = 0;
      const newNodes = [];
      let match;

      while ((match = KEYWORD_PATTERN.exec(node.value)) !== null) {
        // Add text before keyword
        if (match.index > lastIndex) {
          newNodes.push({
            type: 'text',
            value: node.value.substring(lastIndex, match.index),
          });
        }

        // Add keyword element
        newNodes.push({
          type: 'element',
          tagName: 'keyword',
          properties: {
            keyword: match[1],
            definition: match[2],
          },
          children: [{ type: 'text', value: match[1] }],
        });

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < node.value.length) {
        newNodes.push({
          type: 'text',
          value: node.value.substring(lastIndex),
        });
      }

      // Replace node if we found keywords
      if (newNodes.length > 0) {
        // Find parent and replace this node
        const parent = findParent(tree, node);
        if (parent) {
          const idx = parent.children.indexOf(node);
          if (idx !== -1) {
            parent.children.splice(idx, 1, ...newNodes);
          }
        }
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(visit);
    }
  };

  visit(tree);
};

function findParent(tree, target, parent = null) {
  if (tree === target) return parent;
  if (!tree.children || !Array.isArray(tree.children)) return null;

  for (const child of tree.children) {
    const found = findParent(child, target, tree);
    if (found) return found;
  }

  return null;
}
