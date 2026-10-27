import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireSession, SafeError } from "../_shared/safety.ts";
import { anonymize } from "../_shared/anonymize.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { admin } = await requireSession(req, true);
    const { data: consent } = await admin.from("hugo_training_consent").select("user_id").eq("allow_training_curation", true);
    const users = (consent ?? []).map((c) => c.user_id);
    if (!users.length) return json({ staged: 0, consenting_users: 0 });
    const { data: existing } = await admin.from("hugo_curation_staging").select("source_id");
    const seen = new Set((existing ?? []).map((e) => e.source_id));
    const { data: profiles } = await admin.from("profiles").select("id, first_name, last_name").in("id", users);
    const names = new Map((profiles ?? []).map((p) => [p.id, [p.first_name ?? "", p.last_name ?? ""]]));
    const rows: Record<string, unknown>[] = [];
    const clean = (userId: string, t: string) => anonymize(t, names.get(userId) ?? []);

    const { data: fb } = await admin.from("hugo_feedback").select("id, message_id, chat_id, user_id, rating, reasons").in("user_id", users).limit(1000);
    for (const f of fb ?? []) {
      if (seen.has(f.message_id)) continue;
      const { data: msg } = await admin.from("hugo_messages").select("content, created_at, role").eq("id", f.message_id).maybeSingle();
      if (!msg || msg.role !== "assistant") continue;
      const { data: q } = await admin.from("hugo_messages").select("content").eq("chat_id", f.chat_id).eq("role", "user").lt("created_at", msg.created_at).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!q) continue;
      const p = clean(f.user_id, q.content), r = clean(f.user_id, msg.content);
      const positive = f.rating === "positive";
      rows.push({ source_user_id: f.user_id, source_kind: "message", source_id: f.message_id, track: positive ? "sft" : "dpo", prompt: p.text, chosen: positive ? r.text : null, rejected: positive ? null : r.text, reasons: f.reasons ?? [], redactions: p.redactions + r.redactions });
    }

    const { data: afb } = await admin.from("hugo_audit_feedback").select("audit_id, user_id, rating, reasons").in("user_id", users).limit(500);
    for (const f of afb ?? []) {
      if (seen.has(f.audit_id)) continue;
      const { data: a } = await admin.from("hugo_contract_audits").select("analysis, essence").eq("id", f.audit_id).eq("status", "complete").maybeSingle();
      if (!a?.analysis || !a.essence) continue;
      const an = a.analysis as { summary?: string; overall_risk_score?: number; clauses?: { title: string; risk_score: number; recommendation: string }[] };
      const out = JSON.stringify({ summary: an.summary, overall_risk_score: an.overall_risk_score, clauses: (an.clauses ?? []).map((c) => ({ title: c.title, risk_score: c.risk_score, recommendation: c.recommendation })) });
      const p = clean(f.user_id, `Assess contract risk from this contract essence: ${JSON.stringify(a.essence)}`), r = clean(f.user_id, out);
      const positive = f.rating === "positive";
      rows.push({ source_user_id: f.user_id, source_kind: "audit", source_id: f.audit_id, track: positive ? "sft" : "dpo", prompt: p.text, chosen: positive ? r.text : null, rejected: positive ? null : r.text, reasons: f.reasons ?? [], redactions: p.redactions + r.redactions });
    }

    if (rows.length) {
      const { error } = await admin.from("hugo_curation_staging").upsert(rows, { onConflict: "source_kind,source_id", ignoreDuplicates: true });
      if (error) throw new SafeError(500, "Candidates could not be staged.");
    }
    return json({ staged: rows.length, consenting_users: users.length });
  } catch (e) {
    const status = e instanceof SafeError ? e.status : 500;
    return json({ error: e instanceof SafeError ? e.message : "Curation failed." }, status);
  }
});
