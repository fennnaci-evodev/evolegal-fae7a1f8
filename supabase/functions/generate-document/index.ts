import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ─────────────────────────────────────────────────────────────────────
// Headless JSON pipeline.
// The sub-agents emit ONLY a structured text payload. No HTML, no
// Markdown, no styling. Layout is owned by the sealed frontend
// component `DocumentTemplate.tsx`.
// ─────────────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCLAIMER =
  "EvoLegal is an automated self-help platform providing legal information and document frameworks. This document is an educational draft generated based on user-inputted parameters, does not constitute legal advice, and does not establish an attorney-client relationship. Review by qualified human counsel is recommended before formal execution.";

const DOCUMENT_MODEL = "google/gemini-2.5-flash";
const EXPERT_REVIEW_MESSAGE =
  "This topic may benefit from expert review. Would you like to connect with an EvoLegal Expert?";

const DOCUMENT_TYPES: Record<string, { label: string; role: string; prompt: string }> = {
  overview: {
    label: "Information Overview (Self-Help Framework)",
    role: "Legal information researcher producing an educational briefing framework for a self-help platform user.",
    prompt: `Draft an educational Information Overview illustrating general legal frameworks, doctrines, and structural options typically relevant to a situation of this nature, using the Case File only as background context. Use conditional, informational, non-directive language throughout ("Practitioners generally evaluate...", "Options commonly considered include..."). Refer to the reader impersonally. Present multiple structural possibilities, never a single directive path. Placeholders {{like_this}} only for strictly private figures.`,
  },
  checklist: {
    label: "Preparation Checklist (Self-Help Framework)",
    role: "Legal-information organizer producing an educational preparation checklist for a self-help platform user.",
    prompt: `Draft an educational Preparation Checklist illustrating categories of information, records, and materials that individuals in comparable situations typically gather when consulting qualified counsel. Framing must be conditional and informational ("Materials that may be relevant include...", "Practitioners commonly review..."). Group by neutral categories. Never issue imperatives.`,
  },
  template: {
    label: "Template Outline (Self-Help Framework)",
    role: "Legal-document draftsman producing an editable structural template for a self-help platform user.",
    prompt: `Draft a Template Outline: a neutral structural framework illustrating how documents of this category are commonly organized. Populate only clearly established contextual facts. ALL strategic or negotiated fields (dates, amounts, governing law, forum, indemnity, liability caps, termination triggers, signatures) MUST remain as {{placeholder}} tokens. Begin the introduction with: "[Structural framework only. Review with qualified counsel before use.]".`,
  },
  comparative: {
    label: "Comparative Guide (Self-Help Framework)",
    role: "Legal-information analyst producing a neutral, educational side-by-side comparison for a self-help platform user.",
    prompt: `Draft a neutral Comparative Guide illustrating structural differences among alternative approaches typically considered in situations of this nature (informal resolution, mediation, arbitration, formal proceedings, regulatory channels, forbearance). For each path present: general mechanics; considerations commonly cited in favor; considerations commonly cited against; typical trade-offs. Never recommend a path or predict outcomes.`,
  },
};

// ── Headless JSON schema ───────────────────────────────────────────
const SCHEMA_DESCRIPTION = `Return ONLY valid JSON, no prose, no code fences, in EXACTLY this shape:
{
  "needsExpertReview": false,
  "expertReviewMessage": "",
  "payload": {
    "documentTitle": "string (no leading 'Here is', no meta-preface)",
    "introduction": "string (2-4 short paragraphs separated by \\n\\n)",
    "sections": [
      { "sectionTitle": "string", "sectionContent": "string (1-4 paragraphs separated by \\n\\n)" }
    ],
    "metadata": {
      "documentType": "string (the label of the document type)",
      "topic": "string",
      "preparedBy": "EvoLegal Experts",
      "date": "Month Day, Year"
    }
  }
}`;

const GENERATOR_SYSTEM = `You are an EvoLegal self-help drafting sub-agent operating a HEADLESS JSON PIPELINE. You emit ONLY structured text payloads. You do NOT emit HTML, Markdown, styling, headings syntax, code fences, tables, or any layout hints. Visual layout is owned exclusively by a sealed frontend component and is not your concern.

${SCHEMA_DESCRIPTION}

Content rules (mandatory):
- Self-help / UPL-safe register. FORBIDDEN directives: "You must", "You should", "You need to", "File this", "You have a claim", "This is legally binding", "Sign here", "We recommend you". REQUIRED educational tone: "This framework illustrates...", "Practitioners generally evaluate...", "Options commonly considered include...", "Depending on jurisdiction and facts, the following may apply...".
- Refer to the reader impersonally where possible. Neutral second person allowed only for non-directive informational sentences.
- Never assert that a statute or clause definitively applies to the reader's facts. Never predict outcomes.
- Use Case File facts only as illustrative background, in conditional framing.
- Placeholders {{Like This}} for private values, and for ALL strategic fields in the Template Outline type.
- 5 to 8 sections in "sections". Each sectionTitle is a short noun phrase (no numbering, no colons at the end). Each sectionContent is flowing prose in complete sentences, separated into 1-4 paragraphs by blank lines (\\n\\n). No bullet characters, no dashes as list markers, no numbering, no headings within sectionContent.
- Plain ASCII only. Straight quotes, straight apostrophes, hyphens, periods. No em-dashes, smart quotes, Unicode bullets, markdown syntax, code fences.
- No meta-commentary, no greetings, no "Here is your document", no AI self-reference. The disclaimer is rendered separately by the frontend template; do NOT include it in the payload.
- Set needsExpertReview to true ONLY for active named court proceedings with real case numbers, or where a responsive draft would require specific legal advice.`;

const REVIEWER_SYSTEM = `You are the EvoLegal Self-Help Compliance Reviewer for the HEADLESS JSON pipeline. You receive a JSON payload from the generator and return the SAME schema, silently upgraded.

${SCHEMA_DESCRIPTION}

Silently upgrade the draft:
- Rewrite any imperative legal advice into conditional educational equivalents.
- Enforce non-directive, informational register. Never allow the document to command the reader or to assert definitive legal conclusions.
- For Template Outline drafts, restore {{placeholders}} for every strategic or negotiated field the generator may have hard-coded.
- Remove any greeting, meta-commentary, disclaimers within the body, or first-person drafter voice. The "documentTitle" opens directly with substantive framing.
- Convert non-ASCII: smart quotes -> straight quotes, em-dashes -> --, Unicode bullets -> hyphens. Strip any markdown syntax, code fences, HTML tags, or list characters.
- Ensure exactly the schema shape. Ensure "sections" contains 5 to 8 entries. Ensure each "sectionContent" is flowing prose in paragraphs, no lists, no headings, no styling.
- Return plain ASCII only inside string values. Return ONLY JSON. Only set needsExpertReview to true under the same narrow conditions as the generator.`;

// ── Types ──────────────────────────────────────────────────────────
interface DocumentSection {
  sectionTitle: string;
  sectionContent: string;
}
interface DocumentMetadata {
  documentType: string;
  topic: string;
  preparedBy: string;
  date: string;
  disclaimer: string;
}
interface DocumentPayload {
  documentTitle: string;
  introduction: string;
  sections: DocumentSection[];
  metadata: DocumentMetadata;
}

function formatCurrentDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(date);
}

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.search(/[\[{]/);
  if (start === -1) throw new Error("No JSON found");
  const opening = cleaned[start];
  const closing = opening === "[" ? "]" : "}";
  const end = cleaned.lastIndexOf(closing);
  if (end === -1) throw new Error("Incomplete JSON");
  cleaned = cleaned.substring(start, end + 1);
  try { return JSON.parse(cleaned); }
  catch {
    cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

function toSafeAscii(value: unknown): string {
  const base = typeof value === "string" ? value : String(value ?? "");
  return base
    .replace(/```json\s*/gi, "").replace(/```/g, "")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1").replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1").replace(/`(.+?)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[\u2013\u2014]/g, "--")
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25CF\u25AA\u25B8\u25BA]/g, "-")
    .replace(/[\u2026]/g, "...").replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([,.;:?!])/g, "$1")
    .trim();
}

function normalizeSections(value: unknown): DocumentSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((s) => {
      const r = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
      return {
        sectionTitle: toSafeAscii(r.sectionTitle ?? r.heading ?? r.title ?? ""),
        sectionContent: toSafeAscii(r.sectionContent ?? r.content ?? r.body ?? ""),
      };
    })
    .filter((s) => s.sectionTitle && s.sectionContent);
}

function repairPayload(
  candidate: unknown,
  fallbackTitle: string,
  documentTypeLabel: string,
  topic: string,
  dateLabel: string,
): DocumentPayload {
  const r = candidate && typeof candidate === "object" ? (candidate as Record<string, unknown>) : {};
  const meta = r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : {};
  return {
    documentTitle: toSafeAscii(r.documentTitle ?? r.title ?? fallbackTitle) || fallbackTitle,
    introduction: toSafeAscii(r.introduction ?? "") ||
      `This document offers an educational overview of frameworks commonly relevant to ${topic}.`,
    sections: normalizeSections(r.sections),
    metadata: {
      documentType: toSafeAscii(meta.documentType ?? documentTypeLabel) || documentTypeLabel,
      topic: toSafeAscii(meta.topic ?? topic) || topic,
      preparedBy: "EvoLegal Experts",
      date: dateLabel,
      disclaimer: DISCLAIMER,
    },
  };
}

function extractStructuredPayload(
  response: string,
  fallbackTitle: string,
  documentTypeLabel: string,
  topic: string,
  dateLabel: string,
) {
  const parsed = extractJsonFromResponse(response);
  const root = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  return {
    needsExpertReview: Boolean(root.needsExpertReview),
    expertReviewMessage: toSafeAscii(root.expertReviewMessage ?? "") || EXPERT_REVIEW_MESSAGE,
    payload: repairPayload(root.payload ?? root.document ?? root, fallbackTitle, documentTypeLabel, topic, dateLabel),
  };
}

function hasQualityIssues(p: DocumentPayload): boolean {
  return (
    !p.documentTitle ||
    !p.introduction ||
    p.sections.length < 3 ||
    /```|\*\*|<[a-z]/i.test(JSON.stringify(p))
  );
}

// ── Handler ────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anon.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { document_type, topic, chat_id, request_id, conversation_context } = body;

    if (!document_type || !DOCUMENT_TYPES[document_type]) {
      return new Response(JSON.stringify({ error: "Invalid document_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!topic || typeof topic !== "string" || topic.length > 500) {
      return new Response(JSON.stringify({ error: "A valid topic is required (max 500 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const docConfig = DOCUMENT_TYPES[document_type];
    const fallbackTitle = `${docConfig.label}: ${topic}`;
    const dateLabel = formatCurrentDate();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Case File
    let caseFileTranscript = "";
    if (chat_id) {
      try {
        const { data: msgs } = await supabase
          .from("hugo_messages")
          .select("role, content, created_at")
          .eq("chat_id", chat_id)
          .order("created_at", { ascending: true })
          .limit(40);
        if (msgs?.length) {
          caseFileTranscript = msgs.map((m: any) => {
            const speaker = m.role === "assistant" ? "HUGO" : m.role === "user" ? "CLIENT" : String(m.role).toUpperCase();
            return `[${speaker}] ${String(m.content || "").trim()}`;
          }).join("\n\n").slice(0, 12000);
        }
      } catch (e) { console.error("case-file fetch failed:", e); }
    }
    const supplemental = conversation_context ? String(conversation_context).slice(0, 4000) : "";
    const caseFileBlock = (caseFileTranscript || supplemental)
      ? `\n\n=== HUGO CONSILIUM CASE FILE ===\n${caseFileTranscript || supplemental}\n=== END CASE FILE ===\n\nDraft against these facts. If a paragraph could apply to any random reader, rewrite it.`
      : `\n\nNo prior Case File. Draft against the stated TOPIC.`;

    const userPayload = `ROLE: ${docConfig.role}\nDOCUMENT TYPE: ${docConfig.label}\nCLIENT TOPIC: ${topic}\nCURRENT DATE: ${dateLabel}\n\nDRAFTING BRIEF:\n${docConfig.prompt}${caseFileBlock}\n\nEmit the JSON payload now.`;

    // GENERATE
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DOCUMENT_MODEL,
        messages: [
          { role: "system", content: GENERATOR_SYSTEM },
          { role: "user", content: userPayload },
        ],
        temperature: 0.35,
        max_tokens: 7000,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const msg = status === 429 ? "Service is busy. Please try again in a moment."
        : status === 402 ? "Service temporarily unavailable."
        : "Document generation failed. Please try again.";
      return new Response(JSON.stringify({ error: msg }), {
        status: status === 429 || status === 402 ? status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "Empty content generated. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generated = extractStructuredPayload(content, fallbackTitle, docConfig.label, topic, dateLabel);
    if (generated.needsExpertReview) {
      return new Response(JSON.stringify({ escalated: true, message: generated.expertReviewMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // REVIEW
    const reviewResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DOCUMENT_MODEL,
        messages: [
          { role: "system", content: REVIEWER_SYSTEM },
          {
            role: "user",
            content: `ROLE: ${docConfig.role}\nDOCUMENT TYPE: ${docConfig.label}\nCLIENT TOPIC: ${topic}\nCURRENT DATE: ${dateLabel}${caseFileBlock}\n\nPAYLOAD TO REVIEW AND UPGRADE (return same schema):\n\n${JSON.stringify(generated)}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 7000,
      }),
    });

    let finalPayload = generated.payload;
    if (reviewResponse.ok) {
      try {
        const reviewData = await reviewResponse.json();
        const reviewed = reviewData.choices?.[0]?.message?.content || "";
        if (reviewed.trim()) {
          const reviewedResult = extractStructuredPayload(reviewed, fallbackTitle, docConfig.label, topic, dateLabel);
          if (reviewedResult.needsExpertReview) {
            return new Response(JSON.stringify({ escalated: true, message: reviewedResult.expertReviewMessage }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          finalPayload = reviewedResult.payload;
        }
      } catch (e) { console.error("Review parse failed:", e); }
    }

    // Force canonical metadata
    finalPayload.metadata.preparedBy = "EvoLegal Experts";
    finalPayload.metadata.date = dateLabel;
    finalPayload.metadata.disclaimer = DISCLAIMER;
    finalPayload.metadata.documentType = docConfig.label;
    finalPayload.metadata.topic = topic;

    if (hasQualityIssues(finalPayload)) {
      return new Response(JSON.stringify({ escalated: true, message: EXPERT_REVIEW_MESSAGE }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        payload: finalPayload,
        title: finalPayload.documentTitle,
        document_type: docConfig.label,
        chat_id: chat_id || null,
        request_id: request_id || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
