import { createClient } from "npm:@supabase/supabase-js@2";
export class SafeError extends Error {
  constructor(public status: number, message: string, public retryable = false) { super(message); }
}
function adminClient() {
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new SafeError(503, "Server configuration unavailable.");
  return createClient(url, key, { auth: { persistSession: false } });
}
export async function requireSession(req: Request, adminOnly = false) {
  if (req.method !== "POST") throw new SafeError(405, "POST required.");
  const token = req.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) throw new SafeError(401, "Please sign in to continue.");
  const admin = adminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) throw new SafeError(401, "Your session has expired. Please sign in again.");
  if (adminOnly) {
    const { data: role, error: roleError } = await admin.from("user_roles").select("id").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
    if (roleError || !role) throw new SafeError(403, "Administrator access required.");
  }
  await consumeRequest(data.user.id, "llm");
  return { admin, user: data.user };
}
export async function consumeRequest(userId: string, bucket: string) {
  const { data, error } = await adminClient().rpc("consume_hugo_request", { p_user: userId, p_bucket: bucket });
  if (error) throw new SafeError(503, "Request limits could not be checked.");
  if (!data) throw new SafeError(429, "Too many requests. Wait one minute before sending another.", true);
}
export async function boundedText(response: Response, limit: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new SafeError(502, "Empty response.");
  let size = 0, text = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new SafeError(413, "Content exceeds the safe size limit.");
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
export async function readJson(req: Request, limit = 160_000): Promise<unknown> {
  try { return JSON.parse(await boundedText(new Response(req.body), limit)); }
  catch (err) { if (err instanceof SafeError) throw err; throw new SafeError(400, "Invalid JSON request."); }
}
/** Persistent circuit: no automated probes after permanent provider/account blocks. */
export async function assertProviderAvailable(provider: string) {
  const { data, error } = await adminClient().from("hugo_provider_state").select("status,message").eq("provider", provider).maybeSingle();
  if (error) throw new SafeError(503, "Provider safety state unavailable.");
  if (data) throw new SafeError(data.status, data.message);
}
export async function blockProvider(provider: string, status: number, message: string) {
  const { error } = await adminClient().from("hugo_provider_state").upsert({ provider, status, message, blocked_at: new Date().toISOString() });
  if (error) throw new SafeError(503, "Could not persist provider pause. Provider access remains unavailable.");
}
const delay = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal?.aborted) { reject(new DOMException("Cancelled", "AbortError")); return; }
  const abort = () => { clearTimeout(timer); reject(new DOMException("Cancelled", "AbortError")); };
  const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, ms);
  signal?.addEventListener("abort", abort, { once: true });
});
/** Only 429 and transient 5xx are retried, at most once, before any streaming bytes. */
export async function safeProviderFetch(provider: string, url: string, init: RequestInit): Promise<Response> {
  await assertProviderAvailable(provider);
  for (let attempt = 0; attempt < 2; attempt++) {
    const signal = init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(75_000)]) : AbortSignal.timeout(75_000);
    let response: Response;
    try { response = await fetch(url, { ...init, signal }); }
    catch { throw new SafeError(504, "The provider connection timed out or failed. Send a fresh request when the connection is stable.", true); }
    if (response.ok) return response;
    let payload: any = {};
    try { payload = JSON.parse(await boundedText(response, 16_384)); } catch { /* safe default */ }
    const message = typeof payload.message === "string" ? payload.message : typeof payload.error?.message === "string" ? payload.error.message : typeof payload.error === "string" ? payload.error : "The provider could not complete this request.";
    const status = response.status;
    const type = payload.type || payload.error?.type;
    const permanent = [401, 402, 403, 404].includes(status) || payload.props?.retryable === false || /account|billing|configuration|quota.*exhausted/i.test(type || "");
    if (permanent) { await blockProvider(provider, status, message); throw new SafeError(status, message); }
    const retryable = status === 429 || status >= 500;
    if (retryable && attempt === 0) {
      const retry = response.headers.get("Retry-After");
      const seconds = retry ? Number(retry) : NaN;
      const wait = retry ? (Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retry) - Date.now()) : 1000 + Math.random() * 500;
      if (wait > 10_000) throw new SafeError(status, message, true);
      await delay(Math.max(1000, wait || 1000), init.signal ?? undefined);
      continue;
    }
    throw new SafeError(status, message, retryable);
  }
  throw new SafeError(503, "Provider unavailable.");
}
