import { DOCUMENT_ACCEPT } from "@/lib/documentParser";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownToLine, ArrowRight, Check, ChevronRight, FileText, LockKeyhole, Scale, Search, ShieldCheck, TriangleAlert, Upload, X } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { filterRiskClauses, riskDisclaimer, riskLabels, sampleAnalysis, sampleSections, type ClauseSeverity, type RiskClause } from "@/lib/contractRisk";
import { exportRiskReport } from "@/lib/exportRiskReport";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { readContractViewerFile } from "@/lib/contractViewerInput";

const severityStyles: Record<ClauseSeverity, string> = {
  Green: "text-risk-safe border-risk-safe/30 bg-risk-safe/5",
  Amber: "text-risk-caution border-risk-caution/30 bg-risk-caution/5",
  Red: "text-risk-high border-risk-high/30 bg-risk-high/5",
};
const severityIcons = { Green: LockKeyhole, Amber: Scale, Red: TriangleAlert };

function RiskBadge({ severity }: { severity: ClauseSeverity }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-medium", severityStyles[severity])}>{riskLabels[severity]}</span>;
}

export default function ContractAnalysis() {
  const { user, loading } = useAuth();
  const { isAdmin, adminLoading } = useAdminMode();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ClauseSeverity | "All">("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RiskClause | null>(null);
  const [cleanView, setCleanView] = useState(false);
  const [upload, setUpload] = useState<{ name: string; text?: string; url?: string } | null>(null);
  const [methodology, setMethodology] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (loading || adminLoading) return;
    if (!user) navigate("/auth", { replace: true });
    else if (!isAdmin) navigate("/dashboard", { replace: true });
  }, [user, loading, isAdmin, adminLoading, navigate]);
  useEffect(() => () => { if (upload?.url) URL.revokeObjectURL(upload.url); }, [upload]);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    try {
      const isPdf = /\.pdf$/i.test(file.name);
      if (isPdf && file.type && file.type !== "application/pdf") throw new Error("PDF content type does not match its filename.");
      if (!file.size) throw new Error("This document is empty.");
      if (isPdf && file.size > 15 * 1024 * 1024) throw new Error("Choose a PDF under 15 MB.");
      if (isPdf && !new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()).startsWith("%PDF-")) throw new Error("This file is not a valid PDF document.");
      const opened = isPdf ? { name: file.name, url: URL.createObjectURL(file) } : { name: file.name, text: await readContractViewerFile(file) };
      setSelected(null);
      setUpload(opened);
      toast.success("Document opened locally. Analysis is not connected yet.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not parse this document. Try a valid PDF or text contract."); }
  };
  const openClause = (clause: RiskClause) => {
    setSelected(clause);
    documentRef.current?.querySelector(`[data-clause="${clause.title}"]`)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
  };
  const clauses = filterRiskClauses(sampleAnalysis.clauses, filter, query);
  const section = sampleSections.find(s => s.title === selected?.title);

  if (loading || adminLoading || !user || !isAdmin) return <div className="min-h-screen bg-background" aria-busy="true" />;
  return <DashboardLayout><div className="mx-auto w-full max-w-7xl space-y-6 contract-analysis">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-primary"><ShieldCheck className="h-3.5 w-3.5" /> Expert workspace <span className="text-muted-foreground">/</span> Contract analysis</div><h1 className="font-display text-2xl font-bold md:text-3xl">Contract Risk Analysis</h1><p className="mt-1.5 text-sm text-muted-foreground">Clause-level insights. A clearer view of contractual exposure.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-full" onClick={() => fileInput.current?.click()}><Upload /> Upload Contract</Button><Button variant="outline" className="rounded-full border-primary/25 text-primary" disabled={!!upload} title="Download a printable HTML report" onClick={() => exportRiskReport(sampleAnalysis, sampleSections)}><ArrowDownToLine /> Export Report</Button></div>
      <input ref={fileInput} type="file" accept={DOCUMENT_ACCEPT} className="hidden" onChange={e => { void handleUpload(e.target.files?.[0]); e.target.value = ""; }} />
    </header>

    <section className="risk-summary-band grid gap-6 rounded-lg border border-primary/20 p-5 md:grid-cols-[1.1fr_1fr] md:p-7" aria-label="Contract risk summary">
      <div><div className="flex items-center gap-3"><h2 className="text-xs font-medium uppercase tracking-widest">Contract Risk Score</h2><span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{upload ? "Unscored" : "Sample assessment"}</span></div>
        <div className="my-3 flex items-baseline gap-2"><span className="font-display text-6xl font-semibold leading-none md:text-7xl">{upload ? "—" : 72}</span><span className="text-xl text-muted-foreground">/100</span></div>
        <div className="relative mt-4 h-2 w-full max-w-md rounded-full risk-spectrum" role="meter" aria-label="Sample contract risk score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={upload ? undefined : 72}>{!upload && <div className="absolute -top-1 h-4 w-4 rounded-full border-2 border-foreground bg-risk-high shadow-sm left-[72%] -translate-x-1/2" />}</div>
        <div className="mt-2 flex max-w-md justify-between text-[10px] text-muted-foreground"><span>0 · Low risk</span><span>100 · High risk</span></div>
      </div>
      <div className="flex flex-col justify-center gap-4"><div><span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium", upload ? "border-border text-muted-foreground" : severityStyles.Red)}><TriangleAlert className="h-4 w-4" />{upload ? "Awaiting analysis" : "Medium-High Risk"}</span></div><p className="max-w-md text-sm leading-relaxed text-muted-foreground">{upload ? "Your document is available for viewing. No risk scores or clause findings have been assigned to it." : sampleAnalysis.summary}</p><Button variant="link" className="h-auto justify-start self-start p-0 text-xs" onClick={() => setMethodology(true)}>View scoring methodology <ArrowRight className="h-3 w-3" /></Button></div>
    </section>

    <div className="grid items-start gap-5 xl:grid-cols-[1.05fr_1fr]">
      <section className="min-w-0" aria-label="Contract document">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><FileText className="h-4 w-4 text-primary" />Contract Document</h2><div className="flex gap-1 rounded-full border border-border p-1">{[false, true].map(clean => <Button key={String(clean)} variant="ghost" size="sm" className={cn("h-7 rounded-full px-3 text-[11px]", cleanView === clean && "bg-muted text-foreground")} aria-pressed={cleanView === clean} onClick={() => setCleanView(clean)}>{clean ? "Clean View" : "Original"}</Button>)}</div></div>
        <div className="rounded-lg border border-border bg-card/70 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3"><span className="truncate text-xs text-muted-foreground">{upload?.name ?? "Master Services Agreement · Sample"}</span>{upload ? <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" aria-label="Return to sample contract" onClick={() => setUpload(null)}><X /></Button> : <span className="text-[10px] text-primary">9 clauses</span>}</div>
          <div ref={documentRef} className="h-[580px] overflow-auto scroll-smooth p-5 md:p-6">
            {upload ? upload.url ? <object data={upload.url} type="application/pdf" className="h-full w-full" aria-label={upload.name}><p className="text-sm text-muted-foreground">PDF preview unavailable. <a href={upload.url} target="_blank" rel="noreferrer" className="text-primary underline">Open document</a></p></object> : <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{upload.text}</pre> : <>
              <div className="mb-6"><div className="mb-3 text-[9px] uppercase tracking-widest text-muted-foreground">Illustrative contract · Not executed</div><h3 className="text-sm font-semibold uppercase">Master Services Agreement</h3><p className="mt-3 text-xs leading-relaxed text-muted-foreground">This sample agreement is entered into between [Client] and [Provider] as of [Effective Date].</p></div>
              <div className="space-y-2">{sampleSections.map((s, index) => {
                const clause = sampleAnalysis.clauses.find(c => c.title === s.title);
                const content = <><div className="mb-2 flex items-center justify-between gap-2"><h4 className="text-[11px] font-semibold uppercase text-foreground">{index + 1}. {s.title}</h4>{clause && !cleanView && <RiskBadge severity={clause.severity} />}</div><p className="text-xs leading-[1.8] text-foreground/80">{s.text}</p></>;
                return clause && !cleanView ? <Button key={s.title} variant="ghost" data-clause={s.title} className={cn("risk-document-clause block h-auto w-full whitespace-normal rounded-lg border p-3 text-left", severityStyles[clause.severity])} onClick={() => openClause(clause)}>{content}</Button> : <div data-clause={s.title} key={s.title} className="rounded-lg border border-transparent p-3">{content}</div>;
              })}</div>
            </>}
          </div><div className="flex items-center justify-between border-t border-border px-5 py-3 text-[10px] text-muted-foreground"><span>{upload ? "Local preview · Not stored" : "Sample agreement · Complete text"}</span><LockKeyhole className="h-3 w-3" /></div>
        </div>
      </section>
      <section className="min-w-0" aria-label="Risk breakdown">
        <div className="mb-3 flex min-h-9 items-center justify-between"><h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><ShieldCheck className="h-4 w-4 text-primary" /> Risk Breakdown</h2><span className="text-[10px] text-muted-foreground">{upload ? "Pending" : "6 assessed clauses"}</span></div>
        <div className="relative mb-3"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search clauses" placeholder="Search clauses…" className="rounded-full bg-card/50 pl-10" value={query} disabled={!!upload} onChange={e => setQuery(e.target.value)} /></div>
        <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by risk level">{(["All", "Green", "Amber", "Red"] as const).map(severity => <Button key={severity} variant="outline" size="sm" disabled={!!upload} aria-pressed={filter === severity} className={cn("h-8 rounded-full px-3 text-[11px]", filter === severity && "border-primary/40 bg-primary/10 text-primary")} onClick={() => setFilter(severity)}>{severity !== "All" && <span className={cn("h-1.5 w-1.5 rounded-full", severity === "Green" ? "bg-risk-safe" : severity === "Amber" ? "bg-risk-caution" : "bg-risk-high")} />}{severity === "All" ? "All clauses" : riskLabels[severity]}</Button>)}</div>
        {upload ? <div className="flex min-h-72 flex-col items-center justify-center gap-4 border-y border-border py-10 text-center"><FileText className="h-8 w-8 text-muted-foreground" /><h3 className="font-display font-medium">Document ready for review</h3><p className="max-w-xs text-sm leading-relaxed text-muted-foreground">Real contract analysis is not connected. Sample findings are hidden for this document.</p><Button variant="outline" className="rounded-full" onClick={() => setUpload(null)}>Return to sample</Button></div> : <div className="space-y-2.5">{clauses.map(clause => {
          const Icon = severityIcons[clause.severity];
          return <Button key={clause.title} variant="ghost" className={cn("risk-clause-row flex h-auto w-full items-center gap-3 whitespace-normal rounded-lg border p-4 text-left", severityStyles[clause.severity])} onClick={() => openClause(clause)}><Icon className="h-5 w-5 shrink-0" /><div className="min-w-0 flex-1"><h3 className="mb-1 text-xs font-semibold text-foreground">{clause.title}</h3><p className="text-[11px] font-normal leading-relaxed text-muted-foreground">{clause.explanation}</p></div><div className="flex flex-col items-end gap-2"><RiskBadge severity={clause.severity} /><span className="text-[10px] text-muted-foreground">{clause.risk_score}/100</span></div><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /></Button>;
        })}{clauses.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No clauses match this filter.</p>}</div>}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3"><Button variant="link" size="sm" disabled={!!upload} className="px-0 text-xs" onClick={() => { setFilter("All"); setQuery(""); }}>View All Clauses ({sampleAnalysis.clauses.length}) <ArrowRight /></Button><span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Check className="h-3 w-3" /> {upload ? "No findings assigned" : "Illustrative baseline"}</span></div>
      </section>
    </div>
    <footer className="flex gap-3 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>{riskDisclaimer}</p></footer>

    <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><SheetContent className="w-full overflow-y-auto border-primary/15 sm:max-w-lg"><SheetHeader className="mt-4 text-left"><div className="mb-3 text-[10px] uppercase tracking-widest text-primary">Clause review · Sample</div><SheetTitle>{selected?.title}</SheetTitle><SheetDescription>Illustrative finding and comparison. Not a legal determination.</SheetDescription></SheetHeader>{selected && <div className="mt-7 space-y-7"><div className="flex items-center justify-between"><RiskBadge severity={selected.severity} /><span className="font-display text-3xl font-semibold">{selected.risk_score}<span className="text-sm text-muted-foreground"> /100</span></span></div><section><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">Original clause</h3><blockquote className="border-l-2 border-primary/40 bg-muted/25 p-4 text-sm leading-relaxed">{section?.text}</blockquote></section><section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider">Why it was flagged</h3><p className="text-sm leading-relaxed text-muted-foreground">{selected.explanation}</p></section><section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider">Illustrative baseline</h3><p className="text-sm leading-relaxed text-muted-foreground">{section?.baseline}</p></section><p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">{riskDisclaimer}</p></div>}</SheetContent></Sheet>
    <Sheet open={methodology} onOpenChange={setMethodology}><SheetContent className="w-full overflow-auto sm:max-w-lg"><SheetHeader className="mt-5 text-left"><SheetTitle>Scoring methodology</SheetTitle><SheetDescription>Sample data, not a calibrated risk model.</SheetDescription></SheetHeader><div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground"><p>The 72/100 overall score and clause scores are illustrative fixtures. The overall score is not calculated from the displayed clauses.</p><p>Safe, Caution, and High Risk are supplied labels; they do not establish enforceability, legal compliance, or market conformity.</p><p>A future analysis provider can supply the same score and clause structure. It is not connected here, and uploaded contracts are not scored.</p></div></SheetContent></Sheet>
  </div></DashboardLayout>;
}