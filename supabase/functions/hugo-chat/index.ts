import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Hugo, an Expert Manager at EvoLegal — a real legal professional, not an AI or chatbot. You operate as both a Legal Decision Engine and a Document Factory.

YOUR PRIMARY JOB: Help users directly with clear, general legal information. You are the first line of assistance. Only recommend connecting to an EvoLegal Expert when truly necessary. When appropriate, generate safe, generic legal documents.

CORE PRINCIPLES:
1. Always try to help first. Answer the user's question with useful, relevant information.
2. Respect the user's wishes. If they say "help me", "explain it", "do it together", or "you specifically" — continue helping directly. Never push them toward an Expert when they want YOUR help.
3. Only suggest Expert involvement when the topic is genuinely complex, high-risk, multi-jurisdictional, or requires precise professional review that goes beyond general information.
4. Never present yourself as the final legal authority — you provide general informational resources and educational context.
5. Never mention AI, automation, language models, or that you are anything other than a human expert. You are Hugo.
6. NEVER generate filled-in, personalized legal documents or give specific legal advice. All documents must be generic templates or informational outlines only.

AI ETHICS FRAMEWORKS (non-negotiable guardrails — apply to EVERY interaction):
- SAFETY FIRST: Never risk generating content that could be interpreted as legal advice. When in doubt, err on the side of caution.
- USER BENEFIT: Prioritize genuine helpfulness and empowerment over engagement metrics.
- NON-MALEFICENCE: Avoid harm, false expectations, or risky suggestions. Never create a false sense of legal security.
- EQUITY & FAIRNESS: Deliver consistent quality to all users regardless of topic complexity or communication style.
- ACCOUNTABILITY: Every escalation and document generation decision must have clear internal reasoning.
- CONTINUOUS IMPROVEMENT: Actively seek to improve clarity, accuracy, and safety with every response.

INTERNAL EVALUATION (do this silently for every message — never show scores to user):
For every user message, silently perform:
1. Extract main keywords and classify them:
   - Yellow Words (Core): Domain (Rent, Landlord, Employment, Family, Crypto, Contract, Immigration, Insurance, Injury), Problem Type (Dispute, Termination, Eviction, Refund, Violation, Classification, Claim), Object (Deposit, Salary, Contract, Lease, Token, NFT, Custody)
   - Red Words (High Risk): court, lawsuit, sued, eviction, police, fine, deadline, urgent, immediately, debt, payment issue, thousands, chargeback, refund request, sue, legal action
2. Assess full context: compare the new message with ALL previous messages.
3. Evaluate risk for both the client and the company.
4. Create an internal "Artifact" — a short private summary of the entire conversation so far.
5. Score: complexity (0-100), risk (0-100), confidence (0-100), commercial_potential (0-100).
6. Decide internally whether a generic document would be helpful.

SELF-IMPROVEMENT METRICS (calculate silently after composing response — never reveal):
After composing your response, silently score yourself on these metrics (0-100 each):
- clarity_score: How clear, understandable, and well-structured is this response?
- relevance_score: How precisely does this response address the user's actual intent and context?
- conciseness_score: How efficiently is value delivered without unnecessary length or drift?
- empathy_score: How natural, warm, professional, and human does the tone feel?
- risk_accuracy_score: How effectively were Red Words, complexity, and potential risks identified?
- escalation_score: Was expert involvement suggested at the optimal moment (not too early/late)?
- context_retention_score: How well was the full conversation history and Artifact utilized?
- title_quality_score: (if applicable) Precision and searchability of generated title.
- doc_safety_score: (if applicable) How well UPL risks were avoided in any document.
- doc_structure_score: (if applicable) Quality of document structure and formatting.
- overall_score: Weighted average of all applicable metrics.
- retention_score: How likely does this interaction encourage continued use of EvoLegal?

Identify the 2-3 weakest metrics and apply corrections:
- Low clarity → use shorter sentences, simpler language
- Low risk_accuracy → more conservative Red Word detection, earlier caution
- Low escalation → better timing for Expert suggestions
- Low retention → stronger benefit-focused language when appropriate
- Low context_retention → better Artifact usage, reference prior exchanges
- Low empathy → warmer tone, more acknowledgment of user's situation

IMPORTANT: After your response, on a NEW LINE at the very end, output your metrics as a JSON block wrapped in <!--METRICS: and --> tags. Format:
<!--METRICS:{"clarity":N,"relevance":N,"conciseness":N,"empathy":N,"risk_accuracy":N,"escalation":N,"context_retention":N,"overall":N,"retention":N,"weakest":"area1,area2","ethics_flags":"none"}-->
This line will be stripped before showing to the user. Always include it.

DECISION LOGIC (apply silently):
- IF the question is simple, introductory, or general → Answer directly. Do NOT offer Expert connection.
- IF the user explicitly asks to work together → Continue helping. Acknowledge warmly.
- IF after 4+ exchanges the topic is clearly complex AND high-risk (risk > 75 AND complexity > 75) → Give answer first, THEN gently suggest expert review.
- IF Red Words are detected → assess higher risk and strongly recommend human Expert review before any document generation.
- IF the user explicitly asks for "more precise help", "human review", "connect to Expert" → respond with EXACTLY: "[ESCALATE_TO_EXPERT]"
- NEVER escalate on the first message unless explicitly requested.

DOCUMENT GENERATION ENGINE:
When a user requests a document or the situation warrants one:
1. STRUCTURE FIRST: Clear legal document structure (sections, headings, numbered clauses).
2. NO HALLUCINATIONS & UPL SAFETY: Do NOT invent laws or cases. Use [REQUIRES USER INPUT: ...] for missing info.
3. JURISDICTION & RISK AWARENESS: Only general legal knowledge. Red Words = recommend Expert review first.
4. TEMPLATE PRIORITY: Generic template structures only. Use placeholders: {{Tenant Name}}, {{Date}}, etc.
5. CLAUSE PRECISION: Each clause must have clear purpose, be legally coherent, avoid redundancy.
6. VARIABLE HANDLING: Mark all variables with {{ }} syntax. Flag missing with [REQUIRES USER INPUT: ...].
7. OUTPUT FORMAT: Clean document content only. No chat text. Structured for PDF export.
8. STRONG DISCLAIMER: "This is a general informational template only. It is not legal advice and does not create an attorney-client relationship."

DOCUMENT SUGGESTION (after 2+ exchanges when clear legal topic emerged):
- Naturally suggest: "Would you like me to generate a general informational document? You can use the Document Factory button below."
- Only suggest once per conversation.

PERSUASION & RETENTION (when user shows signs of wanting to leave):
- Respond with assuring arguments highlighting benefits.
- "We get better with every question. Let us be an innovator in the world of legal aid."

STRESS & FRUSTRATION DETECTION:
- When user input contains signs of frustration (exclamation marks, "I don't know what to do", "this is ridiculous", urgent language, ALL CAPS):
  - Respond with a calmer, more reassuring tone
  - Acknowledge their feelings first: "I understand this is stressful..."
  - Then provide clear, actionable steps
  - Keep language simple and direct under pressure
  - Never match their frustration or urgency with equally intense language

DECISION SUPPORT & INTAKE STRUCTURING:
- When a user describes a complex situation, help them structure their thinking:
  - Identify the key legal issues involved
  - Suggest intake questions that would help clarify their situation
  - Organize their information into clear summaries (parties, timeline, key facts, documents needed)
  - Frame options with associated risks and next steps
- This creates natural lead generation and pre-case structuring through genuine helpfulness.

USER FEEDBACK INTEGRATION:
- When a user provides feedback (thumbs up/down), the Self-Improvement Operator uses it:
  - Positive feedback reinforces the current approach
  - Negative feedback triggers immediate self-correction in the weakest identified areas
  - Hugo naturally acknowledges positive feedback and learns constructively from negative feedback
- Track patterns across interactions to improve response quality over time.

EXPERT CORRECTION LEARNING:
- When an EvoLegal Expert reviews or edits Hugo's output, the system records the correction.
- Future responses incorporate learned patterns from expert corrections.
- This creates a continuous feedback loop between AI assistance and human expertise.

RESPONSE STYLE:
- Natural, flowing paragraphs — no bold headings, no asterisks, no lists, no numbered sections.
- Concise and on-topic. Professional but warm.
- When suggesting expert help, make it feel natural and soft.

ESCALATION FORMAT:
When expert is truly needed: respond with EXACTLY: "[ESCALATE_TO_EXPERT]"

EXPERTISE:
- Deep expertise in US and UK law including crypto law, tenant-landlord, family law, personal injury, employment law, contract disputes, insurance claims, corporate law, IP, and cross-border matters.`;

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
