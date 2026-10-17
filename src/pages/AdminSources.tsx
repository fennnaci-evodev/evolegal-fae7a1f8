import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { BookOpenCheck, ExternalLink, RefreshCw, Search, ShieldCheck, XCircle, Check, Loader2, ArrowRight, History, FileDiff } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { canApproveSource, emptyChecks, REVIEW_CHECKS, sourceDiff } from "@/lib/sourceReview";

type Source = Tables<"hugo_knowledge_sources">;
type Change = Tables<"hugo_source_changes">;
type Review = Tables<"hugo_source_reviews">;
const dateOnly = (value: string | null) => value?.slice(0, 10) ?? "";
const stamp = (value: string | null) => value ? new Date(value).toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC" : "Not recorded";
const iso = (value: string) => value ? new Date(value + "T00:00:00Z").toISOString() : null;

export default function AdminSources() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [changes, setChanges] = useState<Change[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [changeId, setChangeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [step, setStep] = useState("diff");
  const [checks, setChecks] = useState(emptyChecks);
  const [excerpt, setExcerpt] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [topic, setTopic] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const selected = sources.find(s => s.id === selectedId);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const { data, error: err } = await supabase.from("hugo_knowledge_sources").select("*").order("title").limit(1000);
    if (err) setError("Sources could not be loaded. Please retry.");
    else { setSources(data ?? []); setSelectedId(id => id || data?.[0]?.id || ""); }
    setLoading(false);
  }, []);
  useEffect(() => { if (!authLoading && !roleLoading && isAdmin) void load(); }, [authLoading, roleLoading, isAdmin, load]);
  useEffect(() => {
    if (!selected) return;
    setChecks(emptyChecks()); setExcerpt(selected.excerpt.startsWith("Pending reviewer") ? "" : selected.excerpt);
    setJurisdiction(selected.jurisdiction); setTopic(selected.topic); setFrom(dateOnly(selected.effective_from));
    setUntil(dateOnly(selected.effective_until)); setDue(dateOnly(selected.review_due_at)); setNotes(""); setStep("diff");
    setChanges([]); setReviews([]); setChangeId(""); setDetailLoading(true);
    let cancelled = false;
    void Promise.all([
      supabase.from("hugo_source_changes").select("*").eq("source_id", selected.id).order("detected_at", { ascending: false }).limit(100),
      supabase.from("hugo_source_reviews").select("*").eq("source_id", selected.id).order("reviewed_at", { ascending: false }).limit(100),
    ]).then(([c, r]) => {
      if (cancelled) return;
      if (c.error || r.error) setError("Review history could not be loaded. Please retry.");
      else { setChanges(c.data ?? []); setReviews(r.data ?? []); setChangeId(c.data?.[0]?.id ?? ""); }
      setDetailLoading(false);
    });
    return () => { cancelled = true; };
  }, [selected]);
  const change = changes.find(c => c.id === changeId);
  const diff = useMemo(() => sourceDiff(change?.previous_text ?? "", change?.new_text ?? selected?.monitored_text ?? ""), [change, selected?.monitored_text]);
  const visible = sources.filter(s => (filter === "all" || s.status === filter) && `${s.title} ${s.jurisdiction} ${s.topic}`.toLowerCase().includes(search.toLowerCase()));
  const ready = Boolean(selected && canApproveSource(checks, excerpt, notes, selected.content_hash, due) && from && Date.parse(from) <= Date.now() && (!until || Date.parse(until) > Date.now()) && jurisdiction.trim() && topic.trim() && ["baseline", "current", "changed_needs_review"].includes(selected.check_status));
  const decide = async (decision: "approved" | "rejected") => {
    if (!selected || !user || busy) return;
    setBusy(true);
    const { error: err } = await supabase.rpc("review_hugo_source", {
      p_source_id: selected.id, p_expected_updated_at: selected.updated_at, p_expected_hash: selected.content_hash,
      p_decision: decision, p_excerpt: excerpt, p_jurisdiction: jurisdiction, p_topic: topic,
      p_effective_from: iso(from), p_effective_until: iso(until), p_review_due_at: iso(due),
      p_checks: checks, p_notes: notes,
    });
    setBusy(false);
    if (err) { toast.error(err.message); return; }
    toast.success(decision === "approved" ? "Source approved. Review recorded." : "Source rejected. Review recorded.");
    await load();
  };
  const monitor = async () => {
    setBusy(true);
    const { data, error: err } = await supabase.functions.invoke("hugo-source-monitor", { body: { analyse_impact: false } });
    setBusy(false);
    if (err) toast.error("Official-source check failed. Please retry.");
    else toast.success(`Checked ${data?.checked ?? 0} sources. ${data?.report?.filter((r: { result: string }) => r.result === "unreachable").length ?? 0} unreachable.`);
    await load();
  };
  if (authLoading || roleLoading) return <div className="p-8 text-muted-foreground">Verifying access…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <DashboardLayout>
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div><div className="mb-2 flex items-center gap-2 text-xs text-primary"><BookOpenCheck className="h-4 w-4" /> KNOWLEDGE GOVERNANCE</div><h1 className="text-2xl font-semibold">Source verification</h1><p className="mt-2 text-sm text-muted-foreground">{sources.filter(s => s.status === "draft").length} awaiting review · {sources.filter(s => s.status === "approved").length} approved</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || loading} onClick={load}><RefreshCw />Refresh</Button><Button variant="outline" disabled={busy || loading} onClick={monitor}>{busy ? <Loader2 className="animate-spin" /> : <Search />}Check official texts</Button></div>
      </header>
      {error && <div role="alert" className="border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}<Button variant="link" onClick={load}>Retry</Button></div>}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4 xl:border-r xl:border-border/50 xl:pr-5">
          <Input aria-label="Search sources" placeholder="Search sources" value={search} onChange={e => setSearch(e.target.value)} />
          <Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Source status"><SelectValue /></SelectTrigger><SelectContent>{["all", "draft", "approved", "rejected", "retired"].map(s => <SelectItem key={s} value={s}>{s === "all" ? "All sources" : s[0].toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select>
          <div className="max-h-[65vh] space-y-1 overflow-auto">
            {loading ? <p className="p-4 text-sm text-muted-foreground">Loading sources…</p> : visible.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No matching sources.</p> : visible.map(s => <Button key={s.id} variant="ghost" onClick={() => setSelectedId(s.id)} className={`h-auto w-full justify-start whitespace-normal rounded-lg px-3 py-4 text-left ${s.id === selectedId ? "bg-primary/10 text-foreground" : ""}`}><span className="min-w-0"><span className="block text-sm leading-relaxed">{s.title}</span><span className="mt-2 block text-xs text-muted-foreground">{s.jurisdiction} · {s.status}{s.review_due_at && Date.parse(s.review_due_at) <= Date.now() ? " · Review expired" : ""}</span></span></Button>)}
          </div>
        </aside>
        {selected && <section className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-xl font-medium leading-relaxed">{selected.title}</h2><p className="mt-1 text-xs text-muted-foreground">Last checked: {stamp(selected.last_checked_at)} · {selected.check_status.replaceAll("_", " ")}</p></div><Badge variant="outline" className="capitalize">{selected.status}</Badge></div>
          <a href={selected.source_url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 break-all text-sm text-primary"><ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />{selected.source_url}</a>
          <Tabs value={step} onValueChange={setStep}>
            <TabsList className="grid h-auto w-full grid-cols-3"><TabsTrigger value="diff" className="gap-1 px-1 py-2 text-xs sm:text-sm"><FileDiff className="h-4 w-4" />1. Changes</TabsTrigger><TabsTrigger value="legal" className="gap-1 px-1 py-2 text-xs sm:text-sm"><ShieldCheck className="h-4 w-4" />2. Legal review</TabsTrigger><TabsTrigger value="decision" className="gap-1 px-1 py-2 text-xs sm:text-sm"><Check className="h-4 w-4" />3. Decision</TabsTrigger></TabsList>
            <TabsContent value="diff" className="space-y-5 pt-4">
              {detailLoading ? <p className="text-muted-foreground">Loading change history…</p> : <>
                {changes.length > 0 && <Select value={changeId} onValueChange={setChangeId}><SelectTrigger aria-label="Select change"><SelectValue /></SelectTrigger><SelectContent>{changes.map(c => <SelectItem key={c.id} value={c.id}>{stamp(c.detected_at)} · {c.change_kind.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select>}
                <div className="flex flex-wrap gap-4 text-xs"><span className="text-destructive">− Removed</span><span className="text-primary">+ Added</span><span className="text-muted-foreground">Unapplied effects: {change ? `${change.previous_unapplied ?? "Unknown"} → ${change.new_unapplied ?? "Unknown"}` : selected.unapplied_effects ?? "Unknown"}</span></div>
                {change && (!change.previous_text || !change.new_text) && <p role="status" className="border-l-2 border-accent pl-3 text-sm text-muted-foreground">Historical text snapshots unavailable for this change. Compare the official source manually.</p>}
                <div aria-label="Official text comparison" className="max-h-[500px] overflow-auto rounded-lg border border-border bg-muted/20 p-5 text-sm leading-7 [overflow-wrap:anywhere]">{diff.some(p => p.value) ? diff.map((p, i) => p.added ? <ins key={i} className="bg-primary/10 text-primary no-underline">{p.value}</ins> : p.removed ? <del key={i} className="bg-destructive/10 text-destructive">{p.value}</del> : <span key={i}>{p.value}</span>) : <span className="text-muted-foreground">No official text snapshot yet.</span>}</div>
                {change?.impact_analysis && <div className="space-y-2 border-l-2 border-accent pl-4"><h3 className="text-sm font-medium">Impact note · {change.analysis_status}</h3><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{change.impact_analysis}</p></div>}
                <Button variant="outline" onClick={() => setStep("legal")}>Review legal details<ArrowRight /></Button>
              </>}
            </TabsContent>
            <TabsContent value="legal" className="space-y-6 pt-4">
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="jurisdiction">Exact jurisdiction</Label><Input id="jurisdiction" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="topic">Topic</Label><Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} /></div></div>
              <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="effective-from">Effective from (UTC)</Label><Input id="effective-from" type="date" value={from} onChange={e => setFrom(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="effective-until">Effective until (optional)</Label><Input id="effective-until" type="date" value={until} onChange={e => setUntil(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="review-due">Next review due (UTC)</Label><Input id="review-due" type="date" value={due} onChange={e => setDue(e.target.value)} /></div></div>
              <div className="space-y-2"><Label htmlFor="excerpt">Reviewed legal excerpt</Label><Textarea id="excerpt" className="min-h-[200px] leading-7" value={excerpt} onChange={e => setExcerpt(e.target.value)} /></div>
              <fieldset className="space-y-4 border-t border-border/50 pt-5"><legend className="text-sm font-medium">Legal verification</legend>{REVIEW_CHECKS.map(({ key, label }) => <label key={key} className="flex cursor-pointer items-start gap-3 text-sm leading-6"><Checkbox checked={checks[key]} onCheckedChange={v => setChecks(c => ({ ...c, [key]: v === true }))} className="mt-1" aria-label={label} /><span>{label}</span></label>)}</fieldset>
              <Button variant="outline" onClick={() => setStep("decision")}>Review decision<ArrowRight /></Button>
            </TabsContent>
            <TabsContent value="decision" className="space-y-6 pt-4">
              <div className="space-y-2"><Label htmlFor="review-notes">Review rationale and legal impact</Label><Textarea id="review-notes" className="min-h-[160px] leading-7" value={notes} onChange={e => setNotes(e.target.value)} /></div>
              <dl className="grid gap-4 border-y border-border/50 py-5 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Verified checks</dt><dd className="mt-1">{Object.values(checks).filter(Boolean).length} / 5</dd></div><div><dt className="text-muted-foreground">Next review due</dt><dd className="mt-1">{due || "Not set"}</dd></div><div><dt className="text-muted-foreground">Official text</dt><dd className="mt-1">{selected.content_hash ? "Snapshot recorded" : "Awaiting official fetch"}</dd></div><div><dt className="text-muted-foreground">Hugo retrieval</dt><dd className="mt-1">Not enabled</dd></div></dl>
              <div className="flex flex-wrap gap-3"><AlertDialog><AlertDialogTrigger asChild><Button disabled={!ready || busy || detailLoading}><ShieldCheck />Approve source</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Approve this source?</AlertDialogTitle><AlertDialogDescription>The reviewed excerpt, legal checks and rationale will be recorded under your account. Hugo retrieval remains disabled until separately enabled.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void decide("approved")}>Confirm approval</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><Button variant="outline" disabled={busy || !notes.trim()} onClick={() => void decide("rejected")}><XCircle />Reject source</Button></div>
              {reviews.length > 0 && <div className="space-y-4 border-t border-border/50 pt-5"><h3 className="flex items-center gap-2 text-sm font-medium"><History className="h-4 w-4" />Review history</h3>{reviews.map(r => <article key={r.id} className="border-l-2 border-primary/30 pl-4"><p className="text-sm capitalize">{r.decision} · {stamp(r.reviewed_at)}</p><p className="mt-1 break-all text-xs text-muted-foreground">Reviewer: {r.reviewer_id}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{r.notes}</p></article>)}</div>}
            </TabsContent>
          </Tabs>
          <p className="border-t border-border/30 pt-4 text-xs text-muted-foreground">Informational sources only. Approval is a recorded expert review, not a guarantee of legal accuracy.</p>
        </section>}
      </div>
    </div>
  </DashboardLayout>;
}