import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FileSearch, AlertTriangle, CheckCircle2 } from "lucide-react";
import { extractClauses, missingClauses } from "@/lib/contractRisk";

/** Structured clause map for a contract shared in chat. Detection only — no risk scores are invented. */
export function HugoContractCard({ text }: { text: string }) {
  const clauses = useMemo(() => extractClauses(text), [text]);
  const missing = useMemo(() => missingClauses(clauses), [clauses]);

  return (
    <div className="mt-2 w-full max-w-xl rounded-2xl border border-primary/25 bg-card/60 p-4 text-left text-foreground">
      <div className="flex items-center gap-2 mb-1">
        <FileSearch className="h-4 w-4 text-primary" aria-hidden="true" />
        <h4 className="text-sm font-display font-semibold">Clause Map</h4>
        <span className="ml-auto rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">Unscored</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        {clauses.length} clause{clauses.length === 1 ? "" : "s"} detected. Risk scores appear only after a validated analysis runs.
      </p>
      <ul className="space-y-2">
        {clauses.map(c => (
          <li key={c.title} className="rounded-xl bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <CheckCircle2 className="h-3 w-3 text-primary" aria-hidden="true" /> {c.title}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{c.excerpt}</p>
          </li>
        ))}
      </ul>
      {missing.length > 0 && (
        <div className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
          <span>Not found: {missing.join(", ")}.</span>
        </div>
      )}
      <Link to="/dashboard/contract-analysis" className="mt-3 inline-block text-[11px] text-primary underline underline-offset-2">
        Open full Contract Risk Analysis
      </Link>
    </div>
  );
}
