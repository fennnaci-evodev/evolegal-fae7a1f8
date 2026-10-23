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

/** Keep a non-sensitive, owner-specific pointer; chat contents stay in Cloud. */
export async function rememberLastChat(userId: string, chatId: string) {
  try {
    localStorage.setItem(`evolegal_hugo_last_${userId}`, chatId);
  } catch { /* Browser storage can be unavailable. */ }
}

/** Validate the local pointer, then use owned chat history across devices. */
export async function recoverLastChat(userId: string): Promise<string | null> {
  try {
    let pointer: string | null = null;
    try { pointer = localStorage.getItem(`evolegal_hugo_last_${userId}`); } catch { /* Use Cloud history. */ }
    if (pointer) {
      const { data: owned } = await supabase.from("hugo_chats" as any)
        .select("id").eq("id", pointer).eq("user_id", userId).maybeSingle();
      if (owned) return (owned as any).id as string;
    }
    const { data: latest } = await supabase
      .from("hugo_chats" as any)
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return ((latest as any)?.id as string) || null;
  } catch {
    return null;
  }
}

/** Clear the recovery cookie (e.g. on sign-out). */
export function clearRecoveryCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Strict${isSecureContext() ? "; Secure" : ""}`;
}
