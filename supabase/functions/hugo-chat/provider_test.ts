import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { anthropicToOpenAiSse, toAnthropicMessages } from "./provider.ts";

Deno.test("anthropic turns are merged and start with user", () => {
  const out = toAnthropicMessages([{ role: "assistant", content: "hi" }, { role: "user", content: "a" }, { role: "user", content: "b" }]);
  assertEquals(out, [{ role: "user", content: "a\n\nb" }]);
});

Deno.test("anthropic SSE becomes OpenAI-style deltas", async () => {
  const src = 'event: x\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi"}}\n\ndata: {"type":"message_stop"}\n\n';
  const body = new Response(src).body!;
  const text = await new Response(anthropicToOpenAiSse(body)).text();
  assertEquals(text, 'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\ndata: [DONE]\n\n');
});
