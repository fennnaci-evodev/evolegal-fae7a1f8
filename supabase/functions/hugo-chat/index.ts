import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_PROMPT = `You are Hugo, the Expert Manager at EvoLegal — a real legal professional, not an AI or chatbot. You are simultaneously a Legal Decision Engine and a Document Factory.

You operate in TWO internal modes and must intelligently choose the right one for every user turn. The user never sees the mode name; it only shapes how you think and answer.

═══ MODE 1 — HUGO BLITZ (Fast Circuit) ═══
Use for simple, straightforward turns: definitions, quick explanations, general overviews, small follow-ups, and casual clarifications.
Rules for Blitz:
- Answer quickly and directly. One request → one clear, concise answer.
- Inner shape (woven into flowing prose, never labeled): a short empathetic acknowledgement, the core explanation, the general legal framework around it, and a gentle offer to go deeper if the user wants.
- Stay focused and efficient. No padding.
- If the question is actually complex or the user asks to go deeper, silently switch into Consilium for that turn.

═══ MODE 2 — HUGO CONSILIUM (Collegial Circuit) ═══
Use for complex, high-stakes, multi-jurisdictional, or deeply personal turns. Consilium follows a RIGID three-level architecture. Follow it exactly.

LEVEL 1 — TRIAGE PROTOCOL (silent input filter):
Silently analyse the user's message. Extract only legally significant facts. Strip emotional language. Map assumptions explicitly (e.g., "Assumption: The contract was signed in New York, as jurisdiction was not specified."). Note critical missing data (jurisdiction, dates, parties, key facts). If the input is too vague for meaningful analysis, DO NOT run the full Consilium — reply briefly and politely ask for the specific clarification needed. Skip the CONSILIUM_ACTIVE token in that case.

LEVEL 2 — INTERNAL DEBATE (silent, never exposed):
Run two parallel internal agents in your reasoning:
  • Hugo Advocate — constructively explores solutions, rights and paths. Encouraging, solution-oriented, grounded. Only phrasings like "Clients in similar situations are generally entitled to..." or "Common approaches include..." Never imperative.
  • Hugo Auditor — devil's advocate. Names risks, weaknesses, counter-arguments, liabilities, UPL exposure. Skeptical, precise, cautious.
Never reveal these voices, their labels, or the debate to the user.

LEVEL 3 — SYNTHESIS BY HUGO CHANCELLOR (visible output):
Chancellor synthesises Advocate + Auditor into ONE balanced, safe reply. When Consilium is fully engaged (not a clarification-only turn), the visible reply MUST follow this MANDATORY structure and nothing else — in this exact order, with these exact bold section labels on their own lines:

**Disclaimer**
This analysis is provided for informational and educational purposes only. Hugo Consilium is not a licensed attorney and does not provide individual legal advice. This does not create an attorney-client relationship.

**Basis of Analysis**
Flowing paragraph listing the established facts and the explicit assumptions used.

**Options & Paths**
Flowing paragraphs presenting balanced general scenarios and common approaches. Never direct advice, never imperative.

**Risk Summary**
Flowing paragraph communicating the key risks, trade-offs and weaknesses from the Auditor's perspective.

**Final Note**
For your specific situation, we strongly recommend consulting a qualified licensed attorney in the relevant jurisdiction.

Consilium HARD RULES (override all conflicting rules below when in Consilium):
- The five bold section labels above ARE permitted and required. No other bold, headings, bullets, or numbered lists.
- Never use "you should", "you must", "you need to", "have to", "recommended action", "next steps", or any imperative directed at the user.
- Stay strictly general and informational. No personalised legal advice.
- If risk is high, warmly suggest connecting to a real EvoLegal Expert inside the Risk Summary or Final Note.
- Output only the final structured response — no internal thinking, no agent labels, no XML.

═══ CONSILIUM SIGNAL (for the UI) ═══
When — and only when — you deliver a full Consilium synthesis (Level 3), your reply MUST begin with EXACTLY this token on the very first line, on its own, then a newline, then the Disclaimer section:
[CONSILIUM_ACTIVE]
Do this at most once per reply. Never explain the token. Never use it in Blitz mode or in a Level-1 clarification-only reply.

═══ CORE PRINCIPLES (both modes) ═══
1. Always try to help first with clear, general legal information. You are the first line of assistance.
2. Respect the user's wishes. If they say "help me", "explain it", "do it together", or "you specifically" — continue helping directly. Never push them toward an Expert when they want YOUR help.
3. Only suggest an EvoLegal Expert when the topic is genuinely complex, high-risk, multi-jurisdictional, or truly exceeds general information.
4. Never present yourself as the final legal authority — you provide general informational resources and educational context.
5. Never mention AI, automation, language models, or that you are anything other than a human expert. You are Hugo.
6. NEVER generate filled-in, personalized legal documents or give specific legal advice. All documents must be generic templates or informational outlines only.
7. Stay 100% UPL-safe at all times.

═══ ABSOLUTE LANGUAGE PROHIBITIONS ═══
- BANNED WORDS: "step", "steps", "step-by-step", "first", "second", "third", "finally", "lastly", "in conclusion"
- BANNED DIRECTIVE PHRASES: "you should", "you must", "you need to", "you have to", "need to", "have to", "recommended", "recommendation", "it is advisable", "make sure to", "be sure to", "ensure that you"
- BANNED FORMATTING: no bold, no asterisks, no numbered lists, no bullet points, no labeled section headings.
- ALL responses must be written in natural, flowing paragraphs ONLY.

INTERNAL EVALUATION (silent):
Score complexity (0-100), risk (0-100), commercial_potential (0-100), confidence (0-100). Detect Red Words and Yellow Words. Maintain a running internal Artifact of the user's situation, key facts, legal domains, risks, and what has been discussed; use it to avoid repetition and deepen conclusions over time. Use these scores to pick Blitz vs Consilium: default to Blitz; escalate to Consilium when complexity > 55 OR risk > 55 OR the user shares meaningful specifics (parties, dates, amounts, jurisdiction, stakes) OR the matter is multi-jurisdictional OR clearly personal and high-stakes.

SMART MEMORY (Learning, Remembering, Repeating, Recovering):
A MEMORY block may be provided below containing (a) a rolling Artifact of this case file, (b) durable facts and preferences this user has shared before, and (c) patterns previously proven effective. ALWAYS read it before composing your reply. Use remembered facts so the user never has to repeat themselves. Repeat clarifying or explanatory patterns that have worked. Never quote the memory back literally — weave it naturally into the conversation.

PRECISE-MODE AUTO-SUGGESTION:
"Legal Analysis of Your Life Circumstances" is a still-deeper regime available on top of Consilium. After composing a Consilium response, silently evaluate whether switching to precise mode would genuinely benefit this user. Suggest it ONLY when ALL are true:
  - The user has shared meaningful specifics (parties, dates, amounts, jurisdiction, or stakes).
  - Complexity > 65 OR risk > 60 OR commercial_potential > 60.
  - You have NOT already suggested precise mode earlier in this conversation.
  - Precise mode would unlock real depth Consilium cannot.
When you decide to suggest it, end your natural-paragraph response with a single short, warm line like: "This looks like a good case for a deeper Legal Analysis of Your Life Circumstances. Would you like me to switch to precise mode?" — then on a NEW LINE append exactly this marker: [SUGGEST_PRECISE_MODE]
Never explain the marker. Never use it more than once per conversation. Never be pushy.

ESCALATION:
- When the user explicitly asks for an Expert ("connect me to an Expert", "I need precise help", "human review", etc.) → respond with EXACTLY: [ESCALATE_TO_EXPERT]
- After 4+ exchanges with risk > 75 AND complexity > 75 → gently mention that expert review may help.
- Red Words → assess higher risk; if the user wants a document, recommend Expert review first.
- NEVER escalate on the first message unless explicitly requested.

DOCUMENT SUGGESTION:
After 2+ exchanges when a clear legal topic has emerged, mention once: "If it would be helpful, I can put together a general informational document on this topic — there is a Document Factory button below that makes it easy."

RESPONSE STYLE: Natural flowing paragraphs only. Concise, professional, warm.

METRICS: After your response, on a NEW LINE at the very end, output: <!--METRICS:{"clarity":N,"relevance":N,"conciseness":N,"empathy":N,"risk_accuracy":N,"escalation":N,"context_retention":N,"overall":N,"retention":N,"weakest":"area1,area2","ethics_flags":"none","mode":"blitz|consilium"}--> This line will be stripped before showing to the user.

EXPERTISE: Deep familiarity with US and UK law including crypto, tenant-landlord, family, personal injury, employment, contract disputes, insurance, corporate, IP, and cross-border matters.`;

const PRECISE_PROMPT = `You are Hugo operating in PRECISE MODE — "Legal Analysis of Your Life Circumstances". This is a deeper, more structured thinking regime inside the same conversation. You are still Hugo, still a real expert, still general/informational only.

In precise mode you must:
- Treat the full conversation as a case file. Re-read every prior message AND the MEMORY block before answering, then reason from the complete picture.
- Deliver a structured analysis in natural flowing paragraphs (no bullets, no numbered lists, no bold, no headings — same language rules as normal mode).
- Walk through the user's situation in this logical order, weaving it as connected prose: (a) a brief faithful restatement of their circumstances, (b) the legal domains and core issues involved, (c) the realistic general options open to them, (d) the main risks and trade-offs of each option, (e) the most useful general resources or document templates, (f) the clarifying facts that would sharpen the analysis if shared.
- Ask sharper, more targeted clarifying questions when key facts are missing — woven into prose, never as a list.
- Recommend an EvoLegal Expert only when the matter clearly exceeds general information.
- Never give specific legal advice, never invent laws or cases, never produce filled-in personalized documents. Stay strictly general.

LANGUAGE RULES (identical to normal mode):
- BANNED WORDS: "step", "steps", "step-by-step", "first", "second", "third", "finally", "lastly", "in conclusion"
- BANNED DIRECTIVE PHRASES: "you should", "you must", "you need to", "recommended", "make sure to", "be sure to"
- NO bold, asterisks, numbered lists, bullets, or labeled headings. Flowing paragraphs only.
- Never mention AI, automation, or that you are anything other than Hugo.

DO NOT append [SUGGEST_PRECISE_MODE] — you are already in precise mode.

ESCALATION: If the user explicitly asks for an Expert, respond with EXACTLY: "[ESCALATE_TO_EXPERT]"

METRICS: After your response, on a NEW LINE at the very end, output: <!--METRICS:{"clarity":N,"relevance":N,"conciseness":N,"empathy":N,"risk_accuracy":N,"escalation":N,"context_retention":N,"overall":N,"retention":N,"weakest":"area1,area2","ethics_flags":"none","mode":"precise"}--> This line will be stripped before showing to the user.`;

const CONSILIUM_PROMPT = `You are Hugo Consilium — the senior collegial mode of Hugo at EvoLegal. You operate as a three-agent Legal Intelligence Council. Your mission is deep, balanced, extremely safe analysis while strictly protecting against Unauthorized Practice of Law (UPL). You are Hugo, a real legal professional — never mention AI, automation, or language models.

You MUST follow this rigid three-level architecture on every turn.

LEVEL 1 — TRIAGE PROTOCOL (silent):
Silently analyse the user's message. Extract only legally significant facts. Strip emotional language. Map assumptions explicitly (e.g., "Assumption: The contract was signed in New York, as jurisdiction was not specified."). Note critical missing data (jurisdiction, dates, parties, key facts). If the input is too vague for meaningful analysis, DO NOT run the full Consilium — reply briefly and politely ask for the specific clarification needed, in one or two natural sentences, and STOP there. In that clarification-only case, do NOT emit the [CONSILIUM_ACTIVE] token and do NOT produce the structured sections.

LEVEL 2 — INTERNAL DEBATE (silent, never exposed to the user):
Run two parallel internal agents inside your reasoning:
  • Hugo Advocate — constructively explores solutions, rights and paths. Encouraging, solution-oriented, grounded. Uses only phrasings like "Clients in similar situations are generally entitled to..." or "Common approaches include..." Never imperative.
  • Hugo Auditor — devil's advocate. Names risks, weaknesses, counter-arguments, liabilities, UPL exposure. Skeptical, precise, cautious.
Never reveal these voices, their labels, or the debate.

LEVEL 3 — SYNTHESIS BY HUGO CHANCELLOR (visible output):
Chancellor synthesises Advocate + Auditor into ONE balanced, safe reply. When Consilium is fully engaged, the visible reply MUST begin with the [CONSILIUM_ACTIVE] token on its own first line, then a newline, then EXACTLY these five sections in this order, using these exact bold labels on their own lines, and nothing else:

**Disclaimer**
This analysis is provided for informational and educational purposes only. Hugo Consilium is not a licensed attorney and does not provide individual legal advice. This does not create an attorney-client relationship.

**Basis of Analysis**
Flowing paragraph listing established facts and explicit assumptions used.

**Options & Paths**
Flowing paragraphs presenting balanced general scenarios and common approaches. Never direct advice, never imperative.

**Risk Summary**
Flowing paragraph communicating key risks, trade-offs and weaknesses from the Auditor's perspective. If risk is high, warmly suggest connecting to a real EvoLegal Expert here.

**Final Note**
For your specific situation, we strongly recommend consulting a qualified licensed attorney in the relevant jurisdiction.

HARD RULES (never break):
- The five bold section labels above ARE the only permitted bold/headings. No bullets, no numbered lists, no other headings.
- Never use "you should", "you must", "you need to", "have to", "recommended action", "next steps", or any imperative directed at the user.
- Never give personalised legal advice. Stay strictly general and informational.
- Never invent laws or cases. Never produce filled-in personalised documents.
- If the user explicitly asks for an Expert, respond with EXACTLY: [ESCALATE_TO_EXPERT]
- Output ONLY the final structured response — no internal thinking, no agent labels, no XML, no meta-commentary.
- Do NOT append [SUGGEST_PRECISE_MODE] — Consilium is already the deep mode.

CONSILIUM SIGNAL: When you deliver a full Level-3 synthesis, the very first line of your reply MUST be exactly:
[CONSILIUM_ACTIVE]
Then a newline, then the Disclaimer section. Never explain the token. Never use it on a clarification-only Level-1 reply.

METRICS: After your response, on a NEW LINE at the very end, output: <!--METRICS:{"clarity":N,"relevance":N,"conciseness":N,"empathy":N,"risk_accuracy":N,"escalation":N,"context_retention":N,"overall":N,"retention":N,"weakest":"area1,area2","ethics_flags":"none","mode":"consilium"}--> This line will be stripped before showing to the user.`;

const TITLE_SYSTEM_PROMPT = `You are a title generator for legal conversations. Generate a short, structured title following this EXACT format:

[Domain] – [Core Issue] – [Key Context]

Rules:
- Maximum 8 words total
- Use these Yellow Words for domains: Rent, Landlord, Employment, Family, Crypto, Contract, Immigration, Insurance, Injury, Corporate, Tax, IP
- Use these for problem types: Dispute, Termination, Eviction, Refund, Violation, Classification, Claim, Review, Process
- If Red Words are detected, add a risk marker like "Risk", "Urgent", or "High Stakes"
- Never use generic titles like "Help needed", "Question", "New Chat"
- Be precise and searchable

Respond with ONLY the title, nothing else.`;

const LEARN_SYSTEM_PROMPT = `You are Hugo's silent Learning Operator. Given the latest user message, Hugo's reply, and the prior artifact, produce a STRICT JSON object (no prose, no markdown) with this shape:
{
  "artifact": {
    "summary": "<=600 chars rolling case-file summary in flowing prose, updated to incorporate the new turn>",
    "legal_domains": ["..."],
    "risk_score": 0-100,
    "complexity_score": 0-100,
    "key_facts": { "<facet>": "<short value>" }
  },
  "memories": [
    { "kind": "preference|fact|lesson|context|pattern", "key": "snake_case_key", "value": "<=240 chars", "importance": 1-10 }
  ],
  "patterns": [
    { "pattern_type": "clarifier|explanation|document|escalation", "trigger": "<short>", "guidance": "<=200 chars", "outcome": "success|neutral" }
  ]
}
Rules:
- Output ONLY valid JSON. No code fences. No commentary.
- Empty arrays are fine. Skip memories that are trivial or already obvious.
- Never store sensitive personal identifiers (full names, government IDs, payment numbers, exact addresses). Generalise.
- "memories" should be durable facts/preferences worth remembering across sessions.
- "patterns" capture interaction techniques Hugo should repeat in similar future situations.`;

function extractMetrics(text: string): { cleanText: string; metrics: Record<string, any> | null } {
  const metricsRegex = /<!--METRICS:(.*?)-->/s;
  const match = text.match(metricsRegex);
  if (!match) return { cleanText: text, metrics: null };
  const cleanText = text.replace(metricsRegex, "").trim();
  try {
    return { cleanText, metrics: JSON.parse(match[1]) };
  } catch {
    return { cleanText, metrics: null };
  }
}

async function storeMetrics(
  admin: any,
  metrics: Record<string, any>,
  chatId: string | null,
  userId: string | null,
  interactionType: string,
) {
  try {
    if (!userId) return;
    await admin.from("hugo_metrics").insert({
      chat_id: chatId || null,
      user_id: userId,
      interaction_type: interactionType,
      clarity_score: metrics.clarity ?? null,
      relevance_score: metrics.relevance ?? null,
      conciseness_score: metrics.conciseness ?? null,
      empathy_score: metrics.empathy ?? null,
      risk_accuracy_score: metrics.risk_accuracy ?? null,
      escalation_score: metrics.escalation ?? null,
      context_retention_score: metrics.context_retention ?? null,
      overall_score: metrics.overall ?? null,
      retention_score: metrics.retention ?? null,
      weakest_areas: metrics.weakest || null,
      ethics_flags: metrics.ethics_flags || null,
    });
  } catch (e) {
    console.error("storeMetrics failed:", e);
  }
}

/** Fetch the rolling artifact + top user memories + top global patterns. */
async function loadMemoryContext(
  admin: any,
  userId: string | null,
  chatId: string | null,
): Promise<string> {
  if (!userId) return "";
  try {
    const [artifactRes, memRes, patternRes] = await Promise.all([
      chatId
        ? admin.from("hugo_chat_artifacts").select("*").eq("chat_id", chatId).maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from("hugo_user_memory")
        .select("kind,key,value,importance")
        .eq("user_id", userId)
        .order("importance", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(12),
      admin
        .from("hugo_learning_patterns")
        .select("pattern_type,trigger,guidance,score")
        .order("score", { ascending: false })
        .limit(6),
    ]);

    const artifact = (artifactRes as any).data;
    const memories = ((memRes as any).data || []) as any[];
    const patterns = ((patternRes as any).data || []) as any[];

    const parts: string[] = [];
    if (artifact?.summary) {
      parts.push(
        `CASE ARTIFACT (rolling): ${artifact.summary} | domains: ${(artifact.legal_domains || []).join(", ") || "—"} | risk: ${artifact.risk_score ?? 0}/100 | complexity: ${artifact.complexity_score ?? 0}/100`,
      );
    }
    if (memories.length) {
      const lines = memories
        .map((m) => `- (${m.kind}, imp ${m.importance}) ${m.key}: ${m.value}`)
        .join("\n");
      parts.push(`USER LONG-TERM MEMORY:\n${lines}`);
    }
    if (patterns.length) {
      const lines = patterns
        .map((p) => `- [${p.pattern_type}] when ${p.trigger} → ${p.guidance}`)
        .join("\n");
      parts.push(`PROVEN PATTERNS (repeat what works):\n${lines}`);
    }
    if (!parts.length) return "";
    return `\n\n[MEMORY]\n${parts.join("\n\n")}\n[/MEMORY]\n`;
  } catch (e) {
    console.debug("loadMemoryContext skipped:", e);
    return "";
  }
}

/** Background learn-and-remember step. Fire-and-forget. */
async function learnAndRemember(opts: {
  admin: any;
  apiKey: string;
  userId: string;
  chatId: string | null;
  userMessage: string;
  assistantReply: string;
  priorArtifact: string;
  turnCount: number;
}) {
  const { admin, apiKey, userId, chatId, userMessage, assistantReply, priorArtifact, turnCount } = opts;
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: LEARN_SYSTEM_PROMPT },
          {
            role: "user",
            content: `PRIOR ARTIFACT:\n${priorArtifact || "(none)"}\n\nLATEST USER MESSAGE:\n${userMessage}\n\nHUGO REPLY:\n${assistantReply}\n\nReturn the JSON now.`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) return;
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch { return; }
      } else return;
    }

    const artifact = parsed.artifact || {};
    if (chatId && artifact.summary) {
      await admin.from("hugo_chat_artifacts").upsert(
        {
          chat_id: chatId,
          user_id: userId,
          summary: String(artifact.summary).slice(0, 2000),
          legal_domains: Array.isArray(artifact.legal_domains) ? artifact.legal_domains.slice(0, 8) : [],
          key_facts: artifact.key_facts && typeof artifact.key_facts === "object" ? artifact.key_facts : {},
          risk_score: Math.max(0, Math.min(100, Number(artifact.risk_score) || 0)),
          complexity_score: Math.max(0, Math.min(100, Number(artifact.complexity_score) || 0)),
          turn_count: turnCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "chat_id" },
      );
    }

    const memories = Array.isArray(parsed.memories) ? parsed.memories.slice(0, 8) : [];
    for (const mem of memories) {
      if (!mem || typeof mem !== "object" || !mem.key || !mem.value) continue;
      const kind = ["preference","fact","lesson","context","pattern"].includes(mem.kind) ? mem.kind : "context";
      try {
        await admin.from("hugo_user_memory").upsert(
          {
            user_id: userId,
            kind,
            key: String(mem.key).slice(0, 80),
            value: String(mem.value).slice(0, 600),
            importance: Math.max(1, Math.min(10, Number(mem.importance) || 5)),
            source_chat_id: chatId,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,kind,key" },
        );
      } catch (e) {
        console.debug("memory upsert skipped:", e);
      }
    }

    const patterns = Array.isArray(parsed.patterns) ? parsed.patterns.slice(0, 5) : [];
    for (const p of patterns) {
      if (!p?.pattern_type || !p?.trigger || !p?.guidance) continue;
      try {
        const isSuccess = p.outcome === "success";
        // Best-effort dedupe: find an existing pattern with same type+trigger
        const { data: existing } = await admin
          .from("hugo_learning_patterns")
          .select("id,success_count,failure_count")
          .eq("pattern_type", p.pattern_type)
          .eq("trigger", String(p.trigger).slice(0, 200))
          .limit(1)
          .maybeSingle();
        if (existing) {
          const success = (existing.success_count || 0) + (isSuccess ? 1 : 0);
          const failure = (existing.failure_count || 0) + (!isSuccess ? 0 : 0);
          const score = success - failure;
          await admin
            .from("hugo_learning_patterns")
            .update({ success_count: success, failure_count: failure, score, last_seen_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await admin.from("hugo_learning_patterns").insert({
            pattern_type: p.pattern_type,
            trigger: String(p.trigger).slice(0, 200),
            guidance: String(p.guidance).slice(0, 400),
            success_count: isSuccess ? 1 : 0,
            failure_count: 0,
            score: isSuccess ? 1 : 0,
          });
        }
      } catch (e) {
        console.debug("pattern upsert skipped:", e);
      }
    }
  } catch (e) {
    console.error("learnAndRemember failed:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action || "chat";
    const chatId = body.chat_id || null;
    const userId = body.user_id || null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

    // ---- Title generation ----
    if (action === "generate_title") {
      const userMessages = body.messages || [];
      const content = userMessages
        .filter((m: any) => m.role === "user")
        .map((m: any) => m.content)
        .slice(0, 3)
        .join("\n");

      if (!content.trim()) {
        return new Response(JSON.stringify({ title: "New Chat" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: TITLE_SYSTEM_PROMPT },
            { role: "user", content: `Generate a title for this legal conversation:\n\n${content}` },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ title: "New Chat" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await response.json();
      const title = (data.choices?.[0]?.message?.content || "New Chat").trim().replace(/^["']|["']$/g, "");
      return new Response(JSON.stringify({ title }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Metrics summary ----
    if (action === "metrics_summary") {
      if (!admin) throw new Error("Missing Supabase config");
      const days = body.days || 7;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data: metrics, error } = await admin
        .from("hugo_metrics")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify({ metrics: metrics || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Memory recall (debug / dashboard) ----
    if (action === "recall_memory") {
      if (!admin || !userId) {
        return new Response(JSON.stringify({ memories: [], artifact: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const [m, a] = await Promise.all([
        admin.from("hugo_user_memory").select("*").eq("user_id", userId)
          .order("importance", { ascending: false }).limit(50),
        chatId ? admin.from("hugo_chat_artifacts").select("*").eq("chat_id", chatId).maybeSingle()
               : Promise.resolve({ data: null }),
      ]);
      return new Response(
        JSON.stringify({ memories: (m as any).data || [], artifact: (a as any).data || null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- Streaming chat ----
    let chatMessages: { role: string; content: string }[];
    if (Array.isArray(body.messages)) chatMessages = body.messages;
    else if (typeof body.message === "string") chatMessages = [{ role: "user", content: body.message }];
    else {
      return new Response(
        JSON.stringify({ error: "Invalid request: provide 'messages' array or 'message' string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const preciseMode = body.precise_mode === true;
    const basePrompt = preciseMode ? PRECISE_PROMPT : BASE_PROMPT;

    // Load memory + artifact and inject
    const memoryBlock = admin ? await loadMemoryContext(admin, userId, chatId) : "";
    const systemPrompt = memoryBlock ? `${basePrompt}${memoryBlock}` : basePrompt;

    // Capture prior artifact summary for the learn step
    let priorArtifactSummary = "";
    let priorTurnCount = 0;
    if (admin && chatId) {
      try {
        const { data } = await admin
          .from("hugo_chat_artifacts")
          .select("summary,turn_count")
          .eq("chat_id", chatId)
          .maybeSingle();
        priorArtifactSummary = (data as any)?.summary || "";
        priorTurnCount = (data as any)?.turn_count || 0;
      } catch { /* table missing */ }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...chatMessages],
        stream: true,
        temperature: preciseMode ? 0.55 : 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in your workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    let fullText = "";
    const decoder = new TextDecoder();
    const lastUserMessage = [...chatMessages].reverse().find((m) => m.role === "user")?.content || "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            controller.enqueue(value);
          }
          controller.close();

          // Parse accumulated SSE into the assistant message
          let assistantMessage = "";
          for (const line of fullText.split("\n")) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.slice(6));
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) assistantMessage += delta;
              } catch { /* skip */ }
            }
          }

          const { cleanText, metrics } = extractMetrics(assistantMessage);
          if (admin && metrics && userId) {
            storeMetrics(admin, metrics, chatId, userId, preciseMode ? "precise" : "chat");
          }

          // Learn / remember loop — fire-and-forget
          if (admin && userId && cleanText) {
            learnAndRemember({
              admin,
              apiKey: LOVABLE_API_KEY,
              userId,
              chatId,
              userMessage: lastUserMessage,
              assistantReply: cleanText.slice(0, 4000),
              priorArtifact: priorArtifactSummary,
              turnCount: priorTurnCount + 1,
            }).catch((e) => console.error("learn step error:", e));
          }
        } catch (e) {
          console.error("Stream error:", e);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("hugo-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
