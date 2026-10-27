import { useState } from "react";
import { diffWordsWithSpace } from "diff";
import { FileSearch, ArrowUpRight, LoaderCircle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { HugoFeedbackButtons } from "@/components/HugoFeedbackButtons";
import { exposureCounts, type ChatContractAudit } from "@/lib/contractRisk";

export function ContractRiskSummaryCard({ audit, busy, onRun, onStop, userId }: { audit: ChatContractAudit; userId?: string; busy: boolean; onRun: (clauseIndex?: number) => void; onStop: () => void }) {
  const [open, setOpen] = useState(false);
  const a = audit.analysis, counts = a ? exposureCounts(a.clauses) : null;
  return <>
    <article className="mt-2 w-full max-w-xl rounded-lg border border-primary/25 bg-card p-4 text-left text-foreground" aria-label="Contract risk summary">
      <header className="flex items-center gap-2"><FileSearch className="h-4 w-4 shrink-0 text-primary" /><h4 className="text-sm font-semibold">Contract Risk Summary</h4></header>
      <p className="mt-1 truncate text-xs text-muted-foreground">{audit.file_name}</p>
      {a ? <><div className="mt-3 flex flex-wrap items-center gap-4"><div><span className="font-display text-3xl font-semibold">{a.overall_risk_score}</span><span className="text-xs text-muted-foreground"> /100 · {a.partial ? "Partial audit" : "Exposure estimate"}</span></div><div className="flex gap-3 text-xs"><span className="text-risk-high">High {counts?.High}</span><span className="text-risk-caution">Medium {counts?.Medium}</span><span className="text-risk-safe">Low {counts?.Low}</span></div></div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.summary}</p>
        <ul className="mt-3 space-y-1 text-xs">{[...a.clauses].sort((x,y) => y.risk_score-x.risk_score).slice(0,3).map((c,i) => <li key={i} className="flex justify-between gap-3"><span className="min-w-0 break-words">{c.title}</span><span className="shrink-0 text-muted-foreground">{c.risk_score}/100</span></li>)}</ul>
        {a.partial && <p className="mt-3 text-xs text-risk-caution">Only the first {a.assessed_characters.toLocaleString()} of {a.total_characters.toLocaleString()} characters were assessed. Remaining text is unscored.</p>}
        <Button variant="link" size="sm" className="mt-2 h-auto px-0" onClick={() => setOpen(true)}>Expand Details <ArrowUpRight className="h-3 w-3" /></Button>
        {userId && audit.status === "complete" && <HugoFeedbackButtons auditId={audit.id} userId={userId} />}
      </> : <div className="mt-3"><p role={audit.status === "error" ? "alert" : "status"} className="text-xs text-muted-foreground">{busy ? "Assessing contract clauses…" : audit.error_message || "Contract saved. Awaiting analysis."}</p><Button variant="outline" size="sm" className="mt-2" disabled={busy} onClick={() => onRun()}>{busy ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <FileSearch className="h-3 w-3" />}{busy ? "Analyzing" : "Run Audit"}</Button>{busy && <Button variant="ghost" size="icon" aria-label="Stop contract audit" onClick={onStop}><Square className="h-3 w-3" /></Button>}</div>}
      <p className="mt-3 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">Heuristic findings, not a calibrated legal assessment. Statutory authority is not verified. Professional review may be appropriate.</p>
    </article>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader className="mt-4 text-left"><SheetTitle>Contract Risk Analysis</SheetTitle><SheetDescription>{audit.file_name} · Informational clause review</SheetDescription></SheetHeader>
      {a && <div className="mt-6 space-y-6">{a.clauses.map((c,i) => <section key={i} className="border-t border-border pt-4"><div className="flex justify-between gap-3"><h3 className="text-sm font-semibold">{c.title}</h3><span className="shrink-0 text-xs text-muted-foreground">{c.risk_score}/100</span></div><blockquote className="my-3 whitespace-pre-wrap break-words border-l-2 border-primary/40 pl-3 text-sm">{c.excerpt}</blockquote><p className="text-xs leading-relaxed text-muted-foreground">{c.explanation}</p><p className="mt-2 text-xs leading-relaxed">{c.recommendation}</p>
        {a.redlines?.[String(i)] ? <div className="mt-3"><h4 className="mb-2 text-xs font-semibold">Suggested clause redline</h4><p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{diffWordsWithSpace(a.redlines[String(i)].original, a.redlines[String(i)].suggested).map((part,j) => part.removed ? <del key={j} className="bg-risk-high/10 text-risk-high">{part.value}</del> : part.added ? <ins key={j} className="bg-risk-safe/10 text-risk-safe">{part.value}</ins> : <span key={j}>{part.value}</span>)}</p><p className="mt-2 text-xs text-muted-foreground">{a.redlines[String(i)].reasoning}</p></div> : <Button variant="outline" size="sm" className="mt-3" disabled={busy} onClick={() => onRun(i)}>{busy && <LoaderCircle className="h-3 w-3 animate-spin" />}Suggest Clause Redline</Button>}
      </section>)}<p className="border-t border-border pt-3 text-xs text-muted-foreground">Generic negotiation alternatives only; no full-document rewrite or verified statutory conclusion.</p></div>}
    </SheetContent></Sheet>
  </>;
}