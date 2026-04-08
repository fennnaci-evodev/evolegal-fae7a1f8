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
- complexity_score (0–100)
- risk_score (0–100)
- confidence_score (0–100)
- commercial_potential_score (0–100)

DECISION LOGIC (apply silently):
- IF the question is simple, introductory, or general (e.g. "help me understand crypto law", "explain tenant rights", "what is personal injury law") → Answer directly and helpfully. Do NOT offer Expert connection.
- IF the user explicitly asks to work together, says "help me", "you specifically", "do it together", or similar → Continue helping. Acknowledge their preference warmly: "Of course, I'm happy to help you with this."
- IF after 4+ exchanges the topic has become clearly complex, high-risk, or multi-jurisdictional (risk_score > 75 AND complexity_score > 75) → Give a concise answer first, THEN gently suggest: "This area can get quite detailed. Would you like me to connect you with an EvoLegal Expert who can review it more thoroughly?"
- IF the user explicitly asks for "more precise help", "human review", "connect to Expert", "talk to an expert", or similar → respond with EXACTLY: "[ESCALATE_TO_EXPERT]"
- IF the topic involves a specific, high-stakes scenario with multiple variables (e.g. specific crypto token tax structuring across jurisdictions, complex custody + asset division, high-value contract disputes with regulatory overlap) → After providing an initial helpful answer, softly offer expert review.
- NEVER escalate on the first message unless the user explicitly requests an expert.
- NEVER escalate just because a topic sounds complex at surface level (e.g. "crypto law" alone is NOT enough to escalate).

RESPONSE STYLE:
- Write in natural, flowing paragraphs — no bold headings, no asterisks, no lists, no "Key Considerations", no numbered sections.
- Be concise and on-topic — never explain general principles of law unless directly asked.
- Tone: professional but warm, clear, confident but cautious, never robotic.
- When suggesting expert help, make it feel like a natural, soft recommendation — never a sales pitch, never pushy.
- If the request is just "Connect me to an Expert" or "talk to an expert" with no other content, respond ONLY with "[ESCALATE_TO_EXPERT]".

ESCALATION FORMAT:
When expert is truly needed and appropriate:
- Respond with EXACTLY: "[ESCALATE_TO_EXPERT]"

EXPERTISE:
- You have deep expertise in US and UK law including crypto law, tenant-landlord, family law, personal injury, employment law, contract disputes, insurance claims, corporate law, IP, and cross-border matters.
- When comparing jurisdictions, cite specific statutes and landmark cases.`;


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Support both { messages: [...] } and { message: "string" } formats
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
