/** A single bounded SSE reader for every Hugo surface. Never replay partial output. */
export class HugoStreamError extends Error {
  constructor(message: string, public retryable = false) { super(message); this.name = "HugoStreamError"; }
}
export async function readHugoStream(response: Response, onText?: (text: string) => void, signal?: AbortSignal, idleMs = 45_000): Promise<string> {
  if (!response.body) throw new HugoStreamError("Hugo returned no response. Send a new request.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", text = "", completed = false;
  const abort = () => { void reader.cancel(); };
  signal?.addEventListener("abort", abort, { once: true });
  const consume = (line: string) => {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (payload === "[DONE]") { completed = true; return; }
    if (!payload) return;
    let event;
    try { event = JSON.parse(payload); } catch { throw new HugoStreamError("Hugo returned an unreadable response. Send a new request."); }
    if (event.error) throw new HugoStreamError(typeof event.error === "string" ? event.error : event.error.message || "Hugo could not complete this response.", event.error.retryable === true);
    const choice = event.choices?.[0];
    if (choice?.delta?.refusal || choice?.finish_reason === "content_filter") throw new HugoStreamError("The provider declined this request.");
    const content = choice?.delta?.content;
    if (typeof content === "string") { text += content; onText?.(text); }
    if (text.length > 200_000) throw new HugoStreamError("Hugo's response exceeded the safe size limit.");
  };
  try {
    while (!completed) {
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      let timer: ReturnType<typeof setTimeout> | undefined;
      const chunk = await Promise.race([reader.read(), new Promise<never>((_, reject) => {
        timer = setTimeout(() => { reject(new HugoStreamError("Hugo stopped responding. Send a new request when the connection is stable.", true)); void reader.cancel(); }, idleMs);
      })]).finally(() => clearTimeout(timer));
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      buffer += chunk.done ? decoder.decode() : decoder.decode(chunk.value, { stream: true });
      if (buffer.length > 200_000) throw new HugoStreamError("Hugo returned an oversized stream event.");
      let end;
      while ((end = buffer.indexOf("\n")) >= 0 && !completed) { const line = buffer.slice(0, end).trimEnd(); buffer = buffer.slice(end + 1); consume(line); }
      if (chunk.done) { if (buffer.trim()) consume(buffer.trimEnd()); break; }
    }
    if (!completed) throw new HugoStreamError("Hugo's reply was interrupted. It has not been saved as a completed answer.", true);
    if (!text.trim()) throw new HugoStreamError("The provider returned no answer. Start a fresh request.");
    return text;
  } finally { signal?.removeEventListener("abort", abort); await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
