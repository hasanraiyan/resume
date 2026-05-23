export function textResult(text, data = null) {
  const content = [{ type: 'text', text }];
  if (data) {
    content.push({ type: 'text', text: JSON.stringify(data, null, 2) });
  }
  return { content };
}

export function errorResult(text) {
  return { content: [{ type: 'text', text, isError: true }] };
}

export function toolMeta(loadingMessage, successMessage) {
  return {
    progressMessages: [loadingMessage, successMessage],
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
