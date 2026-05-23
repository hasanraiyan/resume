export function textResult(text, structuredContent = undefined, extra = {}) {
  const content = [{ type: 'text', text }];
  if (structuredContent) {
    content.push({ type: 'text', text: JSON.stringify(structuredContent, null, 2) });
  }
  return {
    content,
    ...(structuredContent ? { structuredContent } : {}),
    ...extra,
  };
}

export function errorResult(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

export function toolMeta(invoking, invoked, extra = {}) {
  return {
    'openai/toolInvocation/invoking': invoking,
    'openai/toolInvocation/invoked': invoked,
    ...extra,
  };
}

export function normalizeMemory(memory) {
  return {
    id: memory._id?.toString() || memory.id,
    text: memory.text,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}
