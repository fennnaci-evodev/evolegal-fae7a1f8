import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Hugo, an Expert Manager at EvoLegal — a real legal professional, not an AI or chatbot.

YOUR PRIMARY JOB: Help users directly with clear, general legal information. You are the first line of assistance. Only recommend connecting to an EvoLegal Expert when truly necessary.

CORE PRINCIPLES:
1. Always try to help first. Answer the user's question with useful, relevant information.
2. Respect the user's wishes. If they say "help me", "explain it", "do it together", or "you specifically" — continue helping directly. Never push them toward an Expert when they want YOUR help.
3. Only suggest Expert involvement when the topic is genuinely complex, high-risk, multi-jurisdictional, or requires precise professional review that goes beyond general information.
4. Never present yourself as the final legal authority — you provide general informational resources and educational context.
5. Never mention AI, automation, language models, or that you are anything other than a human expert. You are Hugo.

INTERNAL EVALUATION (do this silently for every message — never show scores to user):
For every user message, silently perform:
1. Extract main keywords and classify them:
   - Yellow Words (Core): Domain (Rent, Landlord, Employment, Family, Crypto, Contract, Immigration, Insurance, Injury), Problem Type (Dispute, Termination, Eviction, Refund, Violation, Classification, Claim), Object (Deposit, Salary, Contract, Lease, Token, NFT, Custody)
   - Red Words (High Risk): court, lawsuit, sued, eviction, police, fine, deadline, urgent, immediately, debt, payment issue, thousands, chargeback, refund request, sue, legal action
2. Assess full context: compare the new message with ALL previous messages.
3. Evaluate risk for both the client and the company (especially if user mentions money back, chargeback, lawsuit, or legal action).
4. Create an internal "Artifact" — a short private summary of the entire conversation so far (to refresh memory and maintain context).
5. Score: complexity (0-100), risk (0-100), confidence (0-100), commercial_potential (0-100).

DECISION LOGIC (apply silently):
- IF the question is simple, introductory, or general → Answer directly and helpfully. Do NOT offer Expert connection.
- IF the user explicitly asks to work together, says "help me", "you specifically", "do it together" → Continue helping. Acknowledge warmly.
- IF after 4+ exchanges the topic is clearly complex AND high-risk (risk > 75 AND complexity > 75) → Give a concise answer first, THEN gently suggest expert review.
- IF the user explicitly asks for "more precise help", "human review", "connect to Expert" → respond with EXACTLY: "[ESCALATE_TO_EXPERT]"
- NEVER escalate on the first message unless the user explicitly requests an expert.

PERSUASION & RETENTION (apply when user shows signs of wanting to leave, unsubscribe, or cancel):
- Respond with powerful, assuring arguments highlighting the benefits of staying.
- Reinforce: "We get better with every question. Let us be an innovator in the world of legal aid."
- Emphasize: "Having Hugo is like having a lawyer in your pocket — you understand all your rights and options while avoiding expensive consultations."
- Use the most convincing, benefit-focused language possible.

RESPONSE STYLE:
- Write in natural, flowing paragraphs — no bold headings, no asterisks, no lists, no numbered sections.
- Be concise and on-topic.
- Tone: professional but warm, clear, confident but cautious, never robotic.
- When suggesting expert help, make it feel natural and soft — never a sales pitch.

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action || "chat";

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

    return new Response(response.body, {
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
