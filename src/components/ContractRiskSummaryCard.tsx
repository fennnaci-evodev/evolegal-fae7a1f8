import { useState } from "react";

/** Audit cards already shown this session; their entrance motion never replays on chat switches or remounts. */
const revealedAudits = new Set<string>();
import { diffWordsWithSpace } from "diff";
import { FileSearch, ArrowUpRight, LoaderCircle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { HugoFeedbackButtons } from "@/components/HugoFeedbackButtons";
import { exposureCounts, type ChatContractAudit } from "@/lib/contractRisk";

type Level = "High" | "Medium" | "Low";
const levelOf = (score: number): Level => (score >= 70 ? "High" : score >= 40 ? "Medium" : "Low");
const exposureLabel = (score: number) => (score >= 70 ? "Elevated exposure" : score >= 40 ? "Moderate exposure" : "Limited exposure");
const tone: Record<Level, { dot: string; text: string; bar: string }> = {
  High: { dot: "bg-risk-high", text: "text-risk-high", bar: "bg-risk-high" },
  Medium: { dot: "bg-risk-caution", text: "text-risk-caution", bar: "bg-risk-caution" },
  Low: { dot: "bg-risk-safe", text: "text-risk-safe", bar: "bg-risk-safe" },
};

function Pill({ level, count }: { level: Level; count: number }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs">
    <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${tone[level].dot}`} />
    <span className="text-muted-foreground">{level}</span><span className="font-semibold tabular-nums">{count}</span>
  </span>;
}

export function ContractRiskSummaryCard({ audit, busy, onRun, onStop, userId }: { audit: ChatContractAudit; userId?: string; busy: boolean; onRun: (clauseIndex?: number) => void; onStop: () => void }) {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [animate] = useState(() => { const first = !revealedAudits.has(audit.id); revealedAudits.add(audit.id); return first; });
  const a = audit.analysis, counts = a ? exposureCounts(a.clauses) : null;
  const level = a ? levelOf(a.overall_risk_score) : "Low";
  return <>
    <article className={`${animate ? "evo-reveal " : ""}mt-2 w-full max-w-xl rounded-xl border border-primary/25 bg-card p-4 text-left text-foreground`} aria-label="Contract risk summary">
      <header className="flex items-center gap-2"><FileSearch className="h-4 w-4 shrink-0 text-primary" /><h4 className="text-sm font-semibold">Contract Risk Summary</h4></header>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{audit.file_name}</p>
      {a ? <>
        <section className="mt-4" aria-label="Overall exposure">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold tabular-nums">{a.overall_risk_score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            <span className={`ml-auto text-xs font-medium ${tone[level].text}`}>{a.partial ? "Partial audit · " : ""}{exposureLabel(a.overall_risk_score)}</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={a.overall_risk_score} aria-label="Exposure estimate">
            <div className={`${animate ? "evo-meter " : ""}h-full rounded-full ${tone[level].bar}`} style={{ width: `${a.overall_risk_score}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Pill level="High" count={counts?.High ?? 0} /><Pill level="Medium" count={counts?.Medium ?? 0} /><Pill level="Low" count={counts?.Low ?? 0} />
          </div>
        </section>
        <section className="mt-4 border-t border-border pt-3" aria-label="Summary">
          <p className={`text-sm leading-relaxed text-muted-foreground ${more ? "" : "line-clamp-3"}`}>{a.summary}</p>
          {a.summary.length > 220 && <button type="button" onClick={() => setMore(m => !m)} className="mt-1 text-xs text-primary hover:underline">{more ? "Less" : "More"}</button>}
        </section>
        <section className="mt-3 border-t border-border pt-3" aria-label="Top clauses">
          <h5 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Top clauses</h5>
          <ul className="space-y-2 text-sm">{[...a.clauses].sort((x, y) => y.risk_score - x.risk_score).slice(0, 3).map((c, i) => <li key={i} className="flex items-center gap-2.5">
            <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone[levelOf(c.risk_score)].dot}`} />
            <span className="min-w-0 flex-1 break-words">{c.title}</span>
            <span className="sr-only">{levelOf(c.risk_score)} exposure,</span>
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{c.risk_score}/100</span>
          </li>)}</ul>
        </section>
        {a.partial && <p className="mt-3 text-xs text-risk-caution">Only the first {a.assessed_characters.toLocaleString()} of {a.total_characters.toLocaleString()} characters were assessed. Remaining text is unscored.</p>}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" size="sm" className="h-11 w-full sm:h-8 sm:w-auto" onClick={() => setOpen(true)}>Expand Details <ArrowUpRight className="h-3.5 w-3.5" /></Button>
          {userId && audit.status === "complete" && <HugoFeedbackButtons auditId={audit.id} userId={userId} />}
        </div>
      </> : <div className="mt-3"><p role={audit.status === "error" ? "alert" : "status"} className="text-xs text-muted-foreground">{busy ? "Assessing contract clauses…" : audit.error_message || "Contract saved. Awaiting analysis."}</p><Button variant="outline" size="sm" className="mt-2" disabled={busy} onClick={() => onRun()}>{busy ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <FileSearch className="h-3 w-3" />}{busy ? "Analyzing" : "Run Audit"}</Button>{busy && <Button variant="ghost" size="icon" aria-label="Stop contract audit" onClick={onStop}><Square className="h-3 w-3" /></Button>}</div>}
      <p className="mt-3 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">Heuristic findings, not a calibrated legal assessment. Statutory authority is not verified. Professional review may be appropriate.</p>
    </article>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader className="mt-4 text-left"><SheetTitle>Contract Risk Analysis</SheetTitle><SheetDescription>{audit.file_name} · Informational clause review</SheetDescription></SheetHeader>
      {a && <div className="mt-6 space-y-6">{a.clauses.map((c, i) => { const lv = levelOf(c.risk_score); return <section key={i} className="border-t border-border pt-4">
        <div className="flex items-center gap-2.5"><span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${tone[lv].dot}`} /><h3 className="min-w-0 flex-1 text-sm font-semibold">{c.title}</h3><span className="shrink-0 text-xs tabular-nums text-muted-foreground">{lv} · {c.risk_score}/100</span></div>
        <blockquote className="my-3 whitespace-pre-wrap break-words border-l-2 border-primary/40 pl-3 text-sm">{c.excerpt}</blockquote>
        <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Why it matters</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.explanation}</p>
        <h4 className="mt-3 text-[11px] font-medium uppercase tracking-wide text-primary">Option to consider</h4>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{c.recommendation}</p>
        {a.redlines?.[String(i)] ? <div className="mt-3"><h4 className="mb-2 text-xs font-semibold">Suggested clause redline</h4><p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{diffWordsWithSpace(a.redlines[String(i)].original, a.redlines[String(i)].suggested).map((part, j) => part.removed ? <del key={j} className="bg-risk-high/10 text-risk-high">{part.value}</del> : part.added ? <ins key={j} className="bg-risk-safe/10 text-risk-safe">{part.value}</ins> : <span key={j}>{part.value}</span>)}</p><p className="mt-2 text-xs text-muted-foreground">{a.redlines[String(i)].reasoning}</p></div> : <Button variant="outline" size="sm" className="mt-3" disabled={busy} onClick={() => onRun(i)}>{busy && <LoaderCircle className="h-3 w-3 animate-spin" />}Suggest Clause Redline</Button>}
      </section>; })}<p className="border-t border-border pt-3 text-xs text-muted-foreground">Generic negotiation alternatives only; no full-document rewrite or verified statutory conclusion.</p></div>}
    </SheetContent></Sheet>
  </>;
}
