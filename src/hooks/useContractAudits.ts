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
  const run = useCallback(async (id: string, clauseIndex?: number) => {
    if (controllerRef.current) return;
    const version = versionRef.current;
    const controller = new AbortController(); controllerRef.current = controller; setBusy(id);
    try {
      const saved = await runContractAudit(id, clauseIndex, controller.signal);
      if (version === versionRef.current) setAudits(prev => prev.map(a => a.id === id ? saved : a));
    } catch (err) {
      if (!controller.signal.aborted && version === versionRef.current) {
        const message = err instanceof Error ? err.message : "Audit failed.";
        toast.error(message);
        if (clauseIndex === undefined) setAudits(prev => prev.map(a => a.id === id ? { ...a, status: "error", error_message: message } : a));
      }
    } finally { if (controllerRef.current === controller) { controllerRef.current = null; setBusy(null); } }
  }, []);
  const attach = useCallback(async (text: string, name: string, cId: string, messageId: string) => {
    if (!user) throw new Error("Please sign in.");
    const normalized = normalizeAuditText(text), id = crypto.randomUUID(), path = `${user.id}/${cId}/${id}.txt`;
    const { error: uploadError } = await supabase.storage.from("contract-audits").upload(path, new Blob([normalized], { type: "text/plain" }), { upsert: false });
    if (uploadError) throw new Error("Could not save the contract attachment. Try again.");
    const { data, error } = await supabase.from("hugo_contract_audits").insert({ id, chat_id: cId, user_id: user.id, message_id: messageId, file_name: name.slice(0, 255), file_path: path }).select().single();
    if (error) { await supabase.storage.from("contract-audits").remove([path]); throw new Error("Could not save the audit record. Try again."); }
    setAudits(prev => prev.some(a => a.id === id) ? prev : [...prev, data as unknown as ChatContractAudit]);
    await run(id);
  }, [user, run]);
  return { audits, busy, attach, run, stop: () => controllerRef.current?.abort() };
}