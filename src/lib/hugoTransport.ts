import { supabase } from "@/integrations/supabase/client";
import { readHugoStream } from "@/lib/hugoStream";

export class HugoRequestError extends Error {
  constructor(message: string, public status: number, public retryable: boolean) { super(message); }
}
/** Retries live on the server only; never duplicate a provider attempt from the browser. */
export async function fetchHugo(body: unknown, signal?: AbortSignal): Promise<Response> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new HugoRequestError("Please sign in to continue with Hugo.", 401, false);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hugo-chat`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify(body), signal: controller.signal,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new HugoRequestError(payload?.error?.message || payload?.error || payload?.message || "Hugo is temporarily unavailable.", response.status,
        payload?.retryable !== false && (response.status === 429 || response.status >= 500));
    }
    return response;
  } catch (err) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (err instanceof HugoRequestError) throw err;
    throw new HugoRequestError(controller.signal.aborted ? "Hugo timed out. Check your connection and send a fresh request." : "Could not reach Hugo. Check your connection and send a fresh request.", 0, true);
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
}
export async function fetchHugoReply(message: string): Promise<string> {
  const reply = await readHugoStream(await fetchHugo({ message }));
  return reply.replace(/<!--METRICS:.*?-->/s, "").replace(/\[(?:CONSILIUM_ACTIVE|SUGGEST_CONSILIUM|SUGGEST_PRECISE_MODE)\]/g, "").trim();
}
