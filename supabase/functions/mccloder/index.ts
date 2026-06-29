// McCloder — System Guardian & Improvement Agent (analysis-only)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GUARDIAN_PROMPT = `You are McCloder, the autonomous System Guardian and Improvement Agent of EvoLegal.

Your mission: continuously assess, review, and improve the EvoLegal system. You are calm, precise, technical, and constructive. You think like a senior staff engineer + SRE + security auditor + UX reviewer rolled into one.

OUTPUT CONTRACT — ALWAYS return strict JSON with this exact shape:
{
  "summary": "1–2 sentence executive summary",
  "health_score": 0-100,
  "findings": [
    { "severity": "critical|high|medium|low|info",
      "area": "performance|security|ux|architecture|tests|reliability|cost|other",
      "title": "short title",
      "detail": "what is wrong and why it matters",
      "suggestion": "concrete actionable fix" }
  ],
  "wins": ["short positive observation", "..."],
  "next_cycle_focus": ["what McCloder should prioritise next cycle"],
  "lessons": ["short durable lesson learned this cycle"]
}

Never invent metrics. If data is missing, say so in a finding. Be concise — every finding earns its place.`;

const REVIEW_PROMPT = `You are McCloder reviewing a code snippet for EvoLegal. Identify bugs, security risks, performance issues, duplication, poor structure, missing tests, and UX impact. Return strict JSON:
{
  "summary": "short overall verdict",
  "quality_score": 0-100,
  "findings": [
    { "severity": "critical|high|medium|low|info",
      "category": "bug|security|performance|maintainability|tests|ux|style",
      "line_hint": "approx line or symbol, optional",
      "title": "...",
      "detail": "...",
      "suggestion": "concrete fix" }
  ],
  "refactor_suggestion": "optional rewritten snippet or null",
  "test_ideas": ["unit test cases worth adding"]
}`;

async function callAI(systemPrompt: string, userPrompt: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { summary: "Parse error", raw: content };
  }
}

async function gatherSystemSignals() {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const since = new Date(Date.now() - 7 * 86400000).toISOString();

  const signals: Record<string, unknown> = { window: "7d", collected_at: new Date().toISOString() };

  try {
    const { data, error } = await admin
      .from("hugo_metrics")
      .select("overall_score, clarity_score, risk_accuracy_score, escalation_score, retention_score, weakest_areas, ethics_flags, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);
    signals.hugo_metrics = error ? { error: error.message } : {
      count: data?.length ?? 0,
      avg_overall: avg(data, "overall_score"),
      avg_clarity: avg(data, "clarity_score"),
      avg_risk: avg(data, "risk_accuracy_score"),
      avg_retention: avg(data, "retention_score"),
      ethics_flag_count: (data ?? []).filter((r: any) => r.ethics_flags && r.ethics_flags !== "none").length,
      top_weakest: topWeakest(data),
    };
  } catch (e: any) { signals.hugo_metrics = { error: String(e?.message ?? e) }; }

  try {
    const { data, error } = await admin.from("hugo_feedback" as any).select("rating").gte("created_at", since);
    if (!error) {
      const arr = (data as any[]) ?? [];
      signals.feedback = {
        total: arr.length,
        positive: arr.filter(f => f.rating === "positive").length,
        negative: arr.filter(f => f.rating === "negative").length,
      };
    } else { signals.feedback = { error: error.message }; }
  } catch (e: any) { signals.feedback = { error: String(e?.message ?? e) }; }

  try {
    const { count, error } = await admin.from("requests").select("id", { count: "exact", head: true }).gte("created_at", since);
    signals.requests_7d = error ? { error: error.message } : count;
  } catch (e: any) { signals.requests_7d = { error: String(e?.message ?? e) }; }

  try {
    const { count: pending } = await admin.from("requests").select("id", { count: "exact", head: true }).eq("status", "pending");
    signals.requests_pending = pending ?? 0;
  } catch { /* ignore */ }

  return signals;
}

function avg(rows: any[] | null, key: string) {
  if (!rows?.length) return null;
  const vals = rows.map(r => r?.[key]).filter((v: any) => typeof v === "number");
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
function topWeakest(rows: any[] | null) {
  const counts: Record<string, number> = {};
  for (const r of rows ?? []) {
    if (!r?.weakest_areas) continue;
    String(r.weakest_areas).split(",").map(s => s.trim()).filter(Boolean).forEach(a => {
      counts[a] = (counts[a] ?? 0) + 1;
    });
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "assess";

    if (action === "assess") {
      const signals = await gatherSystemSignals();
      const prior = Array.isArray(body.prior_lessons) ? body.prior_lessons.slice(-15) : [];
      const userPrompt = `Run an assessment cycle for EvoLegal.

SYSTEM SIGNALS (last 7 days):
${JSON.stringify(signals, null, 2)}

PRIOR LESSONS McCLODER REMEMBERS:
${prior.length ? prior.map((l: string, i: number) => `${i + 1}. ${l}`).join("\n") : "(none yet — this is an early cycle)"}

Produce the JSON report.`;
      const report = await callAI(GUARDIAN_PROMPT, userPrompt);
      return new Response(JSON.stringify({ ok: true, signals, report }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_pr") {
      const report = body.report ?? {};
      const signals = body.signals ?? {};
      const PR_PROMPT = `You are McCloder generating a ready-to-use GitHub Pull Request from a system analysis report. Output strict JSON:
{
  "title": "conventional-commit style PR title (refactor: ... | fix: ... | feat: ... | perf: ... | chore: ...)",
  "branch_name": "kebab-case branch name (e.g. refactor/chat-persistence)",
  "description": "Full markdown PR body with sections: ## Problem, ## Proposed Solution, ## Files Likely Changed, ## Expected Impact (performance/stability/UX/security), ## Testing Notes, ## Risks & Rollback",
  "patch_suggestions": [
    { "file": "relative/path.ts", "change_summary": "what to change", "diff_hint": "optional pseudo-diff or before/after snippet" }
  ],
  "commit_message": "conventional commit message body",
  "self_evaluation": {
    "usefulness": 0-100,
    "safety": 0-100,
    "correctness_confidence": 0-100,
    "improvement_notes": ["how future suggestions can be better"]
  },
  "ci_notes": "short note about how this PR fits a GitHub Actions / CI/CD pipeline"
}
Be concrete. Reference actual finding titles. If patch content is unknown, leave diff_hint empty but keep change_summary specific.`;
      const userPrompt = `Generate a PR package from the latest McCloder report.\n\nREPORT:\n${JSON.stringify(report, null, 2)}\n\nSIGNALS:\n${JSON.stringify(signals, null, 2)}`;
      const pr = await callAI(PR_PROMPT, userPrompt);
      return new Response(JSON.stringify({ ok: true, pr }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "review") {
      const code = String(body.code ?? "").slice(0, 18000);
      const context = String(body.context ?? "").slice(0, 1000);
      if (!code.trim()) {
        return new Response(JSON.stringify({ ok: false, error: "code is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userPrompt = `Review this code.

CONTEXT: ${context || "(none)"}

CODE:
\`\`\`
${code}
\`\`\`

Return the JSON report.`;
      const report = await callAI(REVIEW_PROMPT, userPrompt);
      return new Response(JSON.stringify({ ok: true, report }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
