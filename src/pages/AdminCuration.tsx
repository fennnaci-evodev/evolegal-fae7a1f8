import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Download, Loader2, RefreshCw, Check, XCircle } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { FEEDBACK_REASONS, toDpoJsonl, toSftJsonl } from "@/lib/curation";

type Row = Tables<"hugo_curation_staging">;
const reasonLabel = (id: string) => FEEDBACK_REASONS.find(r => r.id === id)?.label ?? id;

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/jsonl" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function AdminCuration() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState({ pos: 0, neg: 0, reasons: {} as Record<string, number> });
  const [filter, setFilter] = useState<"pending_review" | "approved" | "rejected">("pending_review");
  const [selectedId, setSelectedId] = useState("");
  const [chosen, setChosen] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("hugo_curation_staging").select("*").order("created_at", { ascending: false }).limit(1000);
    setRows(data ?? []);
    const [{ data: fb }, { data: afb }] = await Promise.all([
      supabase.from("hugo_feedback").select("rating, reasons").limit(5000),
      supabase.from("hugo_audit_feedback").select("rating, reasons").limit(5000),
    ]);
    const all = [...(fb ?? []), ...(afb ?? [])];
    const reasons: Record<string, number> = {};
    all.forEach(f => (f.reasons ?? []).forEach((r: string) => { reasons[r] = (reasons[r] ?? 0) + 1; }));
    setStats({ pos: all.filter(f => f.rating === "positive").length, neg: all.filter(f => f.rating === "negative").length, reasons });
  }, []);
  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);

  const visible = useMemo(() => rows.filter(r => r.status === filter), [rows, filter]);
  const selected = rows.find(r => r.id === selectedId);
  useEffect(() => { setChosen(selected?.chosen ?? ""); setNotes(selected?.reviewer_notes ?? ""); }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stage = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("curate-dataset", { body: {} });
    setBusy(false);
    if (error) { toast.error("Candidates could not be staged."); return; }
    toast.success(`${data.staged} new candidates from ${data.consenting_users} consenting accounts.`);
    void load();
  };
  const review = async (status: "approved" | "rejected") => {
    if (!selected) return;
    setBusy(true);
    const { error } = await supabase.from("hugo_curation_staging").update({ status, chosen: chosen.trim() || null, reviewer_notes: notes.trim() || null }).eq("id", selected.id);
    setBusy(false);
    if (error) { toast.error(error.message.includes("requires") ? error.message : "Review could not be saved."); return; }
    toast.success(status === "approved" ? "Pair approved." : "Pair rejected.");
    setSelectedId(""); void load();
  };

  if (authLoading || roleLoading) return <DashboardLayout><Loader2 className="m-8 h-5 w-5 animate-spin" /></DashboardLayout>;
  if (!user || !isAdmin) return <Navigate to="/dashboard" replace />;
  const approved = rows.filter(r => r.status === "approved");

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="font-display text-2xl font-semibold">Dataset Curation</h1><p className="text-sm text-muted-foreground">Consented, anonymized feedback pairs. Nothing is exported until an expert approves it.</p></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={stage} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Stage Candidates</Button>
            <Button variant="outline" onClick={() => download(toSftJsonl(approved), "hugo-sft.jsonl")} disabled={!approved.some(r => r.track === "sft")}><Download className="h-4 w-4" />SFT JSONL</Button>
            <Button variant="outline" onClick={() => download(toDpoJsonl(approved), "hugo-dpo.jsonl")} disabled={!approved.some(r => r.track === "dpo")}><Download className="h-4 w-4" />DPO JSONL</Button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["Helpful", stats.pos], ["Inaccurate", stats.neg], ["Pending review", rows.filter(r => r.status === "pending_review").length], ["Approved", approved.length]].map(([l, v]) => (
            <div key={l as string} className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="font-display text-2xl font-semibold">{v}</p></div>
          ))}
        </section>
        {Object.keys(stats.reasons).length > 0 && <div className="flex flex-wrap gap-2">{Object.entries(stats.reasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => <Badge key={r} variant="secondary">{reasonLabel(r)} · {n}</Badge>)}</div>}

        <div className="flex gap-2">{(["pending_review", "approved", "rejected"] as const).map(s => <Button key={s} size="sm" variant={filter === s ? "default" : "ghost"} onClick={() => setFilter(s)}>{s.replace("_", " ")}</Button>)}</div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <ul className="max-h-[70vh] space-y-2 overflow-y-auto">
            {visible.length === 0 && <li className="text-sm text-muted-foreground">No items.</li>}
            {visible.map(r => (
              <li key={r.id}><button type="button" onClick={() => setSelectedId(r.id)} className={`w-full rounded-lg border p-3 text-left ${r.id === selectedId ? "border-primary" : "border-border"} bg-card`}>
                <div className="flex gap-2"><Badge variant="outline">{r.track.toUpperCase()}</Badge><Badge variant="secondary">{r.source_kind}</Badge>{r.redactions > 0 && <Badge variant="secondary">{r.redactions} redacted</Badge>}</div>
                <p className="mt-2 line-clamp-2 text-sm">{r.prompt}</p>
              </button></li>
            ))}
          </ul>
          {selected ? (
            <section className="space-y-4 rounded-lg border border-border bg-card p-4">
              <div><h2 className="text-xs font-semibold text-muted-foreground">Prompt (anonymized)</h2><p className="mt-1 whitespace-pre-wrap break-words text-sm">{selected.prompt}</p></div>
              {selected.rejected && <div><h2 className="text-xs font-semibold text-risk-high">Rejected response</h2><p className="mt-1 whitespace-pre-wrap break-words text-sm">{selected.rejected}</p>
                {selected.reasons.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{selected.reasons.map(r => <Badge key={r} variant="outline">{reasonLabel(r)}</Badge>)}</div>}</div>}
              <div><h2 className="text-xs font-semibold text-risk-safe">{selected.track === "dpo" ? "Chosen response (expert-written)" : "Chosen response"}</h2>
                <Textarea className="mt-1 min-h-40" value={chosen} onChange={e => setChosen(e.target.value)} placeholder="Write the corrected reference answer. Avoid personal data." /></div>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reviewer notes (optional)" />
              <p className="text-xs text-muted-foreground">Check that no personal data remains and statutory references are accurate before approving.</p>
              <div className="flex gap-2">
                <Button onClick={() => review("approved")} disabled={busy || !chosen.trim()}><Check className="h-4 w-4" />Approve</Button>
                <Button variant="outline" onClick={() => review("rejected")} disabled={busy}><XCircle className="h-4 w-4" />Reject</Button>
              </div>
            </section>
          ) : <p className="text-sm text-muted-foreground">Select a candidate to review.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
