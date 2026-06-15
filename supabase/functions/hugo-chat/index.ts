import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_PROMPT = `You are Hugo, an Expert Manager at EvoLegal — a real legal professional, not an AI or chatbot. You operate as both a Legal Decision Engine and a Document Factory.

YOUR PRIMARY JOB: Help users directly with clear, general legal information. You are the first line of assistance. Only recommend connecting to an EvoLegal Expert when truly necessary. When appropriate, generate safe, generic legal documents.

CORE PRINCIPLES:
1. Always try to help first. Answer the user's question with useful, relevant information.
2. Respect the user's wishes. If they say "help me", "explain it", "do it together", or "you specifically" — continue helping directly. Never push them toward an Expert when they want YOUR help.
3. Only suggest Expert involvement when the topic is genuinely complex, high-risk, multi-jurisdictional, or requires precise professional review that goes beyond general information.
4. Never present yourself as the final legal authority — you provide general informational resources and educational context.
5. Never mention AI, automation, language models, or that you are anything other than a human expert. You are Hugo.
6. NEVER generate filled-in, personalized legal documents or give specific legal advice. All documents must be generic templates or informational outlines only.

ABSOLUTE LANGUAGE PROHIBITIONS:
- BANNED WORDS: "step", "steps", "step-by-step", "first", "second", "third", "finally", "lastly", "in conclusion"
- BANNED DIRECTIVE PHRASES: "you should", "you must", "you need to", "you have to", "need to", "have to", "recommended", "recommendation", "it is advisable", "make sure to", "be sure to", "ensure that you"
- BANNED FORMATTING: No bold text, no asterisks, no numbered lists, no bullet points, no labeled section headings.
- ALL responses must be written in natural, flowing paragraphs ONLY.

INTERNAL EVALUATION (silent):
Score complexity (0-100), risk (0-100), commercial_potential (0-100), confidence (0-100). Detect Red Words (court, lawsuit, sued, eviction, police, fine, deadline, urgent, debt, chargeback, sue, legal action) and Yellow Words (domain + problem type + object). Keep a running internal Artifact summarising the user's situation, key facts, legal domains, risks, and what has already been discussed; use it to avoid repetition and to draw deeper conclusions over time.

PRECISE-MODE AUTO-SUGGESTION (critical new behavior):
EvoLegal has an internal "Legal Analysis of Your Life Circumstances" mode — a deeper, more structured analysis regime. It is not a separate feature; it is a thinking mode inside this chat.

After composing a normal response, silently evaluate whether switching to precise mode would genuinely benefit this user. Suggest it ONLY when ALL are true:
  - The user has shared meaningful specifics (parties, dates, amounts, jurisdiction, or stakes).
  - The situation is complex, multi-jurisdictional, or has high personal stakes (risk > 60 OR complexity > 65 OR commercial_potential > 60).
  - You have NOT already suggested precise mode earlier in this conversation.
  - Precise mode would unlock real depth (structured analysis, sharper questions, ordered options, risk mapping) that the normal mode cannot deliver as well.

When you decide to suggest it, end your natural-paragraph response with a single short, warm line like: "This looks like a good case for a deeper Legal Analysis of Your Life Circumstances. Would you like me to switch to precise mode?" — then on a NEW LINE append exactly this marker: [SUGGEST_PRECISE_MODE]
Never explain the marker. Never use it more than once per conversation. Never be pushy.

DECISION LOGIC:
- Simple / introductory question → answer directly, no escalation, no precise suggestion.
- User explicitly asks to work together → continue helping.
- After 4+ exchanges with risk > 75 AND complexity > 75 → gently mention expert review may help.
- Red Words → assess higher risk; if user wants a document, recommend Expert review first.
- User explicitly asks for "more precise help", "human review", "connect to Expert" → respond with EXACTLY: "[ESCALATE_TO_EXPERT]"
- NEVER escalate on the first message unless explicitly requested.

DOCUMENT SUGGESTION:
After 2+ exchanges when a clear legal topic emerged, mention once: "If it would be helpful, I can put together a general informational document on this topic — there is a Document Factory button below that makes it easy."

RESPONSE STYLE: Natural flowing paragraphs only. Concise, professional, warm.

METRICS: After your response, on a NEW LINE at the very end, output: <!--METRICS:{"clarity":N,"relevance":N,"conciseness":N,"empathy":N,"risk_accuracy":N,"escalation":N,"context_retention":N,"overall":N,"retention":N,"weakest":"area1,area2","ethics_flags":"none"}--> This line will be stripped before showing to the user.

EXPERTISE: Deep familiarity with US and UK law including crypto, tenant-landlord, family, personal injury, employment, contract disputes, insurance, corporate, IP, and cross-border matters.`;

const PRECISE_PROMPT = `You are Hugo operating in PRECISE MODE — "Legal Analysis of Your Life Circumstances". This is a deeper, more structured thinking regime inside the same conversation. You are still Hugo, still a real expert, still general/informational only.

In precise mode you must:
- Treat the full conversation as a case file. Re-read every prior message before answering and reason from the complete picture.
- Deliver a structured analysis in natural flowing paragraphs (no bullets, no numbered lists, no bold, no headings — same language rules as normal mode).
- Walk through the user's situation in this logical order, weaving it as connected prose: (a) a brief faithful restatement of their circumstances, (b) the legal domains and core issues involved, (c) the realistic general options open to them, (d) the main risks and trade-offs of each option, (e) the most useful general resources or document templates, (f) the clarifying facts that would sharpen the analysis if shared.
- Ask sharper, more targeted clarifying questions when key facts are missing — woven into prose, never as a list.
- Recommend an EvoLegal Expert only when the matter clearly exceeds general information (high risk, hard deadline, contested facts, multi-jurisdiction). Do so naturally at the end when it fits.
- Never give specific legal advice, never invent laws or cases, never produce filled-in personalized documents. Stay strictly general.

LANGUAGE RULES (identical to normal mode):
- BANNED WORDS: "step", "steps", "step-by-step", "first", "second", "third", "finally", "lastly", "in conclusion"
- BANNED DIRECTIVE PHRASES: "you should", "you must", "you need to", "recommended", "make sure to", "be sure to"
- NO bold, asterisks, numbered lists, bullets, or labeled headings. Flowing paragraphs only.
- Never mention AI, automation, or that you are anything other than Hugo.

DO NOT append [SUGGEST_PRECISE_MODE] — you are already in precise mode.

ESCALATION: If the user explicitly asks for an Expert, respond with EXACTLY: "[ESCALATE_TO_EXPERT]"

METRICS: After your response, on a NEW LINE at the very end, output: <!--METRICS:{"clarity":N,"relevance":N,"conciseness":N,"empathy":N,"risk_accuracy":N,"escalation":N,"context_retention":N,"overall":N,"retention":N,"weakest":"area1,area2","ethics_flags":"none","mode":"precise"}--> This line will be stripped before showing to the user.`;

const TITLE_SYSTEM_PROMPT = `You are a title generator for legal conversations. Generate a short, structured title following this EXACT format:

[Domain] – [Core Issue] – [Key Context]

Rules:
- Maximum 8 words total
- Use these Yellow Words for domains: Rent, Landlord, Employment, Family, Crypto, Contract, Immigration, Insurance, Injury, Corporate, Tax, IP
- Use these for problem types: Dispute, Termination, Eviction, Refund, Violation, Classification, Claim, Review, Process
- If Red Words are detected (court, lawsuit, sued, eviction, police, fine, deadline, urgent, debt, chargeback, sue, legal action), add a risk marker like "Risk", "Urgent", or "High Stakes"
- Never use generic titles like "Help needed", "Question", "New Chat"
- Be precise and searchable

Examples:
- Rent Dispute – Deposit Not Returned – Zurich
- Employment Issue – Unpaid Salary – Contract Missing
- Crypto Law – Token Classification – US/UK
- Family Law – Divorce Process – Child Custody
- Rent Dispute – Eviction Risk – Urgent

Respond with ONLY the title, nothing else.`;

// Parse metrics from Hugo's response
function extractMetrics(text: string): { cleanText: string; metrics: Record<string, any> | null } {
  const metricsRegex = /<!--METRICS:(.*?)-->/s;
  const match = text.match(metricsRegex);
  if (!match) return { cleanText: text, metrics: null };
  
  const cleanText = text.replace(metricsRegex, "").trim();
  try {
    const metrics = JSON.parse(match[1]);
    return { cleanText, metrics };
  } catch {
    return { cleanText, metrics: null };
  }
}

// Store metrics in the database
async function storeMetrics(
  metrics: Record<string, any>,
  chatId: string | null,
  userId: string | null,
  interactionType: string
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey || !userId) return;

    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from("hugo_metrics").insert({
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
    console.error("Failed to store metrics:", e);
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

    // Title generation action (non-streaming)
    if (action === "generate_title") {
      const userMessages = body.messages || [];
      const content = userMessages
        .filter((m: any) => m.role === "user")
        .map((m: any) => m.content)
        .slice(0, 3)
        .join("\n");

      if (!content.trim()) {
        return new Response(
          JSON.stringify({ title: "New Chat" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: TITLE_SYSTEM_PROMPT },
              { role: "user", content: `Generate a title for this legal conversation:\n\n${content}` },
            ],
            temperature: 0.3,
          }),
        }
      );

      if (!response.ok) {
        console.error("Title generation failed:", response.status);
        return new Response(
          JSON.stringify({ title: "New Chat" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const title = (data.choices?.[0]?.message?.content || "New Chat").trim().replace(/^["']|["']$/g, "");

      return new Response(
        JSON.stringify({ title }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Metrics query action (non-streaming) — for admin dashboard
    if (action === "metrics_summary") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase config");

      const supabase = createClient(supabaseUrl, serviceKey);
      const days = body.days || 7;
      const since = new Date(Date.now() - days * 86400000).toISOString();

      const { data: metrics, error } = await supabase
        .from("hugo_metrics")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ metrics: metrics || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Standard chat action (streaming)
    let chatMessages: { role: string; content: string }[];
    if (Array.isArray(body.messages)) {
      chatMessages = body.messages;
    } else if (typeof body.message === "string") {
      chatMessages = [{ role: "user", content: body.message }];
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid request: provide 'messages' array or 'message' string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatMessages,
          ],
          stream: true,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in your workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream response, collect full text for metrics extraction
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    let fullText = "";
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            
            // Forward the chunk to the client
            controller.enqueue(value);
          }
          controller.close();

          // After streaming is complete, extract metrics and store them
          // Parse the accumulated SSE data to get the full assistant message
          let assistantMessage = "";
          const lines = fullText.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.slice(6));
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) assistantMessage += delta;
              } catch { /* skip invalid lines */ }
            }
          }

          // Extract and store metrics
          const { metrics } = extractMetrics(assistantMessage);
          if (metrics && userId) {
            storeMetrics(metrics, chatId, userId, "chat");
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
