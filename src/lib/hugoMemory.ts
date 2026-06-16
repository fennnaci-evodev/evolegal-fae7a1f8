/**
 * Hugo Memory — secure session continuity helpers (client side).
 *
 * Security note:
 *   Browsers do not allow JavaScript to set the HttpOnly attribute on cookies
 *   from the document.cookie API, and our edge functions live on a different
 *   origin than the app shell. So we keep ONLY a non-sensitive session id
 *   here (Secure + SameSite=Strict) and store all real memory in the
 *   database, scoped to the authenticated user via RLS. The cookie is just
 *   a pointer; losing it never leaks legal content.
 */
import { supabase } from "@/integrations/supabase/client";

const COOKIE_NAME = "evolegal_hugo_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function isSecureContext() {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = isSecureContext() ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Strict${secure}`;
}

/** Get or create the persistent recovery session id (cookie). */
export function getOrCreateSessionId(): string {
  let sid = readCookie(COOKIE_NAME);
  if (!sid) {
    sid = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `sid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    writeCookie(COOKIE_NAME, sid);
  } else {
    // Refresh max-age on each visit
    writeCookie(COOKIE_NAME, sid);
  }
  return sid;
}

/** Persist the user's last active chat for cross-device recovery. */
export async function rememberLastChat(userId: string, chatId: string) {
  try {
    const sid = getOrCreateSessionId();
    await supabase
      .from("hugo_session_recovery" as any)
      .upsert(
        {
          session_id: sid,
          user_id: userId,
          last_chat_id: chatId,
          device_label:
            typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : null,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "session_id" } as any,
      );
  } catch (e) {
    // Table may not exist yet (migration pending) — fail silently
    console.debug("rememberLastChat skipped:", e);
  }
}

/** Recover the most recent chat for this user (cookie first, then DB fallback). */
export async function recoverLastChat(userId: string): Promise<string | null> {
  try {
    const sid = getOrCreateSessionId();
    const { data: bySid } = await supabase
      .from("hugo_session_recovery" as any)
      .select("last_chat_id")
      .eq("session_id", sid)
      .eq("user_id", userId)
      .maybeSingle();
    const chatId = (bySid as any)?.last_chat_id;
    if (chatId) return chatId as string;

    // Fallback: latest recovery row for this user (any device)
    const { data: latest } = await supabase
      .from("hugo_session_recovery" as any)
      .select("last_chat_id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return ((latest as any)?.last_chat_id as string) || null;
  } catch {
    return null;
  }
}

/** Clear the recovery cookie (e.g. on sign-out). */
export function clearRecoveryCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Strict${isSecureContext() ? "; Secure" : ""}`;
}
