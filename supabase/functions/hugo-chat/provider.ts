import { safeProviderFetch, SafeError } from "../_shared/safety.ts";
/**
 * Provider boundary for Hugo. Callers pass a provider-neutral request and always
 * receive OpenAI-style output (JSON `choices[0].message.content` or SSE
 * `choices[0].delta.content`), so the client parser never changes.
 * Anthropic is used only when HUGO_PROVIDER=anthropic and ANTHROPIC_API_KEY exist.
 */
export type ChatTurn = { role: "user" | "assistant"; content: string };
export type Tier = "fast" | "main";
export interface ProviderRequest {
  tier: Tier;
  system: string;
  messages: ChatTurn[];
  temperature?: number;
  json?: boolean;
  signal?: AbortSignal;
}

const GATEWAY_MODELS: Record<Tier, string> = { fast: "google/gemini-3.1-flash-lite", main: "google/gemini-3-flash-preview" };

export function activeProvider(): "anthropic" | "gateway" {
  return Deno.env.get("HUGO_PROVIDER") === "anthropic" && Deno.env.get("ANTHROPIC_API_KEY") ? "anthropic" : "gateway";
}

function anthropicModel(tier: Tier) {
  return tier === "fast"
    ? Deno.env.get("HUGO_ANTHROPIC_FAST_MODEL") ?? "claude-haiku-4-5"
    : Deno.env.get("HUGO_ANTHROPIC_MODEL") ?? "claude-sonnet-4-5";
}

/** Anthropic requires alternating turns starting with "user". */
export function toAnthropicMessages(messages: ChatTurn[]): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const m of messages) {
    if (!m.content.trim()) continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += `\n\n${m.content}`;
    else out.push({ ...m });
  }
  while (out[0]?.role === "assistant") out.shift();
  return out;
}

function callAnthropic(req: ProviderRequest, stream: boolean) {
  const system = req.json ? `${req.system}\n\nRespond with a single valid JSON object only.` : req.system;
  return safeProviderFetch("anthropic", "https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: req.signal,
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: anthropicModel(req.tier),
      max_tokens: req.tier === "fast" ? 1024 : 4096,
      system,
      messages: toAnthropicMessages(req.messages),
      temperature: req.temperature,
      stream,
    }),
  });
}

function callGateway(req: ProviderRequest, stream: boolean) {
  return safeProviderFetch("gateway", "https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    signal: req.signal,
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GATEWAY_MODELS[req.tier],
      messages: [{ role: "system", content: req.system }, ...req.messages],
      temperature: req.temperature,
      stream,
      ...(req.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
}

export function providerConfigured() {
  return activeProvider() === "anthropic" || Boolean(Deno.env.get("LOVABLE_API_KEY"));
}

/** Non-streaming completion; returns the text or null on failure. */
export async function complete(req: ProviderRequest): Promise<string | null> {
  if (activeProvider() === "anthropic") {
    const r = await callAnthropic(req, false);
    if (!r.ok) { await r.body?.cancel(); return null; }
    const data = await r.json();
    return (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("") || (() => { throw new SafeError(422, "The provider returned no answer or declined the request."); })();
  }
  const r = await callGateway(req, false);
  if (!r.ok) { await r.body?.cancel(); return null; }
  const data = await r.json();
  if (data.choices?.[0]?.message?.refusal || !data.choices?.[0]?.message?.content?.trim()) throw new SafeError(422, "The provider returned no answer or declined the request.");
  return data.choices[0].message.content;
}

/** Converts Anthropic SSE events into OpenAI-style SSE lines. */
export function anthropicToOpenAiSse(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  let buf = "";
  return body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buf += dec.decode(chunk, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(line.slice(5).trim());
          if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: ev.delta.text } }] })}\n\n`));
          } else if (ev.type === "error") {
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: { message: ev.error?.message || "The provider stream failed.", retryable: false } })}\n\n`));
            controller.terminate();
          } else if (ev.type === "message_stop") {
            controller.enqueue(enc.encode("data: [DONE]\n\n"));
          }
        } catch { /* ignore keep-alives */ }
      }
    },
  }));
}

/** Streaming completion; response body is always OpenAI-style SSE. */
export async function stream(req: ProviderRequest): Promise<Response> {
  if (activeProvider() !== "anthropic") return callGateway(req, true);
  const r = await callAnthropic(req, true);
  if (!r.ok || !r.body) return r;
  return new Response(anthropicToOpenAiSse(r.body), { status: 200, headers: { "Content-Type": "text/event-stream" } });
}
