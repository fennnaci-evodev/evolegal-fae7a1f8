import { supabase } from "@/integrations/supabase/client";

/** All Hugo requests use the user's session, never the public application key. */
export async function fetchHugo(body: unknown, signal?: AbortSignal): Promise<Response> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Please sign in to continue with Hugo.");
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hugo-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Hugo is temporarily unavailable.");
  }
  return response;
}

export async function fetchHugoReply(message: string): Promise<string> {
  const response = await fetchHugo({ message });
  if (!response.body) throw new Error("No response stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary: number;
      while ((boundary = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 1);
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (json === "[DONE]") continue;
        const event = JSON.parse(json);
        if (event.error) throw new Error(event.error.message || "Hugo could not complete this response.");
        reply += event.choices?.[0]?.delta?.content || "";
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  return reply.replace(/<!--METRICS:.*?-->/s, "").replace(/\[(?:CONSILIUM_ACTIVE|SUGGEST_CONSILIUM|SUGGEST_PRECISE_MODE)\]/g, "").trim();
}