import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield, Sparkles, Activity, AlertTriangle, CheckCircle2, RefreshCw,
  Code2, Brain, History, ChevronDown, ChevronRight, Trash2, GitPullRequest, Copy, Check,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Severity = "critical" | "high" | "medium" | "low" | "info";

interface Finding {
  severity: Severity;
  area?: string;
  category?: string;
  title: string;
  detail: string;
  suggestion: string;
  line_hint?: string;
}

interface AssessReport {
  summary: string;
  health_score: number;
  findings: Finding[];
  wins: string[];
  next_cycle_focus: string[];
  lessons: string[];
}

interface ReviewReport {
  summary: string;
  quality_score: number;
  findings: Finding[];
  refactor_suggestion: string | null;
  test_ideas: string[];
}

interface StoredCycle {
  id: string;
  at: string;
  type: "assess" | "review";
  report: AssessReport | ReviewReport;
  signals?: unknown;
  label?: string;
}

const STORAGE_KEY = "mccloder_cycles_v1";
const LESSONS_KEY = "mccloder_lessons_v1";
const PR_KEY = "mccloder_prs_v1";

interface PRPackage {
  title: string;
  branch_name: string;
  description: string;
  patch_suggestions?: { file: string; change_summary: string; diff_hint?: string }[];
  commit_message?: string;
  self_evaluation?: { usefulness: number; safety: number; correctness_confidence: number; improvement_notes: string[] };
  ci_notes?: string;
}

const sevColor: Record<Severity, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high:     "bg-orange-500/20 text-orange-300 border-orange-500/40",
  medium:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  low:      "bg-blue-500/20 text-blue-300 border-blue-500/40",
  info:     "bg-muted/30 text-muted-foreground border-border/40",
};

function loadCycles(): StoredCycle[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveCycles(c: StoredCycle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c.slice(0, 50)));
}
function loadLessons(): string[] {
  try { return JSON.parse(localStorage.getItem(LESSONS_KEY) || "[]"); } catch { return []; }
}
function saveLessons(l: string[]) {
  localStorage.setItem(LESSONS_KEY, JSON.stringify(l.slice(-40)));
}

export function McCloderPanel() {
  const [tab, setTab] = useState<"assess" | "review" | "memory">("assess");
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState<StoredCycle[]>([]);
  const [lessons, setLessons] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pr, setPr] = useState<PRPackage | null>(null);
  const [prOpen, setPrOpen] = useState(false);
  const [prLoading, setPrLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // review state
  const [code, setCode] = useState("");
  const [context, setContext] = useState("");

  useEffect(() => {
    setCycles(loadCycles());
    setLessons(loadLessons());
  }, []);

  const assess = cycles.filter(c => c.type === "assess");
  const reviews = cycles.filter(c => c.type === "review");
  const latestAssess = assess[0]?.report as AssessReport | undefined;

  // Self-evaluation: how well McCloder is doing
  const totalFindings = assess.reduce((s, c) => s + ((c.report as AssessReport).findings?.length ?? 0), 0);
  const avgHealth = assess.length
    ? Math.round(assess.reduce((s, c) => s + ((c.report as AssessReport).health_score ?? 0), 0) / assess.length)
    : 0;
  const trend = assess.length >= 2
    ? ((assess[0].report as AssessReport).health_score ?? 0) - ((assess[1].report as AssessReport).health_score ?? 0)
    : 0;

  async function runAssessment() {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("mccloder", {
        body: { action: "assess", prior_lessons: lessons },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Assessment failed");

      const cycle: StoredCycle = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        type: "assess",
        report: data.report,
        signals: data.signals,
      };
      const next = [cycle, ...cycles];
      setCycles(next); saveCycles(next);

      const newLessons = Array.isArray(data.report?.lessons) ? data.report.lessons : [];
      if (newLessons.length) {
        const merged = [...lessons, ...newLessons].slice(-40);
        setLessons(merged); saveLessons(merged);
      }
      toast.success("McCloder cycle complete");
      setExpandedId(cycle.id);
    } catch (e: any) {
      toast.error(e?.message || "McCloder cycle failed");
    } finally {
      setRunning(false);
    }
  }

  async function runReview() {
    if (!code.trim()) { toast.error("Paste some code first"); return; }
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("mccloder", {
        body: { action: "review", code, context },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Review failed");

      const cycle: StoredCycle = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        type: "review",
        report: data.report,
        label: context || `Snippet (${code.split("\n").length} lines)`,
      };
      const next = [cycle, ...cycles];
      setCycles(next); saveCycles(next);
      toast.success("Code review complete");
      setExpandedId(cycle.id);
    } catch (e: any) {
      toast.error(e?.message || "Review failed");
    } finally {
      setRunning(false);
    }
  }

  function clearHistory() {
    if (!confirm("Clear all McCloder cycles and lessons?")) return;
    setCycles([]); setLessons([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LESSONS_KEY);
    toast.success("Memory cleared");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">McCloder Intelligence</h3>
        </div>
        <Badge variant="outline" className="text-[9px] h-5">Guardian Agent</Badge>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Continuous system guardian. Assesses health, reviews code, learns from every cycle.
      </p>

      {/* Self-eval header */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Health" value={latestAssess?.health_score ?? avgHealth ?? "—"} accent />
        <Stat label="Cycles" value={assess.length} />
        <Stat label="Trend" value={trend === 0 ? "—" : `${trend > 0 ? "+" : ""}${trend}`} positive={trend > 0} negative={trend < 0} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/20">
        <TabBtn active={tab === "assess"} onClick={() => setTab("assess")} icon={<Activity className="h-3 w-3" />} label="Assess" />
        <TabBtn active={tab === "review"} onClick={() => setTab("review")} icon={<Code2 className="h-3 w-3" />} label="Review" />
        <TabBtn active={tab === "memory"} onClick={() => setTab("memory")} icon={<Brain className="h-3 w-3" />} label="Memory" />
      </div>

      {tab === "assess" && (
        <div className="space-y-3">
          <Button size="sm" onClick={runAssessment} disabled={running} className="w-full h-8 text-xs">
            {running ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Running cycle…</> : <><Sparkles className="h-3 w-3 mr-1" /> Run Assessment Cycle</>}
          </Button>

          {latestAssess && (
            <div className="glass rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Latest Report</p>
              <p className="text-xs leading-relaxed">{latestAssess.summary}</p>
              {latestAssess.wins?.length > 0 && (
                <div className="space-y-1 pt-1">
                  {latestAssess.wins.slice(0, 3).map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] text-green-300">
                      <CheckCircle2 className="h-2.5 w-2.5 mt-0.5 shrink-0" /> <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <ReportsList cycles={assess} expandedId={expandedId} setExpandedId={setExpandedId} kind="assess" />
        </div>
      )}

      {tab === "review" && (
        <div className="space-y-2">
          <Input
            placeholder="Context (file name / what to look for) — optional"
            value={context}
            onChange={e => setContext(e.target.value)}
            className="h-8 text-xs"
          />
          <Textarea
            placeholder="Paste code for McCloder to review…"
            value={code}
            onChange={e => setCode(e.target.value)}
            rows={8}
            className="text-[11px] font-mono"
          />
          <Button size="sm" onClick={runReview} disabled={running} className="w-full h-8 text-xs">
            {running ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Reviewing…</> : <><Sparkles className="h-3 w-3 mr-1" /> Review Code</>}
          </Button>
          <ReportsList cycles={reviews} expandedId={expandedId} setExpandedId={setExpandedId} kind="review" />
        </div>
      )}

      {tab === "memory" && (
        <div className="space-y-3">
          <div className="glass rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Knowledge Base</p>
              <span className="text-[10px] text-muted-foreground/60">{lessons.length} lessons</span>
            </div>
            {lessons.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">No lessons yet. Run cycles to grow memory.</p>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-1.5">
                  {[...lessons].reverse().map((l, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground border-l border-primary/40 pl-2">{l}</div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {latestAssess?.next_cycle_focus?.length ? (
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Next Cycle Focus</p>
              {latestAssess.next_cycle_focus.map((f, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-foreground/80 mb-1">
                  <ChevronRight className="h-2.5 w-2.5 mt-0.5 shrink-0 text-primary" /><span>{f}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="text-center pt-1">
            <button onClick={clearHistory} className="text-[10px] text-muted-foreground hover:text-red-400 inline-flex items-center gap-1">
              <Trash2 className="h-2.5 w-2.5" /> Clear all memory
            </button>
          </div>
          <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
            Stored locally in this browser. {totalFindings} findings logged across {assess.length} cycles.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent, positive, negative }: { label: string; value: any; accent?: boolean; positive?: boolean; negative?: boolean }) {
  const color = accent ? "text-primary" : positive ? "text-green-400" : negative ? "text-red-400" : "text-foreground";
  return (
    <div className="glass rounded-lg p-2 text-center">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-md transition ${
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function ReportsList({
  cycles, expandedId, setExpandedId, kind,
}: { cycles: StoredCycle[]; expandedId: string | null; setExpandedId: (id: string | null) => void; kind: "assess" | "review" }) {
  if (!cycles.length) {
    return <p className="text-[10px] text-muted-foreground text-center py-4">No {kind} reports yet.</p>;
  }
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <History className="h-2.5 w-2.5" /> History
      </p>
      {cycles.slice(0, 10).map(c => {
        const open = expandedId === c.id;
        const score = kind === "assess" ? (c.report as AssessReport).health_score : (c.report as ReviewReport).quality_score;
        const findings = (c.report.findings ?? []) as Finding[];
        const crit = findings.filter(f => f.severity === "critical" || f.severity === "high").length;
        return (
          <div key={c.id} className="glass rounded-lg overflow-hidden">
            <button
              className="w-full p-2 flex items-center gap-2 text-left hover:bg-muted/10"
              onClick={() => setExpandedId(open ? null : c.id)}
            >
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span className="text-[10px] flex-1 truncate">
                {c.label || new Date(c.at).toLocaleString()}
              </span>
              {crit > 0 && (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-[9px] h-4">{crit}</Badge>
              )}
              <span className="text-[10px] font-mono text-primary">{score ?? "—"}</span>
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 pt-0 space-y-2 border-t border-border/20">
                    <p className="text-[10px] text-muted-foreground">{c.report.summary}</p>
                    {findings.map((f, i) => (
                      <div key={i} className={`rounded-md border p-2 ${sevColor[f.severity]}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          <span className="text-[10px] font-semibold flex-1">{f.title}</span>
                          <span className="text-[9px] uppercase">{f.severity}</span>
                        </div>
                        <p className="text-[10px] opacity-80 mb-1">{f.detail}</p>
                        {f.suggestion && (
                          <p className="text-[10px]">
                            <span className="font-semibold">Fix:</span> {f.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                    {kind === "review" && (c.report as ReviewReport).test_ideas?.length > 0 && (
                      <div className="glass rounded-md p-2">
                        <p className="text-[10px] font-semibold mb-1">Test ideas</p>
                        {(c.report as ReviewReport).test_ideas.map((t, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground">• {t}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
