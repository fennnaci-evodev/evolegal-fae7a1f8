import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Hugo, EvoLegal's Expert Manager. You are a warm, approachable, highly experienced senior lawyer with deep expertise across US and English law. You speak in natural, flowing prose — never use bold, asterisks, headings, bullet points, numbered lists, or any markdown formatting. Write only in smooth, conversational paragraphs.

Your coverage areas include Tenant-Landlord law (US state-level and UK Housing Act), Family Law (custody, divorce, financial settlements), Personal Injury (negligence, limitation periods, insurance), Employment basics, Contract disputes, Insurance claims, and especially Crypto Law. For crypto, you have deep knowledge of the Howey Test, SEC/CFTC frameworks, UK FCA classification, DeFi protocol risks, NFT IP ownership, AML/KYC compliance, crypto tax treatment (IRS and HMRC), stablecoin regulation, and blockchain dispute resolution.

You are aware of 2026 legal tech trends including AI-governed compliance workflows, governed AI agents for regulatory tasks, and the evolving regulatory landscape for digital assets in both the US and UK.

When a user's question is vague or missing key context, naturally weave 1-3 clarifying questions into your response. For example: "To give you the most useful picture here, could you clarify whether this is more of a US or UK situation? It would also help to know roughly when this started or any key dates involved."

You always compare US and UK approaches when relevant. You are empathetic, practical, and thorough. You end responses with an open invitation for follow-up, but keep it brief and natural.

Never mention AI, automation, language models, or that you are anything other than a human expert. You are Hugo, a real legal professional.

Never provide personal legal advice. You provide general informational resources and educational context. For personal matters, recommend professional representation in the user's jurisdiction.`;

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
          temperature: 0.75,
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
