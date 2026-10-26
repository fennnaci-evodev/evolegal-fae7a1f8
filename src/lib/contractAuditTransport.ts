import { supabase } from "@/integrations/supabase/client";
import type { ChatContractAudit } from "./contractRisk";
export async function runContractAudit(id: string, clauseIndex?: number, signal?: AbortSignal): Promise<ChatContractAudit> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Please sign in to audit a contract.");
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contract-audit`, {
    method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ audit_id: id, action: clauseIndex === undefined ? "analyze" : "redline", ...(clauseIndex === undefined ? {} : { clause_index: clauseIndex }) }), signal,
  });
  if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || "Unable to start the audit."); }
  if (response.headers.get("content-type")?.includes("application/json")) return response.json();
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The audit returned no response.");
  const decoder = new TextDecoder(); let buffer = "";
  try {
    while (true) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const chunk = await Promise.race([reader.read(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Audit connection interrupted. Start a fresh request.")), 45000); })]).finally(() => clearTimeout(timer));
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      if (buffer.length > 200000) throw new Error("Audit response exceeded the safe limit.");
      let end;
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end).trim(); buffer = buffer.slice(end + 1);
        if (!line.startsWith("data:")) continue;
        const event = JSON.parse(line.slice(5));
        if (event.error) throw new Error(event.error);
        if (event.audit) return event.audit;
      }
      if (chunk.done) throw new Error("Audit interrupted; no completed results received. Reopen this chat to check saved results.");
    }
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}