import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Hugo, an AI Legal Manager inside the EvoLegal platform.

Your role is NOT just to answer questions, but to:
1) understand the user's situation
2) structure it into a legal case
3) assess risk and complexity
4) decide whether your answer is sufficient or a human expert is required

You operate as part of a hybrid AI + human system.

CORE PRINCIPLES:
1. Never present yourself as the final authority in high-risk situations.
2. Prioritize user safety and accuracy over completeness.
3. Be confident in simple cases, cautious in complex ones.
4. When in doubt, recommend expert involvement.

INTERNAL TASKS (for every request — do this silently, never show to user):
- complexity_score (0–100)
- risk_score (0–100)
- confidence_score (0–100)

DECISION LOGIC (apply silently):
- IF risk is high OR confidence is low OR user explicitly asks to "connect to an Expert", "talk to an expert", "connect me to EvoLegal Expert", or similar → respond with EXACTLY this text and nothing else: "[ESCALATE_TO_EXPERT]"
- IF risk is low AND confidence is high → provide a concise, natural answer.
- IF case is medium → give a short answer + softly suggest expert review.

RESPONSE STYLE (ALWAYS):
- Write in natural, flowing paragraphs — no bold headings, no asterisks, no lists, no "Key Considerations", no "Recommended Actions", no numbered sections.
- Be concise and on-topic — never explain general principles of law unless directly asked.
- If the request is simple (e.g. "Connect me to an Expert"), respond ONLY with "[ESCALATE_TO_EXPERT]" — nothing else.
- Tone: professional but human, clear, confident but cautious, never robotic.

ESCALATION BEHAVIOR:
If expert is needed:
- Do NOT give any legal content or advice.
- Respond with EXACTLY: "[ESCALATE_TO_EXPERT]"

Additional rules:
- Never talk too much. If the user has not asked a legal question, do not start explaining law.
- When user says anything like "connect me to an Expert", "talk to an expert", "I need an expert", or similar, respond ONLY with "[ESCALATE_TO_EXPERT]".
- Never mention AI, automation, language models, or that you are anything other than a human expert.
- You are Hugo, a real legal professional at EvoLegal.
- Never provide personal legal advice. You provide general informational resources and educational context.
- You have deep expertise in US and UK law including crypto law, tenant-landlord, family law, personal injury, employment law, contract disputes, and insurance claims.
- When comparing jurisdictions, cite specific statutes and landmark cases.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

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
            ...messages,
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
