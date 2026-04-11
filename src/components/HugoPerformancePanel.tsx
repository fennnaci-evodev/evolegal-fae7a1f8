import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Activity, Shield, Brain, MessageCircle, FileText, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MetricRow {
  clarity_score: number | null;
  relevance_score: number | null;
  conciseness_score: number | null;
  empathy_score: number | null;
  risk_accuracy_score: number | null;
  escalation_score: number | null;
  context_retention_score: number | null;
  overall_score: number | null;
  retention_score: number | null;
  weakest_areas: string | null;
  ethics_flags: string | null;
  created_at: string;
  interaction_type: string;
}

interface AggregatedMetrics {
  clarity: number;
  relevance: number;
  conciseness: number;
  empathy: number;
  risk_accuracy: number;
  escalation: number;
  context_retention: number;
  overall: number;
  retention: number;
  count: number;
  weakestAreas: Record<string, number>;
  ethicsFlags: string[];
}

function aggregate(rows: MetricRow[]): AggregatedMetrics {
  const result: AggregatedMetrics = {
    clarity: 0, relevance: 0, conciseness: 0, empathy: 0,
    risk_accuracy: 0, escalation: 0, context_retention: 0,
    overall: 0, retention: 0, count: 0,
    weakestAreas: {}, ethicsFlags: [],
  };

  if (!rows.length) return result;

  const fields = ["clarity", "relevance", "conciseness", "empathy", "risk_accuracy", "escalation", "context_retention", "overall", "retention"] as const;
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  fields.forEach(f => { sums[f] = 0; counts[f] = 0; });

  for (const row of rows) {
    if (row.clarity_score != null) { sums.clarity += row.clarity_score; counts.clarity++; }
    if (row.relevance_score != null) { sums.relevance += row.relevance_score; counts.relevance++; }
    if (row.conciseness_score != null) { sums.conciseness += row.conciseness_score; counts.conciseness++; }
    if (row.empathy_score != null) { sums.empathy += row.empathy_score; counts.empathy++; }
    if (row.risk_accuracy_score != null) { sums.risk_accuracy += row.risk_accuracy_score; counts.risk_accuracy++; }
    if (row.escalation_score != null) { sums.escalation += row.escalation_score; counts.escalation++; }
    if (row.context_retention_score != null) { sums.context_retention += row.context_retention_score; counts.context_retention++; }
    if (row.overall_score != null) { sums.overall += row.overall_score; counts.overall++; }
    if (row.retention_score != null) { sums.retention += row.retention_score; counts.retention++; }

    if (row.weakest_areas) {
      row.weakest_areas.split(",").map(s => s.trim()).filter(Boolean).forEach(area => {
        result.weakestAreas[area] = (result.weakestAreas[area] || 0) + 1;
      });
    }
    if (row.ethics_flags && row.ethics_flags !== "none") {
      result.ethicsFlags.push(row.ethics_flags);
    }
  }

  fields.forEach(f => {
    (result as any)[f] = counts[f] ? Math.round(sums[f] / counts[f]) : 0;
  });
  result.count = rows.length;

  return result;
}

function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const color = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  const bgColor = score >= 80 ? "bg-green-400/20" : score >= 60 ? "bg-yellow-400/20" : "bg-red-400/20";
  const barColor = score >= 80 ? "bg-green-400" : score >= 60 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3 w-3 ${color}`} />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className={`font-mono font-semibold ${color}`}>{score || "—"}</span>
      </div>
      <div className={`h-1.5 rounded-full ${bgColor}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
}

export function HugoPerformancePanel() {
  const [metrics7d, setMetrics7d] = useState<AggregatedMetrics | null>(null);
  const [metrics30d, setMetrics30d] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30>(7);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const since7 = new Date(now.getTime() - 7 * 86400000).toISOString();
      const since30 = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [res7, res30] = await Promise.all([
        supabase.from("hugo_metrics").select("*").gte("created_at", since7).order("created_at", { ascending: true }),
        supabase.from("hugo_metrics").select("*").gte("created_at", since30).order("created_at", { ascending: true }),
      ]);

      setMetrics7d(aggregate((res7.data as any) || []));
      setMetrics30d(aggregate((res30.data as any) || []));
    } catch (e) {
      console.error("Failed to load metrics:", e);
    }
    setLoading(false);
  };

  const current = period === 7 ? metrics7d : metrics30d;

  const topWeakest = current
    ? Object.entries(current.weakestAreas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const healthScore = current?.overall || 0;
  const healthColor = healthScore >= 80 ? "text-green-400" : healthScore >= 60 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Hugo Performance</h3>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={period === 7 ? "default" : "ghost"} className="h-6 text-[10px] px-2" onClick={() => setPeriod(7)}>7d</Button>
          <Button size="sm" variant={period === 30 ? "default" : "ghost"} className="h-6 text-[10px] px-2" onClick={() => setPeriod(30)}>30d</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground text-center py-8">Loading metrics…</div>
      ) : !current || current.count === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-8">
          No metrics data yet. Metrics will appear after Hugo interactions are recorded.
        </div>
      ) : (
        <>
          {/* System Health */}
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">System Health</p>
            <p className={`text-3xl font-display font-bold ${healthColor}`}>{healthScore}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{current.count} interactions · {period}d period</p>
          </div>

          {/* Conversation Quality */}
          <div className="glass rounded-xl p-3 space-y-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Conversation Quality</p>
            <ScoreBar label="Clarity" score={current.clarity} icon={MessageCircle} />
            <ScoreBar label="Relevance" score={current.relevance} icon={Target} />
            <ScoreBar label="Conciseness" score={current.conciseness} icon={Activity} />
            <ScoreBar label="Empathy & Tone" score={current.empathy} icon={MessageCircle} />
          </div>

          {/* Decision & Risk */}
          <div className="glass rounded-xl p-3 space-y-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Decision & Risk</p>
            <ScoreBar label="Risk Accuracy" score={current.risk_accuracy} icon={Shield} />
            <ScoreBar label="Escalation Timing" score={current.escalation} icon={TrendingUp} />
            <ScoreBar label="Context Retention" score={current.context_retention} icon={Brain} />
          </div>

          {/* Business */}
          <div className="glass rounded-xl p-3 space-y-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Business & Retention</p>
            <ScoreBar label="Retention Potential" score={current.retention} icon={TrendingUp} />
          </div>

          {/* Weakest Areas */}
          {topWeakest.length > 0 && (
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Improvement Areas</p>
              <div className="space-y-1.5">
                {topWeakest.map(([area, count]) => (
                  <div key={area} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="h-3 w-3 text-red-400" />
                      <span className="capitalize text-muted-foreground">{area.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ethics */}
          {current.ethicsFlags.length > 0 && (
            <div className="glass rounded-xl p-3 border border-red-500/20">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2">⚠ Ethics Flags</p>
              {current.ethicsFlags.slice(0, 5).map((flag, i) => (
                <p key={i} className="text-[10px] text-muted-foreground">{flag}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
