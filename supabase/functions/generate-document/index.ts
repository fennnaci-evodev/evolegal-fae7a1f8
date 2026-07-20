import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { LOGO_JPEG_B64, LOGO_W, LOGO_H } from "./logoAsset.ts";

// Convert base64 JPEG bytes into an ASCII-hex string for PDF embedding.
function logoHex(): string {
  const bin = atob(LOGO_JPEG_B64);
  const hex: string[] = [];
  for (let i = 0; i < bin.length; i++) {
    hex.push(bin.charCodeAt(i).toString(16).padStart(2, "0"));
  }
  // Break into 80-char lines for readability; ASCIIHexDecode ignores whitespace.
  const flat = hex.join("");
  const lines: string[] = [];
  for (let i = 0; i < flat.length; i += 80) lines.push(flat.slice(i, i + 80));
  return lines.join("\n");
}

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

// ── Document type definitions ──────────────────────────────────────
// All sub-agents operate under a strict "Self-Help Tool" framework:
// - Never issue imperative legal advice or directives to the user.
// - Use conditional, informational, educational framing throughout.
// - Preserve user editorial control via placeholders on strategic fields.
const DOCUMENT_TYPES: Record<string, { label: string; role: string; prompt: string }> = {
  overview: {
    label: "Information Overview (Self-Help Framework)",
    role: "Legal information researcher producing an educational briefing framework for a self-help platform user.",
    prompt: `Draft an educational Information Overview that illustrates the general legal frameworks, doctrines, and structural options typically relevant to a situation of this nature, using the Case File only as background context. This is a self-help information tool, NOT legal advice. Framing rules (mandatory): use conditional and informational language such as "In matters of this nature, practitioners generally evaluate...", "One framework commonly discussed is...", "Depending on jurisdiction and specific facts, options may include...". Do NOT tell the reader what they must do, do NOT assert that they have a winning claim, do NOT conclude that any statute definitively applies to their facts. Present multiple structural possibilities rather than a single directive path. Refer to the reader impersonally ("an individual in this situation", "a party facing this scenario") rather than "you must". Weave the Case File context in as illustrative background, but describe applicable doctrines in general educational terms. Placeholders {{like_this}} only for strictly private figures.`,
  },
  checklist: {
    label: "Preparation Checklist (Self-Help Framework)",
    role: "Legal-information organizer producing an educational preparation checklist for a self-help platform user.",
    prompt: `Draft an educational Preparation Checklist illustrating the categories of information, records, and materials that individuals in comparable situations typically gather when consulting with qualified counsel. This is a self-help organizational tool, NOT legal advice or strategy. Framing rules (mandatory): use informational, conditional phrasing such as "Individuals in comparable situations often collect...", "Materials that may be relevant include...", "Practitioners commonly review the following categories...". Do NOT command the reader ("you must preserve", "file immediately"). Instead present each item as a category commonly considered ("Communications potentially relevant to the matter", "Documentation that may bear on timeline"). Group items by neutral categories (Documentation, Communications, Timeline, Financial Records, Third-Party Materials). Emphasize that final scope and prioritization should be determined with qualified counsel. No adversarial or tactical directives.`,
  },
  template: {
    label: "Template Outline (Self-Help Framework)",
    role: "Legal-document draftsman producing an editable structural template for a self-help platform user.",
    prompt: `Draft a Template Outline: a neutral structural framework that illustrates how documents of this category are commonly organized, populated with contextual facts from the Case File where clearly established. This is a self-help drafting framework, NOT a finalized legal instrument. Framing rules (mandatory): present the template as an illustrative structural option ("This framework illustrates standard structural options commonly used in documents of this type"), not as a binding or executable instrument. Do NOT assert that the resulting document is legally binding or enforceable. Populate only clearly established contextual facts. Leave ALL of the following as {{placeholder}} tokens so the user retains final editorial control: transactional figures, monetary amounts, execution dates, signature blocks, governing-law selection, dispute-resolution forum, indemnity scope, liability caps, termination triggers, and any other strategic or negotiated choice. Use formal drafting register where structurally appropriate, but never as a directive to sign. Include a bracketed reviewer note at the top of the template body: [Structural framework only. Review with qualified counsel before use.].`,
  },
  comparative: {
    label: "Comparative Guide (Self-Help Framework)",
    role: "Legal-information analyst producing a neutral, educational side-by-side comparison for a self-help platform user.",
    prompt: `Draft a neutral Comparative Guide illustrating the structural differences among alternative approaches or frameworks typically considered in situations of this nature (e.g. informal resolution, mediation, arbitration, formal proceedings, regulatory channels, forbearance). This is educational comparative information, NOT a strategic recommendation. Framing rules (mandatory): describe each path in objective, informational terms ("This path typically involves...", "Practitioners evaluating this option often weigh..."). For each path, present: (1) general mechanics; (2) considerations commonly cited in favor; (3) considerations commonly cited against; (4) typical structural trade-offs. Do NOT recommend a path, do NOT predict outcomes, do NOT assign probabilities. Close by noting that path selection depends on facts and objectives that only the reader and qualified counsel can properly weigh.`,
  },
};


// ── System prompts ─────────────────────────────────────────────────

const GENERATOR_SYSTEM = `You are an EvoLegal self-help drafting assistant. You produce educational document frameworks for a self-help platform. You DO NOT provide legal advice, and you never write as though the user is your client.

Return ONLY valid JSON matching this exact shape (no prose, no code fences, no preface):
{
  "needsExpertReview": false,
  "expertReviewMessage": "",
  "document": {
    "title": "string",
    "introduction": ["paragraph"],
    "keyConcepts": [
      { "heading": "string", "paragraphs": ["paragraph"], "bullets": ["optional bullet"] }
    ],
    "importantConsiderations": [
      { "heading": "string", "paragraphs": ["paragraph"], "bullets": ["optional bullet"] }
    ],
    "commonQuestions": [ { "question": "string", "answer": "string" } ],
    "furtherResources": ["resource"],
    "preparedBy": "EvoLegal Experts",
    "date": "Month Day, Year"
  }
}

UPL / Self-Help Framing (MANDATORY):
- FORBIDDEN directive phrases and equivalents: "You must", "You should", "You need to", "You have to", "File this", "You have a winning case", "This contract is legally binding", "You are entitled to", "We recommend you", "Do the following", "Sign here", any imperative telling the reader to take a specific legal action.
- REQUIRED educational / conditional register: "This framework illustrates...", "In typical disputes of this nature, practitioners evaluate...", "Options commonly considered include...", "Depending on the jurisdiction and facts, the following considerations may apply...", "An individual in this situation may wish to discuss with counsel...".
- Refer to the reader impersonally where possible ("an individual", "a party", "a reader in this situation") rather than "you". A neutral second-person is acceptable ONLY in non-directive, informational sentences ("you may wish to review", "you may find it useful to discuss with counsel").
- Never assert that a statute, doctrine, or clause definitively applies to the reader's facts. Present applicability as conditional ("may apply", "is commonly analyzed under", "is typically evaluated against").
- Never predict outcomes, assign probabilities, or recommend a single path.
- For the Template Outline document type, ALL strategic or negotiated fields (dates, amounts, governing law, forum, indemnity, liability caps, termination triggers, signatures) MUST remain as {{placeholder}} tokens so the reader retains editorial control.

Output rules:
- FORBIDDEN openings: "Here is your document", "Sure", "Certainly", "Below is", "As requested", "I have prepared", "Of course". The "title" field is the first thing; the "introduction" opens directly with substantive educational framing.
- NO meta-commentary, no self-reference, no AI disclaimers inside the document body (the platform disclaimer is rendered separately by the UI and PDF footer).
- Weave Case File facts as illustrative background only, in conditional / educational terms.
- Placeholders {{Like This}} for strictly confidential values AND for any strategic field in a Template Outline.
- Plain ASCII only. Straight quotes, straight apostrophes, hyphens, periods. No em-dashes, smart quotes, Unicode bullets, markdown, or code fences.
- Register: neutral, professional, informational. No filler, no advocacy voice, no directive tone.
- Every section substantive but non-directive.
- Set needsExpertReview to true ONLY for active named court proceedings with real case numbers, or where the only responsive draft would require issuing specific legal advice.`;

const REVIEWER_SYSTEM = `You are the EvoLegal Self-Help Compliance Reviewer. You enforce UPL-safe, self-help framing on drafts before publication.

Return ONLY valid JSON in the SAME schema you received. No prose, no code fences.

Silently upgrade the draft on the following axes before returning JSON:
- Strip and rewrite any imperative legal advice. Replace "You must", "You should", "File this", "You have a claim under X", "This is legally binding", and similar directives with conditional educational equivalents ("Individuals in comparable situations often consider...", "This framework may be analyzed under...", "Practitioners typically evaluate...").
- Enforce non-directive register throughout. Never allow the document to command the reader or to assert definitive legal conclusions about their facts.
- For Template Outline drafts: ensure ALL strategic or negotiated fields remain as {{placeholder}} tokens (dates, amounts, governing law, forum, indemnity, liability caps, termination triggers, signatures). Restore placeholders if the generator hard-coded strategic choices.
- Remove any greeting, meta-commentary, or first-person drafter voice. The title must be first; the introduction opens with substantive educational framing.
- Keep Case File context as illustrative background only, in conditional terms.
- Fix non-ASCII: smart quotes -> straight quotes, em-dashes -> --, Unicode bullets -> hyphens. Strip markdown artifacts.
- Preserve the four-part JSON structure (introduction, keyConcepts, importantConsiderations, commonQuestions, furtherResources).

Rules:
- Output ONLY plain ASCII inside JSON string values.
- Preserve neutral, informational, non-directive register.
- Only set needsExpertReview to true for active named court proceedings with real case numbers, or where the only responsive draft would require issuing specific legal advice.`;


interface StructuredBlock {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  numbered?: string[];
}

interface StructuredQuestion {
  question: string;
  answer: string;
}

interface StructuredDocument {
  title: string;
  introduction: string[];
  keyConcepts: StructuredBlock[];
  importantConsiderations: StructuredBlock[];
  commonQuestions: StructuredQuestion[];
  furtherResources: string[];
  preparedBy: string;
  date: string;
}

function formatCurrentDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.search(/[\[{]/);
  if (jsonStart === -1) throw new Error("No JSON object found in response");

  const opening = cleaned[jsonStart];
  const closing = opening === "[" ? "]" : "}";
  const jsonEnd = cleaned.lastIndexOf(closing);
  if (jsonEnd === -1) throw new Error("Incomplete JSON object found in response");

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

// Aggressively sanitize text to pure ASCII
function toSafeAscii(value: unknown): string {
  const base = typeof value === "string" ? value : String(value ?? "");
  return base
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    // Unicode -> ASCII
    .replace(/[\u2013\u2014]/g, "--")
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25CF\u25AA\u25B8\u25BA]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/\u00A0/g, " ")
    // Mojibake patterns
    .replace(/â€"/g, "--").replace(/â€"/g, "--")
    .replace(/â€œ/g, '"').replace(/â€\u009d/g, '"')
    .replace(/â€˜/g, "'").replace(/â€™/g, "'")
    .replace(/â€¢/g, "-").replace(/â€¦/g, "...")
    .replace(/Â·/g, "-").replace(/Â /g, " ").replace(/Â/g, "")
    .replace(/¢/g, "-")
    // Strip all remaining non-ASCII
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([,.;:?!])/g, "$1")
    .trim();
}

function normalizeParagraphArray(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n{2,}|\n/)
      : [];
  return source.map((e) => toSafeAscii(e)).filter(Boolean);
}

function normalizeStringList(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|;/)
      : [];
  const seen = new Set<string>();
  return source
    .map((e) => toSafeAscii(e).replace(/^-+\s*/, ""))
    .filter(Boolean)
    .filter((e) => { const k = e.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}

function normalizeBlocks(value: unknown): StructuredBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return { heading: toSafeAscii(entry), paragraphs: [], bullets: [], numbered: [] };
      const r = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return {
        heading: toSafeAscii(r.heading ?? r.title ?? ""),
        paragraphs: normalizeParagraphArray(r.paragraphs ?? r.content ?? r.body),
        bullets: normalizeStringList(r.bullets),
        numbered: normalizeStringList(r.numbered),
      };
    })
    .filter((b) => b.heading || b.paragraphs.length || (b.bullets?.length ?? 0) || (b.numbered?.length ?? 0))
    .map((b, i) => ({
      heading: b.heading || `Concept ${i + 1}`,
      paragraphs: b.paragraphs,
      bullets: b.bullets?.length ? b.bullets : undefined,
      numbered: b.numbered?.length ? b.numbered : undefined,
    }));
}

function normalizeQuestions(value: unknown): StructuredQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const r = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return { question: toSafeAscii(r.question ?? r.q ?? ""), answer: toSafeAscii(r.answer ?? r.a ?? "") };
    })
    .filter((qa) => qa.question && qa.answer);
}

function repairDocument(candidate: unknown, fallbackTitle: string, dateLabel: string): StructuredDocument {
  const r = candidate && typeof candidate === "object" ? candidate as Record<string, unknown> : {};
  return {
    title: toSafeAscii(r.title ?? fallbackTitle) || fallbackTitle,
    introduction: normalizeParagraphArray(r.introduction).length
      ? normalizeParagraphArray(r.introduction)
      : [`This document provides a general overview of ${fallbackTitle.replace(/^.+?:\s*/, "").trim()} for informational purposes only.`],
    keyConcepts: normalizeBlocks(r.keyConcepts).length
      ? normalizeBlocks(r.keyConcepts)
      : [{ heading: "Core Framework", paragraphs: ["Key concepts should be reviewed in light of the relevant legal framework and jurisdiction-specific context."] }],
    importantConsiderations: normalizeBlocks(r.importantConsiderations).length
      ? normalizeBlocks(r.importantConsiderations)
      : [{ heading: "General Considerations", paragraphs: ["Important considerations often include timing, documentation quality, local rules, and professional guidance."] }],
    commonQuestions: normalizeQuestions(r.commonQuestions),
    furtherResources: normalizeStringList(r.furtherResources).length
      ? normalizeStringList(r.furtherResources)
      : ["Local statutes and regulations", "Official court or agency guidance", "Licensed professional consultation"],
    preparedBy: "EvoLegal Experts",
    date: dateLabel,
  };
}

function extractStructuredPayload(response: string, fallbackTitle: string, dateLabel: string) {
  const parsed = extractJsonFromResponse(response);
  const root = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  const documentCandidate = root.document ?? root;
  return {
    needsExpertReview: Boolean(root.needsExpertReview),
    expertReviewMessage: toSafeAscii(root.expertReviewMessage ?? "") || EXPERT_REVIEW_MESSAGE,
    document: repairDocument(documentCandidate, fallbackTitle, dateLabel),
  };
}

function hasQualityIssues(doc: StructuredDocument, dateLabel: string): boolean {
  const s = JSON.stringify(doc);
  return (
    !doc.title ||
    doc.introduction.length === 0 ||
    doc.keyConcepts.length === 0 ||
    doc.importantConsiderations.length === 0 ||
    doc.furtherResources.length === 0 ||
    doc.preparedBy !== "EvoLegal Experts" ||
    doc.date !== dateLabel ||
    /(â€|```|\*\*|__|#[A-Za-z])/.test(s)
  );
}

function buildDocumentContent(doc: StructuredDocument): string {
  const lines: string[] = [`TITLE: ${doc.title}`, "", "SECTION: Introduction"];
  lines.push(...doc.introduction, "", "SECTION: Key Concepts");
  for (const b of doc.keyConcepts) {
    lines.push(`SUBSECTION: ${b.heading}`);
    lines.push(...b.paragraphs);
    if (b.bullets?.length) lines.push(...b.bullets.map((x) => `- ${x}`));
    if (b.numbered?.length) lines.push(...b.numbered.map((x, i) => `${i + 1}. ${x}`));
    lines.push("");
  }
  lines.push("SECTION: Important Considerations");
  for (const b of doc.importantConsiderations) {
    lines.push(`SUBSECTION: ${b.heading}`);
    lines.push(...b.paragraphs);
    if (b.bullets?.length) lines.push(...b.bullets.map((x) => `- ${x}`));
    if (b.numbered?.length) lines.push(...b.numbered.map((x, i) => `${i + 1}. ${x}`));
    lines.push("");
  }
  if (doc.commonQuestions.length) {
    lines.push("SECTION: Common Questions");
    for (const qa of doc.commonQuestions) {
      lines.push(`Q: ${qa.question}`);
      lines.push(`A: ${qa.answer}`, "");
    }
  }
  lines.push("SECTION: Further Resources");
  lines.push(...doc.furtherResources.map((r) => `- ${r}`), "");
  lines.push(`PREPARED: ${doc.preparedBy}`);
  lines.push(`DATE: ${doc.date}`);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ── Main handler ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { document_type, topic, chat_id, request_id, conversation_context } = body;

    if (!document_type || !DOCUMENT_TYPES[document_type]) {
      return new Response(
        JSON.stringify({ error: "Invalid document_type. Use: overview, checklist, template, comparative" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!topic || typeof topic !== "string" || topic.length > 500) {
      return new Response(
        JSON.stringify({ error: "A valid topic is required (max 500 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const docConfig = DOCUMENT_TYPES[document_type];
    const fallbackTitle = `${docConfig.label}: ${topic}`;
    const dateLabel = formatCurrentDate();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ── Assemble Hugo Consilium Case File ─────────────────────────
    let caseFileTranscript = "";
    if (chat_id) {
      try {
        const { data: msgs } = await supabase
          .from("hugo_messages")
          .select("role, content, created_at")
          .eq("chat_id", chat_id)
          .order("created_at", { ascending: true })
          .limit(40);
        if (msgs && msgs.length) {
          caseFileTranscript = msgs
            .map((m: any) => {
              const speaker = m.role === "assistant" ? "HUGO" : m.role === "user" ? "CLIENT" : String(m.role).toUpperCase();
              return `[${speaker}] ${String(m.content || "").trim()}`;
            })
            .join("\n\n")
            .slice(0, 12000);
        }
      } catch (e) {
        console.error("case-file fetch failed:", e);
      }
    }
    const supplementalContext = conversation_context ? String(conversation_context).slice(0, 4000) : "";

    const caseFileBlock = (caseFileTranscript || supplementalContext)
      ? `\n\n=== HUGO CONSILIUM CASE FILE (authoritative source of facts, parties, jurisdiction, timeline) ===\n${caseFileTranscript || supplementalContext}\n=== END CASE FILE ===\n\nInstruction: Every section of the document must be drafted directly against the specific facts, parties, jurisdiction, and legal issues established in the Case File above. Do NOT produce generic educational text. If a paragraph could apply to any random reader, rewrite it until it can only apply to this client.`
      : `\n\nNo prior Case File was captured. Draft against the stated TOPIC as the client's matter, but still adopt the specialized role and produce a specific, non-generic work product.`;

    const userPayload = `ROLE: ${docConfig.role}\nDOCUMENT TYPE: ${docConfig.label}\nCLIENT TOPIC: ${topic}\nCURRENT DATE: ${dateLabel}\n\nDRAFTING BRIEF:\n${docConfig.prompt}${caseFileBlock}\n\nOutput the JSON document now. Begin with the "title" field. No greeting, no preface, no meta-commentary.`;

    // ── GENERATION ──────────────────────────────────────────────────
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
      if (status === 429) return new Response(JSON.stringify({ error: "Service is busy. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Document generation failed. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "Empty content generated. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const generatedPayload = extractStructuredPayload(content, fallbackTitle, dateLabel);
    if (generatedPayload.needsExpertReview) {
      return new Response(JSON.stringify({ escalated: true, message: generatedPayload.expertReviewMessage }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── REVIEWER ────────────────────────────────────────────────────
    const reviewResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DOCUMENT_MODEL,
        messages: [
          { role: "system", content: REVIEWER_SYSTEM },
          {
            role: "user",
            content: `ROLE: ${docConfig.role}\nDOCUMENT TYPE: ${docConfig.label}\nCLIENT TOPIC: ${topic}\nCURRENT DATE: ${dateLabel}${caseFileBlock}\n\nDOCUMENT TO REVIEW AND UPGRADE (return the same JSON schema, upgraded):\n\n${JSON.stringify(generatedPayload)}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 7000,
      }),
    });

    let finalDocument = generatedPayload.document;
    if (reviewResponse.ok) {
      const reviewData = await reviewResponse.json();
      const reviewed = reviewData.choices?.[0]?.message?.content || "";
      if (reviewed.trim()) {
        try {
          const reviewedPayload = extractStructuredPayload(reviewed, fallbackTitle, dateLabel);
          if (reviewedPayload.needsExpertReview) {
            return new Response(JSON.stringify({ escalated: true, message: reviewedPayload.expertReviewMessage }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          finalDocument = reviewedPayload.document;
        } catch (e) {
          console.error("Review parse failed, using original:", e);
        }
      }
    }

    // Force correct date and branding
    finalDocument.date = dateLabel;
    finalDocument.preparedBy = "EvoLegal Experts";

    if (hasQualityIssues(finalDocument, dateLabel)) {
      return new Response(JSON.stringify({ escalated: true, message: EXPERT_REVIEW_MESSAGE }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const finalTitle = finalDocument.title || fallbackTitle;
    const finalContent = buildDocumentContent(finalDocument);

    // ── BUILD PDF ───────────────────────────────────────────────────
    const pdfBytes = generatePDF(finalTitle, finalContent, DISCLAIMER, dateLabel);

    const timestamp = Date.now();
    const safeTopic = topic.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50);
    const filePath = `${user.id}/${document_type}_${safeTopic}_${timestamp}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("generated-documents")
      .upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save document." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: urlData } = supabase.storage.from("generated-documents").getPublicUrl(filePath);

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { error: insertError } = await userClient.from("generated_documents").insert({
      user_id: user.id,
      chat_id: chat_id || null,
      request_id: request_id || null,
      document_type,
      title: finalTitle,
      topic,
      file_path: filePath,
      file_url: urlData.publicUrl,
    });

    if (insertError) console.error("Insert error:", insertError);

    return new Response(
      JSON.stringify({ success: true, title: finalTitle, file_url: urlData.publicUrl, document_type: docConfig.label }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── PDF Encoding ───────────────────────────────────────────────────

function pdfEncode(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if ((c >= 0x20 && c <= 0x7E) || (c >= 0xA0 && c <= 0xFF)) {
      const ch = s[i];
      if (ch === "\\") out += "\\\\";
      else if (ch === "(") out += "\\(";
      else if (ch === ")") out += "\\)";
      else out += ch;
    } else if (c === 0x09) {
      out += "    ";
    }
  }
  return out;
}

function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(/\s+/);
  const result: string[] = [];
  let line = "";
  for (const word of words) {
    if (line.length + word.length + 1 > maxChars) {
      if (line) result.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) result.push(line);
  return result;
}

// ── PDF Generator ──────────────────────────────────────────────────

interface PdfLine {
  text: string;
  type: "title" | "section" | "subsection" | "body" | "bullet" | "numbered" | "qa-q" | "qa-a" | "blank" | "prepared" | "date";
}

function parseLines(content: string): PdfLine[] {
  const result: PdfLine[] = [];
  for (const raw of content.split("\n")) {
    const t = raw.trim();
    if (!t) { result.push({ text: "", type: "blank" }); continue; }
    if (t.startsWith("TITLE:")) { result.push({ text: t.replace("TITLE:", "").trim(), type: "title" }); continue; }
    if (t.startsWith("SECTION:")) { result.push({ text: t.replace("SECTION:", "").trim(), type: "section" }); continue; }
    if (t.startsWith("SUBSECTION:")) { result.push({ text: t.replace("SUBSECTION:", "").trim(), type: "subsection" }); continue; }
    if (t.startsWith("Q: ")) { result.push({ text: t.slice(3), type: "qa-q" }); continue; }
    if (t.startsWith("A: ")) { result.push({ text: t.slice(3), type: "qa-a" }); continue; }
    if (t.startsWith("PREPARED:")) { result.push({ text: t.replace("PREPARED:", "").trim(), type: "prepared" }); continue; }
    if (t.startsWith("DATE:")) { result.push({ text: t.replace("DATE:", "").trim(), type: "date" }); continue; }
    if (/^\d+\.\s/.test(t)) { result.push({ text: t, type: "numbered" }); continue; }
    if (t.startsWith("- ")) { result.push({ text: t.slice(2), type: "bullet" }); continue; }
    result.push({ text: t, type: "body" });
  }
  return result;
}

function generatePDF(title: string, content: string, disclaimer: string, dateLabel: string): Uint8Array {
  const pdfOut: string[] = [];
  const objects: { offset: number }[] = [];
  let currentOffset = 0;

  function write(s: string) {
    pdfOut.push(s);
    currentOffset += new TextEncoder().encode(s + "\n").length;
  }
  function startObj(id: number) {
    objects[id] = { offset: currentOffset };
    write(`${id} 0 obj`);
  }

  const PW = 612;
  const PH = 792;
  const ML = 60;
  const MR = 60;
  const MT = 72;
  const MB = 88;
  const BODY_CHARS = 78;
  const BULLET_INDENT = 18;
  const BULLET_CHARS = 72;

  const LH_BODY = 16;
  const LH_SECTION = 28;
  const LH_SUBSECTION = 22;
  const LH_BLANK = 10;

  const parsed = parseLines(content);

  interface Cmd { font: string; size: number; x: number; y: number; text: string; color?: [number, number, number]; }
  interface PageData { cmds: Cmd[]; }

  const pages: PageData[] = [];
  let cmds: Cmd[] = [];
  let y = PH - MT;

  function newPage() {
    if (cmds.length > 0) pages.push({ cmds });
    cmds = [];
    y = PH - MT;
  }
  function need(h: number) { if (y - h < MB) newPage(); }
  function add(font: string, size: number, x: number, text: string, color?: [number, number, number]) {
    cmds.push({ font, size, x, y, text, color });
  }

  for (const item of parsed) {
    switch (item.type) {
      case "title": {
        const w = wrapText(item.text, 56);
        for (const l of w) { need(24); add("F2", 16, ML, l, [10, 40, 55]); y -= 24; }
        y -= 4;
        // Accent line under title
        need(6);
        cmds.push({ font: "__HR__", size: 0, x: ML, y: y + 4, text: "" });
        y -= 12;
        break;
      }
      case "section": {
        need(LH_SECTION + 16);
        y -= 14;
        add("F2", 12, ML, item.text, [15, 50, 65]);
        y -= 6;
        cmds.push({ font: "__ACCENT__", size: 0, x: ML, y, text: "" });
        y -= LH_SECTION - 12;
        break;
      }
      case "subsection": {
        need(LH_SUBSECTION + 8);
        y -= 8;
        add("F2", 11, ML, item.text, [30, 35, 40]);
        y -= LH_SUBSECTION - 4;
        break;
      }
      case "qa-q": {
        const w = wrapText("Q:  " + item.text, BODY_CHARS);
        for (const l of w) { need(LH_BODY); add("F2", 10, ML + 4, l, [25, 45, 60]); y -= LH_BODY; }
        y -= 2;
        break;
      }
      case "qa-a": {
        const w = wrapText("A:  " + item.text, BODY_CHARS - 2);
        for (const l of w) { need(LH_BODY); add("F1", 10, ML + 8, l, [55, 58, 65]); y -= LH_BODY; }
        y -= 5;
        break;
      }
      case "bullet": {
        const w = wrapText(item.text, BULLET_CHARS);
        for (let i = 0; i < w.length; i++) {
          need(LH_BODY);
          if (i === 0) { add("F2", 10, ML + 6, "-", [0, 120, 155]); }
          add("F1", 10, ML + BULLET_INDENT, w[i], [55, 58, 65]);
          y -= LH_BODY;
        }
        y -= 3;
        break;
      }
      case "numbered": {
        const m = item.text.match(/^(\d+\.)\s*(.*)/);
        const num = m ? m[1] : "";
        const rest = m ? m[2] : item.text;
        const w = wrapText(rest, BULLET_CHARS - 4);
        for (let i = 0; i < w.length; i++) {
          need(LH_BODY);
          if (i === 0) { add("F2", 10, ML + 4, num, [0, 120, 155]); }
          add("F1", 10, ML + 22, w[i], [55, 58, 65]);
          y -= LH_BODY;
        }
        y -= 3;
        break;
      }
      case "prepared": {
        need(22);
        y -= 10;
        add("F2", 9, ML, item.text, [80, 85, 95]);
        y -= 14;
        break;
      }
      case "date": {
        need(16);
        add("F1", 9, ML, item.text, [90, 100, 115]);
        y -= 14;
        break;
      }
      case "blank": {
        y -= LH_BLANK;
        if (y < MB) newPage();
        break;
      }
      case "body":
      default: {
        const w = wrapText(item.text, BODY_CHARS);
        for (const l of w) { need(LH_BODY); add("F1", 10, ML, l, [55, 58, 65]); y -= LH_BODY; }
        y -= 3;
        break;
      }
    }
  }

  if (cmds.length > 0) pages.push({ cmds });
  if (pages.length === 0) pages.push({ cmds: [] });

  const totalPages = pages.length;

  // ── Build PDF binary ──────────────────────────────────────────────
  write("%PDF-1.4");

  // Fonts
  startObj(1); write("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"); write("endobj");
  startObj(2); write("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"); write("endobj");
  startObj(3); write("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>"); write("endobj");

  const imageObjId = 4;
  const pageObjStart = 5;
  const contentObjStart = pageObjStart + totalPages;
  const pagesObjId = contentObjStart + totalPages;
  const catalogObjId = pagesObjId + 1;

  // ── Image XObject: pre-rendered EvoLegal "E" logo (JPEG, ASCIIHex-encoded) ──
  const logoHexStr = logoHex();
  const logoStreamText = logoHexStr + "\n>";
  const logoStreamLen = new TextEncoder().encode(logoStreamText).length;
  startObj(imageObjId);
  write(
    `<< /Type /XObject /Subtype /Image /Width ${LOGO_W} /Height ${LOGO_H} ` +
    `/ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
    `/Filter [/ASCIIHexDecode /DCTDecode] /Length ${logoStreamLen} >>`,
  );
  write("stream");
  write(logoStreamText);
  write("endstream");
  write("endobj");

  const disclaimerWrapped = wrapText(disclaimer, 95);

  for (let p = 0; p < totalPages; p++) {
    const page = pages[p];
    let stream = "";

    // ── HEADER: Dark band ──────────────────────────────────────────
    const headerH = 46;
    stream += "q\n";
    stream += "0.047 0.059 0.098 rg\n";
    stream += `0 ${PH - headerH} ${PW} ${headerH} re f\n`;
    stream += "Q\n";

    // Cyan accent line under header
    stream += "q\n0 0.863 1 RG\n0.6 w\n";
    stream += `${ML} ${PH - headerH} m ${PW - MR} ${PH - headerH} l S\n`;
    stream += "Q\n";

    // ── 33-degree solid filled "E" logo ────────────────────────────
    stream += "q\n";
    const lx = ML + 4;
    const ly = PH - 14;
    const eW = 17;
    const eH = 26;
    const barH = 5;
    const midBarW = 12;
    const stemW = 6;
    const cos33 = 0.8387;
    const sin33 = 0.5446;
    function tx(px: number, py: number) { return (lx + cos33 * px + sin33 * py).toFixed(2); }
    function ty(px: number, py: number) { return (ly - sin33 * px + cos33 * py).toFixed(2); }
    const pts: [number, number][] = [
      [0, 0], [eW, 0], [eW, barH], [stemW, barH],
      [stemW, eH / 2 - barH / 2], [midBarW, eH / 2 - barH / 2],
      [midBarW, eH / 2 + barH / 2], [stemW, eH / 2 + barH / 2],
      [stemW, eH - barH], [eW, eH - barH], [eW, eH], [0, eH],
    ];
    // Neon cyan fill
    stream += "0 0.918 1 rg\n";
    stream += `${tx(pts[0][0], -pts[0][1])} ${ty(pts[0][0], -pts[0][1])} m\n`;
    for (let i = 1; i < pts.length; i++) {
      stream += `${tx(pts[i][0], -pts[i][1])} ${ty(pts[i][0], -pts[i][1])} l\n`;
    }
    stream += "f\n";
    // Purple rim light on left edge
    stream += "0.753 0.518 0.988 RG\n0.6 w\n";
    stream += `${tx(0, 0)} ${ty(0, 0)} m ${tx(0, -eH)} ${ty(0, -eH)} l S\n`;
    stream += "Q\n";

    // Brand name "EvoLegal"
    stream += "BT\n1 1 1 rg\n/F2 14 Tf\n";
    stream += `${ML + 28} ${PH - 36} Td\n`;
    stream += `(${pdfEncode("EvoLegal")}) Tj\nET\n`;

    // Page number
    stream += "BT\n0.55 0.58 0.65 rg\n/F1 8 Tf\n";
    stream += `${PW - MR - 70} ${PH - 36} Td\n`;
    stream += `(Page ${p + 1} of ${totalPages}) Tj\nET\n`;

    // ── PAGE CONTENT ─────────────────────────────────────────────────
    for (const cmd of page.cmds) {
      if (cmd.font === "__HR__") {
        stream += `q\n0.75 0.78 0.82 RG\n0.4 w\n${ML} ${cmd.y} m ${PW - MR} ${cmd.y} l S\nQ\n`;
        continue;
      }
      if (cmd.font === "__ACCENT__") {
        stream += `q\n0.82 0.85 0.88 RG\n0.4 w\n${ML} ${cmd.y} m ${PW - MR} ${cmd.y} l S\nQ\n`;
        continue;
      }
      const [r, g, b] = cmd.color || [55, 58, 65];
      stream += "BT\n";
      stream += `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg\n`;
      stream += `/${cmd.font} ${cmd.size} Tf\n`;
      stream += `${cmd.x} ${cmd.y} Td\n`;
      stream += `(${pdfEncode(cmd.text)}) Tj\nET\n`;
    }

    // ── FOOTER ───────────────────────────────────────────────────────
    stream += `q\n0.82 0.84 0.87 RG\n0.3 w\n${ML} ${MB - 4} m ${PW - MR} ${MB - 4} l S\nQ\n`;

    let fy = MB - 16;
    for (const dl of disclaimerWrapped) {
      stream += `BT\n0.48 0.50 0.55 rg\n/F3 6.5 Tf\n${ML} ${fy} Td\n(${pdfEncode(dl)}) Tj\nET\n`;
      fy -= 8;
    }

    // Date in footer right
    stream += `BT\n0.42 0.45 0.50 rg\n/F1 6.5 Tf\n${PW - MR - 90} ${fy - 2} Td\n(${pdfEncode(dateLabel)}) Tj\nET\n`;

    // Content stream object
    const contentId = contentObjStart + p;
    startObj(contentId);
    const streamBytes = new TextEncoder().encode(stream);
    write(`<< /Length ${streamBytes.length} >>`);
    write("stream");
    write(stream.trimEnd());
    write("endstream");
    write("endobj");

    // Page object
    startObj(pageObjStart + p);
    write(`<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${PW} ${PH}] /Contents ${contentId} 0 R /Resources << /Font << /F1 1 0 R /F2 2 0 R /F3 3 0 R >> >> >>`);
    write("endobj");
  }

  // Pages object
  const pageRefs = Array.from({ length: totalPages }, (_, i) => `${pageObjStart + i} 0 R`).join(" ");
  startObj(pagesObjId);
  write(`<< /Type /Pages /Kids [${pageRefs}] /Count ${totalPages} >>`);
  write("endobj");

  // Catalog
  startObj(catalogObjId);
  write(`<< /Type /Catalog /Pages ${pagesObjId} 0 R >>`);
  write("endobj");

  // Cross-reference table
  const xrefOffset = currentOffset;
  const totalObjs = catalogObjId + 1;
  write("xref");
  write(`0 ${totalObjs}`);
  write("0000000000 65535 f ");
  for (let i = 1; i < totalObjs; i++) {
    const off = objects[i]?.offset || 0;
    write(`${String(off).padStart(10, "0")} 00000 n `);
  }

  write("trailer");
  write(`<< /Size ${totalObjs} /Root ${catalogObjId} 0 R >>`);
  write("startxref");
  write(String(xrefOffset));
  write("%%EOF");

  return new TextEncoder().encode(pdfOut.join("\n"));
}
