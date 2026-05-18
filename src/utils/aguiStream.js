/**
 * Parse an AG-UI SSE response stream into an async iterable of typed events.
 *
 * AG-UI wire format: one SSE line per event:
 *   data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"m1","delta":"Hello"}\n\n
 */
export async function* parseAGUIStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by \n\n
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? ''; // keep the incomplete trailing chunk

    for (const part of parts) {
      for (const line of part.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const json = trimmed.slice(5).trim();
        if (!json) continue;
        try {
          yield JSON.parse(json);
        } catch {
          // malformed line — skip
        }
      }
    }
  }

  // Flush any remaining buffer content
  for (const line of buffer.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const json = trimmed.slice(5).trim();
    if (!json) continue;
    try {
      yield JSON.parse(json);
    } catch {
      // ignore
    }
  }
}
