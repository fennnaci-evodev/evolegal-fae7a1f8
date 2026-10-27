import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { runContractAudit } from "@/lib/contractAuditTransport";
import { normalizeAuditText } from "@/lib/contractAuditInput";
import type { ChatContractAudit } from "@/lib/contractRisk";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useContractAudits(chatId: string | null) {
  const { user } = useAuth();
  const [audits, setAudits] = useState<ChatContractAudit[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const versionRef = useRef(0);
  const [quota, setQuota] = useState<{ used: number; limit: number; unlimited: boolean } | null>(null);
  const refreshQuota = useCallback(async () => {
    if (!user) { setQuota(null); return; }
    const { data } = await supabase.rpc("audit_quota_status");
    const row = Array.isArray(data) ? data[0] : null;
    if (row) setQuota({ used: row.used, limit: row.monthly_limit, unlimited: row.unlimited });
  }, [user?.id]);
  useEffect(() => { void refreshQuota(); }, [refreshQuota]);
  const remaining = quota ? (quota.unlimited ? Infinity : Math.max(0, quota.limit - quota.used)) : null;
  useEffect(() => {
    const version = ++versionRef.current; setAudits([]); setBusy(null);
    controllerRef.current?.abort();
    if (chatId && user) void supabase.from("hugo_contract_audits").select("*").eq("chat_id", chatId).eq("user_id", user.id).order("created_at").then(({ data, error }) => {
      if (version !== versionRef.current) return;
      if (error) toast.error("Could not load saved contract audits. Reopen this conversation.");
      else setAudits((data ?? []) as unknown as ChatContractAudit[]);
    });
    return () => { versionRef.current++; controllerRef.current?.abort(); };
  }, [chatId, user?.id]);
  const run = useCallback(async (id: string, clauseIndex?: number, opts?: { silent?: boolean }): Promise<boolean> => {
    if (controllerRef.current) return false;
    const version = versionRef.current;
    const controller = new AbortController(); controllerRef.current = controller; setBusy(id);
    try {
      const saved = await runContractAudit(id, clauseIndex, controller.signal);
      if (version === versionRef.current) setAudits(prev => prev.map(a => a.id === id ? saved : a));
      if (clauseIndex === undefined && saved?.status === "complete") playChime();
      return true;
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Audit failed.";
      const limited = raw === "Audit Limit Reached";
      const message = limited ? "Monthly audit limit reached. Your 3 free audits renew on the 1st of next month." : raw;
      if (opts?.silent) throw new Error(controller.signal.aborted ? "Contract processing was stopped." : message);
      if (!controller.signal.aborted && version === versionRef.current) {
        if (limited) toast.error("Audit Limit Reached", { description: message }); else toast.error(message);
        if (clauseIndex === undefined) setAudits(prev => prev.map(a => a.id === id ? { ...a, status: "error", error_message: message } : a));
      }
      return false;
    } finally { if (controllerRef.current === controller) { controllerRef.current = null; setBusy(null); } void refreshQuota(); }
  }, [refreshQuota]);
  const attach = useCallback(async (text: string, name: string, cId: string, messageId: string) => {
    if (!user) throw new Error("Please sign in.");
    if (remaining === 0) throw new Error("Audit Limit Reached: your 3 free monthly audits are used. They renew on the 1st of next month.");
    const normalized = normalizeAuditText(text), id = crypto.randomUUID(), path = `${user.id}/${cId}/${id}.txt`;
    const { error: uploadError } = await supabase.storage.from("contract-audits").upload(path, new Blob([normalized], { type: "text/plain" }), { upsert: false });
    if (uploadError) throw new Error("Could not process contract attachment. Please try again.");
    const { data, error } = await supabase.from("hugo_contract_audits").insert({ id, chat_id: cId, user_id: user.id, message_id: messageId, file_name: name.slice(0, 255), file_path: path }).select().single();
    if (error) { await supabase.storage.from("contract-audits").remove([path]); throw new Error("Could not process contract attachment. Please try again."); }
    setAudits(prev => prev.some(a => a.id === id) ? prev : [...prev, data as unknown as ChatContractAudit]);
    try {
      const ok = await run(id, undefined, { silent: true });
      if (!ok) throw new Error("Another audit is still running. Please try again.");
    } catch (err) {
      // Roll back: no orphaned card, record, or stored file remains.
      setAudits(prev => prev.filter(a => a.id !== id));
      await supabase.from("hugo_contract_audits").delete().eq("id", id).eq("user_id", user.id);
      await supabase.storage.from("contract-audits").remove([path]);
      throw err;
    }
  }, [user, run, remaining]);
  return { quota, remaining, audits, busy, attach, run, stop: () => controllerRef.current?.abort() };
}