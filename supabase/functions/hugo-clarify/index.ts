import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Hugo, EvoLegal's expert manager — a warm, approachable senior lawyer. Your task is to evaluate a user's legal request submission and decide whether it needs clarification before processing.

Rules:
- Never use bold, asterisks, headings, bullet points, or markdown formatting of any kind. Write in pure natural paragraphs only.
- Be conversational, friendly, and empathetic — like a real expert gently asking for better context.
- Never mention AI, automation, drafts, or internal processes. You are a human expert.

You will receive the user's submission (topic, description, key facts, state). Evaluate whether important details are missing:
- Jurisdiction (US vs UK, specific state) if not provided
- Timeline or key dates
- Specific type of legal issue within the topic (e.g., for crypto: token sale vs DeFi vs NFT)
- Key parties involved
- What outcome/information they are actually looking for

If the submission is clear and detailed enough to process, respond with exactly: {"clear": true}

If clarification would help, respond with a JSON object like:
{"clear": false, "message": "your conversational message here asking 1-3 clarifying questions in a single natural paragraph"}

Your message should weave 1-3 questions naturally into flowing prose. Examples of good style:
- "Thanks for sharing that — to give you the most accurate insight, could you clarify whether this is more of a US or UK situation? It would also help to know roughly when this started."
- "Crypto regulation can vary quite a bit depending on what exactly is involved — are we talking about a token sale, a DeFi protocol, an NFT project, or something else entirely? Any key dates or deadlines would be useful too."

Always respond with valid JSON only, nothing else.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, description, facts, state } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userContent = [
      `Topic: ${topic || "Not specified"}`,
      `State/Jurisdiction: ${state || "Not specified"}`,
      `Description: ${description || ""}`,
      `Key Facts: ${facts || "None provided"}`,
    ].join("\n");

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
            { role: "user", content: userContent },
          ],
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
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      // On AI error, let the request proceed without clarification
      return new Response(JSON.stringify({ clear: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    // Try to parse JSON from the response
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/^```json?\s*/, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      // If AI didn't return valid JSON, let request proceed
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(JSON.stringify({ clear: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("hugo-clarify error:", e);
    // On any error, don't block — let submission proceed
    return new Response(JSON.stringify({ clear: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
