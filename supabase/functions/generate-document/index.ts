import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCLAIMER =
  "This is a general informational template only. It is not legal advice and does not create an attorney-client relationship. Laws vary by jurisdiction. Always consult a licensed professional for your specific situation.";

const DOCUMENT_MODEL = "google/gemini-2.5-pro";
const EXPERT_REVIEW_MESSAGE =
  "This topic may benefit from expert review. Would you like to connect with an EvoLegal Expert?";

// ── Document type definitions ──────────────────────────────────────
const DOCUMENT_TYPES: Record<string, { label: string; prompt: string }> = {
  overview: {
    label: "Information Overview",
    prompt: `Create a refined general overview that explains the topic with calm authority. Prioritize elegant prose, a coherent introduction, well-developed key concepts, practical considerations, helpful neutral questions, and general resource categories.`,
  },
  checklist: {
    label: "Preparation Checklist",
    prompt: `Create a polished preparation checklist with a brief purpose statement, clearly organized concepts, practical considerations, concise numbered actions, and placeholders where personal details or dates would normally be inserted.`,
  },
  template: {
    label: "Template Outline",
    prompt: `Create a clean informational template outline with elegant placeholder-driven drafting language, neutral provisions, and clearly labeled sections that remain general and educational rather than personalized.`,
  },
  comparative: {
    label: "Comparative Guide",
    prompt: `Create a balanced comparative guide with clear distinctions, shared themes, practical considerations, and a neutral summary. Preserve a calm, sophisticated tone throughout.`,
  },
};

// ── System prompts ─────────────────────────────────────────────────

const GENERATOR_SYSTEM = `You are the EvoLegal Document Writer -- a senior legal information specialist producing calm, elegant, trustworthy informational documents.

Return ONLY valid JSON matching this exact shape:
{
  "needsExpertReview": false,
  "expertReviewMessage": "",
  "document": {
    "title": "string",
    "introduction": ["paragraph"],
    "keyConcepts": [
      {
        "heading": "string",
        "paragraphs": ["paragraph"],
        "bullets": ["optional bullet"]
      }
    ],
    "importantConsiderations": [
      {
        "heading": "string",
        "paragraphs": ["paragraph"],
        "bullets": ["optional bullet"]
      }
    ],
    "commonQuestions": [
      {
        "question": "string",
        "answer": "string"
      }
    ],
    "furtherResources": ["resource category"],
    "preparedBy": "EvoLegal Experts",
    "date": "Month Day, Year"
  }
}

Rules:
- Use plain ASCII only.
- Never include markdown, code fences, bullets as Unicode, or commentary outside JSON.
- Replace variables with {{Placeholder Name}} or [REQUIRES USER INPUT: ...].
- Keep the voice calm, refined, confident, and professional.
- Avoid repetitive openings, filler language, and mechanical phrasing.
- Common Questions may be empty only if the topic genuinely does not benefit from them.
- Only set needsExpertReview to true for active court proceedings involving real party names and real case numbers.
- General informational topics must proceed normally.`;

const REVIEWER_SYSTEM = `You are the EvoLegal Document Reviewer -- a senior editorial reviewer enforcing luxury publication standards.

Return ONLY valid JSON in the SAME schema you received.

Silently fix all of the following before returning JSON:
- broken encoding or mojibake
- markdown artifacts or stray symbols
- incorrect or inconsistent date
- missing structure or weak hierarchy
- repetitive, vague, or mechanical language
- poor flow between sections
- thin or underdeveloped sections
- placeholder mistakes

Rules:
- Output plain ASCII text only inside the JSON values.
- Preserve a calm, elegant, neutral tone.
- Ensure the document is general information only and not personalized legal advice.
- Ensure all required sections are present and substantive.
- Only set needsExpertReview to true for active court proceedings involving real party names and real case numbers.
- General informational content must remain generatable.`;

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
  if (jsonStart === -1) {
    throw new Error("No JSON object found in response");
  }

  const opening = cleaned[jsonStart];
  const closing = opening === "[" ? "]" : "}";
  const jsonEnd = cleaned.lastIndexOf(closing);
  if (jsonEnd === -1) {
    throw new Error("Incomplete JSON object found in response");
  }

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

function normalizeTextValue(value: unknown): string {
  const base = typeof value === "string" ? value : String(value ?? "");
  return base
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .replace(/\*\*|__|`|#{1,6}\s*/g, "")
    .replace(/[\u2013\u2014]/g, "--")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/â€“|â€”|â€"|â€\"/g, "--")
    .replace(/â€œ|â€\u009d/g, '"')
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€¢|¢/g, "-")
    .replace(/â€¦/g, "...")
    .replace(/Â/g, " ")
    .replace(/[\r\t]+/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function polishSentenceFlow(value: unknown): string {
  return normalizeTextValue(value)
    .replace(/\byou should\b/gi, "it is often appropriate to")
    .replace(/\byou must\b/gi, "it is generally required to")
    .replace(/\bneed to\b/gi, "it is often necessary to")
    .replace(/\bhave to\b/gi, "it is often necessary to")
    .replace(/\bsteps\b/gi, "considerations")
    .replace(/\bstep\b/gi, "consideration")
    .replace(/\s+([,.;:?!])/g, "$1")
    .trim();
}

function normalizeParagraphArray(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n{2,}|\n/)
      : [];

  return source
    .map((entry) => polishSentenceFlow(entry))
    .filter(Boolean);
}

function normalizeStringList(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|;/)
      : [];

  const seen = new Set<string>();
  return source
    .map((entry) => polishSentenceFlow(entry).replace(/^-+\s*/, ""))
    .filter(Boolean)
    .filter((entry) => {
      const key = entry.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeBlocks(value: unknown): StructuredBlock[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return {
          heading: polishSentenceFlow(entry),
          paragraphs: [],
          bullets: [],
          numbered: [],
        } satisfies StructuredBlock;
      }

      const record = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return {
        heading: polishSentenceFlow(record.heading ?? record.title ?? ""),
        paragraphs: normalizeParagraphArray(record.paragraphs ?? record.content ?? record.body),
        bullets: normalizeStringList(record.bullets),
        numbered: normalizeStringList(record.numbered),
      } satisfies StructuredBlock;
    })
    .filter((block) => block.heading || block.paragraphs.length || (block.bullets?.length ?? 0) || (block.numbered?.length ?? 0))
    .map((block, index) => ({
      heading: block.heading || `Concept ${index + 1}`,
      paragraphs: block.paragraphs,
      bullets: block.bullets?.length ? block.bullets : undefined,
      numbered: block.numbered?.length ? block.numbered : undefined,
    }));
}

function normalizeQuestions(value: unknown): StructuredQuestion[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      const record = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return {
        question: polishSentenceFlow(record.question ?? record.q ?? ""),
        answer: polishSentenceFlow(record.answer ?? record.a ?? ""),
      } satisfies StructuredQuestion;
    })
    .filter((qa) => qa.question && qa.answer);
}

function repairStructuredDocument(candidate: unknown, fallbackTitle: string, currentDateLabel: string): StructuredDocument {
  const record = candidate && typeof candidate === "object" ? candidate as Record<string, unknown> : {};

  const introduction = normalizeParagraphArray(record.introduction);
  const keyConcepts = normalizeBlocks(record.keyConcepts);
  const importantConsiderations = normalizeBlocks(record.importantConsiderations);
  const commonQuestions = normalizeQuestions(record.commonQuestions);
  const furtherResources = normalizeStringList(record.furtherResources);

  return {
    title: polishSentenceFlow(record.title ?? fallbackTitle) || fallbackTitle,
    introduction: introduction.length
      ? introduction
      : [
          `This document provides a calm, general overview of ${fallbackTitle.replace(/^.+?:\s*/, "").trim()} for informational purposes only.`,
        ],
    keyConcepts: keyConcepts.length
      ? keyConcepts
      : [
          {
            heading: "Core Framework",
            paragraphs: [
              "Key concepts should be reviewed in light of the relevant legal framework, procedural posture, and jurisdiction-specific context.",
            ],
          },
        ],
    importantConsiderations: importantConsiderations.length
      ? importantConsiderations
      : [
          {
            heading: "General Considerations",
            paragraphs: [
              "Important considerations often include timing, documentation quality, local rules, and the factual detail required for reliable professional guidance.",
            ],
          },
        ],
    commonQuestions,
    furtherResources: furtherResources.length
      ? furtherResources
      : ["Local statutes and regulations", "Official court or agency guidance", "Licensed professional consultation"],
    preparedBy: "EvoLegal Experts",
    date: currentDateLabel,
  };
}

function extractStructuredPayload(response: string, fallbackTitle: string, currentDateLabel: string): {
  needsExpertReview: boolean;
  expertReviewMessage: string;
  document: StructuredDocument;
} {
  const parsed = extractJsonFromResponse(response);
  const root = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  const documentCandidate = root.document ?? root;

  return {
    needsExpertReview: Boolean(root.needsExpertReview),
    expertReviewMessage: polishSentenceFlow(root.expertReviewMessage ?? "") || EXPERT_REVIEW_MESSAGE,
    document: repairStructuredDocument(documentCandidate, fallbackTitle, currentDateLabel),
  };
}

function hasLuxuryQualityIssues(document: StructuredDocument, currentDateLabel: string): boolean {
  const serialized = JSON.stringify(document);
  return (
    !document.title ||
    document.introduction.length === 0 ||
    document.keyConcepts.length === 0 ||
    document.importantConsiderations.length === 0 ||
    document.furtherResources.length === 0 ||
    document.preparedBy !== "EvoLegal Experts" ||
    document.date !== currentDateLabel ||
    /(â€|â€¢|�|```|\*\*|__|#[A-Za-z]|\b(?:you should|you must|need to|have to|steps?)\b)/i.test(serialized)
  );
}

function buildDocumentContent(document: StructuredDocument): string {
  const lines: string[] = [`TITLE: ${document.title}`, "", "SECTION: Introduction"];

  lines.push(...document.introduction, "", "SECTION: Key Concepts");

  for (const block of document.keyConcepts) {
    lines.push(`SUBSECTION: ${block.heading}`);
    lines.push(...block.paragraphs);
    if (block.bullets?.length) lines.push(...block.bullets.map((bullet) => `- ${bullet}`));
    if (block.numbered?.length) lines.push(...block.numbered.map((item, index) => `${index + 1}. ${item}`));
    lines.push("");
  }

  lines.push("SECTION: Important Considerations");
  for (const block of document.importantConsiderations) {
    lines.push(`SUBSECTION: ${block.heading}`);
    lines.push(...block.paragraphs);
    if (block.bullets?.length) lines.push(...block.bullets.map((bullet) => `- ${bullet}`));
    if (block.numbered?.length) lines.push(...block.numbered.map((item, index) => `${index + 1}. ${item}`));
    lines.push("");
  }

  if (document.commonQuestions.length) {
    lines.push("SECTION: Common Questions");
    for (const qa of document.commonQuestions) {
      lines.push(`Q: ${qa.question}`);
      lines.push(`A: ${qa.answer}`, "");
    }
  }

  lines.push("SECTION: Further Resources");
  lines.push(...document.furtherResources.map((resource) => `- ${resource}`), "");
  lines.push("", `Date: ${document.date}`);

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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    const currentDateLabel = formatCurrentDate();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contextNote = conversation_context
      ? `\n\nContext from the user's conversation: ${conversation_context.slice(0, 1000)}`
      : "";

    // ── GENERATION ──────────────────────────────────────────────────
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DOCUMENT_MODEL,
        messages: [
          { role: "system", content: GENERATOR_SYSTEM },
          {
            role: "user",
            content: `DOCUMENT TYPE: ${docConfig.label}\nTOPIC: ${topic}\nCURRENT DATE: ${currentDateLabel}\n\nRequired document order:\n1. Title\n2. Introduction\n3. Key Concepts\n4. Important Considerations\n5. Common Questions\n6. Further Resources\n7. Prepared By\n8. Date\n\n${docConfig.prompt}${contextNote}`,
          },
        ],
        temperature: 0.25,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("AI generation failed:", status);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Service is busy. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: "Document generation failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    if (!content.trim()) {
      return new Response(
        JSON.stringify({ error: "Empty content generated. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generatedPayload = extractStructuredPayload(content, fallbackTitle, currentDateLabel);
    if (generatedPayload.needsExpertReview) {
      return new Response(
        JSON.stringify({ escalated: true, message: generatedPayload.expertReviewMessage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── REVIEWER ────────────────────────────────────────────────────
    const reviewResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DOCUMENT_MODEL,
        messages: [
          { role: "system", content: REVIEWER_SYSTEM },
          {
            role: "user",
            content: `DOCUMENT TYPE: ${docConfig.label}\nTOPIC: ${topic}\nCURRENT DATE: ${currentDateLabel}\n\nDOCUMENT TO REVIEW:\n\n${JSON.stringify(generatedPayload)}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    let finalDocument = generatedPayload.document;
    if (reviewResponse.ok) {
      const reviewData = await reviewResponse.json();
      const reviewed = reviewData.choices?.[0]?.message?.content || "";
      if (reviewed.trim()) {
        const reviewedPayload = extractStructuredPayload(reviewed, fallbackTitle, currentDateLabel);
        if (reviewedPayload.needsExpertReview) {
          return new Response(
            JSON.stringify({ escalated: true, message: reviewedPayload.expertReviewMessage }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        finalDocument = reviewedPayload.document;
      }
    } else {
      console.error("Document review failed, using original:", reviewResponse.status);
    }

    // ── POST-PROCESS ────────────────────────────────────────────────
    if (hasLuxuryQualityIssues(finalDocument, currentDateLabel)) {
      return new Response(
        JSON.stringify({ escalated: true, message: EXPERT_REVIEW_MESSAGE }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finalTitle = finalDocument.title || fallbackTitle;
    const finalContent = sanitizeForPdf(buildDocumentContent(finalDocument));

    // ── BUILD PDF ───────────────────────────────────────────────────
    const pdfBytes = generatePDF(finalTitle, docConfig.label, topic, finalContent, DISCLAIMER, currentDateLabel);

    // Upload to storage
    const timestamp = Date.now();
    const safeTopic = topic.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50);
    const filePath = `${user.id}/${document_type}_${safeTopic}_${timestamp}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("generated-documents")
      .upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to save document." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      JSON.stringify({
        success: true,
        title: finalTitle,
        file_url: urlData.publicUrl,
        document_type: docConfig.label,
      }),
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

// ── Text sanitizer (replaces stripMarkdown) ────────────────────────
// Aggressively cleans all non-ASCII and markdown artifacts for safe
// WinAnsiEncoding PDF rendering.
function sanitizeForPdf(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`(.+?)`/g, "$1")
    // Fix encoding artifacts (UTF-8 mojibake from em-dash, en-dash, smart quotes)
    .replace(/\u00e2\u0080\u0093/g, "--")  // â€" -> --
    .replace(/\u00e2\u0080\u0094/g, "--")  // â€" -> --
    .replace(/\u00e2\u0080\u009c/g, '"')   // â€œ -> "
    .replace(/\u00e2\u0080\u009d/g, '"')   // â€ -> "
    .replace(/\u00e2\u0080\u0098/g, "'")   // â€˜ -> '
    .replace(/\u00e2\u0080\u0099/g, "'")   // â€™ -> '
    .replace(/\u00e2\u0080\u00a2/g, "- ")  // â€¢ -> -
    .replace(/\u00e2\u0080\u00a6/g, "...") // â€¦ -> ...
    // Direct Unicode replacements
    .replace(/[\u2013\u2014]/g, "--")       // en-dash, em-dash
    .replace(/[\u2018\u2019]/g, "'")        // smart single quotes
    .replace(/[\u201C\u201D]/g, '"')        // smart double quotes
    .replace(/\u2022/g, "- ")              // bullet
    .replace(/\u2026/g, "...")             // ellipsis
    .replace(/\u00A0/g, " ")              // non-breaking space
    // Common mojibake patterns (string form)
    .replace(/â€"/g, "--")
    .replace(/â€"/g, "--")
    .replace(/â€œ/g, '"')
    .replace(/â€\u009d/g, '"')
    .replace(/â€˜/g, "'")
    .replace(/â€™/g, "'")
    .replace(/â€¢/g, "- ")
    .replace(/â€¦/g, "...")
    .replace(/Â·/g, "-")
    .replace(/Â /g, " ")
    // Replace any remaining Unicode bullets
    .replace(/^[•●◦▪▸►¢→»]/gm, "-")
    .replace(/^Date:\s*.*/gm, `Date: ${formatCurrentDate()}`)
    // Clean up excessive newlines
    .replace(/\n{3,}/g, "\n\n");
}

// ── PDF Generator ──────────────────────────────────────────────────

interface PdfLine {
  text: string;
  type: "title" | "section" | "subsection" | "body" | "bullet" | "numbered" | "qa-q" | "qa-a" | "blank" | "meta";
}

function parseLinesFromContent(title: string, docType: string, topic: string, content: string, currentDateLabel: string): PdfLine[] {
  const result: PdfLine[] = [];

  result.push({ text: title, type: "title" });
  result.push({ text: "", type: "blank" });
  result.push({ text: "__HR__", type: "blank" });
  result.push({ text: "", type: "blank" });

  const lines = content.split("\n");
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      result.push({ text: "", type: "blank" });
    } else if (trimmed.startsWith("TITLE:")) {
      // Skip -- we already have the title
    } else if (trimmed.startsWith("SECTION:")) {
      result.push({ text: trimmed.replace("SECTION:", "").trim(), type: "section" });
    } else if (trimmed.startsWith("SUBSECTION:")) {
      result.push({ text: trimmed.replace("SUBSECTION:", "").trim(), type: "subsection" });
    } else if (/^Q:\s/.test(trimmed)) {
      result.push({ text: trimmed.replace(/^Q:\s*/, ""), type: "qa-q" });
    } else if (/^A:\s/.test(trimmed)) {
      result.push({ text: trimmed.replace(/^A:\s*/, ""), type: "qa-a" });
    } else if (/^\d+\.\s/.test(trimmed)) {
      result.push({ text: trimmed, type: "numbered" });
    } else if (trimmed.startsWith("- ")) {
      result.push({ text: trimmed.slice(2), type: "bullet" });
    } else {
      result.push({ text: trimmed, type: "body" });
    }
  }

  return result;
}

// Encode a string for PDF text operators using WinAnsiEncoding.
// Replaces problematic characters with safe ASCII equivalents,
// then escapes PDF special chars.
function pdfEncode(s: string): string {
  let safe = s
    .replace(/[\u2013\u2014]/g, "--")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2022/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ");
  // Strip any remaining chars outside WinAnsiEncoding printable range
  // Keep 0x20-0x7E (basic ASCII) and 0xA0-0xFF (WinAnsi extended)
  let out = "";
  for (let i = 0; i < safe.length; i++) {
    const c = safe.charCodeAt(i);
    if ((c >= 0x20 && c <= 0x7E) || (c >= 0xA0 && c <= 0xFF)) {
      out += safe[i];
    } else if (c === 0x09) {
      out += "    "; // tab -> spaces
    }
    // else drop the character silently
  }
  return out.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfHeaderTitle(title: string): string[] {
  const cleaned = sanitizeForPdf(title).replace(/^TITLE:\s*/i, "").trim();
  if (!cleaned) return ["Document"];
  return cleaned.length > 96
    ? [cleaned.slice(0, 48).trim(), cleaned.slice(48, 96).trim()]
    : cleaned.length > 48
      ? [cleaned.slice(0, 48).trim(), cleaned.slice(48).trim()]
      : [cleaned];
}

function generatePDF(
  title: string,
  docType: string,
  topic: string,
  content: string,
  disclaimer: string,
  currentDateLabel: string
): Uint8Array {
  const pdfLines: string[] = [];
  const objects: { offset: number }[] = [];
  let currentOffset = 0;

  function write(s: string) {
    pdfLines.push(s);
    currentOffset += new TextEncoder().encode(s + "\n").length;
  }
  function startObj(id: number) {
    objects[id] = { offset: currentOffset };
    write(`${id} 0 obj`);
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

  // Layout constants
  const PW = 612;
  const PH = 792;
  const ML = 60;
  const MR = 60;
  const MT = 72;
  const MB = 90; // more room for footer disclaimer
  const BODY_CHARS = 78;
  const BULLET_INDENT = 18;
  const BULLET_CHARS = 72;
  const NUM_INDENT = 22;
  const NUM_CHARS = 70;

  const LH_BODY = 17;
  const LH_SECTION = 30;
  const LH_SUBSECTION = 24;
  const LH_BLANK = 12;
  const LH_META = 16;

  const structured = parseLinesFromContent(title, docType, topic, content, currentDateLabel);

  interface RenderCmd {
    font: string; size: number; x: number; y: number; text: string;
    color?: [number, number, number];
  }
  interface PageData { cmds: RenderCmd[]; }

  const pages: PageData[] = [];
  let currentPage: RenderCmd[] = [];
  let y = PH - MT;
  let hasHrPending = false;

  function newPage() {
    if (currentPage.length > 0) pages.push({ cmds: currentPage });
    currentPage = [];
    y = PH - MT;
  }

  function needSpace(h: number) {
    if (y - h < MB) newPage();
  }

  function addText(font: string, size: number, x: number, text: string, color?: [number, number, number]) {
    currentPage.push({ font, size, x, y, text, color });
  }

  for (const item of structured) {
    if (item.type === "blank" && item.text === "__HR__") {
      hasHrPending = true;
      continue;
    }

    if (hasHrPending) {
      hasHrPending = false;
      needSpace(6);
      currentPage.push({ font: "__FULL_LINE__", size: 0, x: ML, y: y + 4, text: `${ML} ${y + 4} m ${PW - MR} ${y + 4} l S` });
      y -= 12;
    }

    switch (item.type) {
      case "title": {
        const wrapped = wrapText(item.text, 58);
        for (const line of wrapped) {
          needSpace(24);
          addText("F2", 16, ML, line, [10, 40, 55]);
          y -= 24;
        }
        y -= 6;
        break;
      }
      case "section": {
        needSpace(LH_SECTION + 18);
        y -= 16;
        addText("F2", 12, ML, item.text, [15, 50, 65]);
        y -= 8;
        currentPage.push({ font: "__LINE_ACCENT__", size: 0, x: ML, y, text: `${ML} ${y} m ${PW - MR} ${y} l S` });
        y -= LH_SECTION - 14;
        break;
      }
      case "subsection": {
        needSpace(LH_SUBSECTION + 10);
        y -= 8;
        addText("F2", 11, ML, item.text, [30, 35, 40]);
        y -= LH_SUBSECTION - 4;
        break;
      }
      case "qa-q": {
        const wrapped = wrapText("Q:  " + item.text, BODY_CHARS);
        for (const line of wrapped) {
          needSpace(LH_BODY);
          addText("F2", 10, ML + 4, line, [25, 45, 60]);
          y -= LH_BODY;
        }
        y -= 3;
        break;
      }
      case "qa-a": {
        const wrapped = wrapText("A:  " + item.text, BODY_CHARS - 2);
        for (const line of wrapped) {
          needSpace(LH_BODY);
          addText("F1", 10, ML + 8, line, [55, 58, 65]);
          y -= LH_BODY;
        }
        y -= 6;
        break;
      }
      case "bullet": {
        const wrapped = wrapText(item.text, BULLET_CHARS);
        for (let i = 0; i < wrapped.length; i++) {
          needSpace(LH_BODY);
          if (i === 0) {
            // Use a simple hyphen-minus as bullet -- safe in WinAnsiEncoding
            addText("F2", 10, ML + 6, "-", [0, 120, 155]);
            addText("F1", 10, ML + BULLET_INDENT, wrapped[i], [55, 58, 65]);
          } else {
            addText("F1", 10, ML + BULLET_INDENT, wrapped[i], [55, 58, 65]);
          }
          y -= LH_BODY;
        }
        y -= 4;
        break;
      }
      case "numbered": {
        const match = item.text.match(/^(\d+\.)\s*(.*)/);
        const num = match ? match[1] : "";
        const rest = match ? match[2] : item.text;
        const wrapped = wrapText(rest, NUM_CHARS);
        for (let i = 0; i < wrapped.length; i++) {
          needSpace(LH_BODY);
          if (i === 0) {
            addText("F2", 10, ML + 4, num, [0, 120, 155]);
            addText("F1", 10, ML + NUM_INDENT, wrapped[i], [55, 58, 65]);
          } else {
            addText("F1", 10, ML + NUM_INDENT, wrapped[i], [55, 58, 65]);
          }
          y -= LH_BODY;
        }
        y -= 4;
        break;
      }
      case "meta": {
        needSpace(LH_META);
        addText("F1", 9, ML, item.text, [90, 100, 115]);
        y -= LH_META;
        break;
      }
      case "blank": {
        y -= LH_BLANK;
        if (y < MB) newPage();
        break;
      }
      case "body":
      default: {
        const wrapped = wrapText(item.text, BODY_CHARS);
        for (const line of wrapped) {
          needSpace(LH_BODY);
          addText("F1", 10, ML, line, [55, 58, 65]);
          y -= LH_BODY;
        }
        y -= 4;
        break;
      }
    }
  }

  if (currentPage.length > 0) pages.push({ cmds: currentPage });
  if (pages.length === 0) pages.push({ cmds: [] });

  const totalPages = pages.length;

  // ── Build PDF objects ─────────────────────────────────────────────
  write("%PDF-1.4");

  // Fonts
  startObj(1);
  write("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  write("endobj");
  startObj(2);
  write("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  write("endobj");
  startObj(3);
  write("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>");
  write("endobj");

  const pageObjStart = 4;
  const contentObjStart = pageObjStart + totalPages;
  const pagesObjId = contentObjStart + totalPages;
  const catalogObjId = pagesObjId + 1;

  const disclaimerWrapped = wrapText(disclaimer, 95);

  for (let p = 0; p < totalPages; p++) {
    const page = pages[p];
    let stream = "";
    const headerTitle = pdfHeaderTitle(title);

    // ── HEADER: Dark band with logo ──────────────────────────────────
    const headerH = 48;
    stream += "q\n";
    stream += "0.047 0.059 0.098 rg\n";
    stream += `0 ${PH - headerH} ${PW} ${headerH} re f\n`;
    stream += "Q\n";

    // Cyan accent line under header
    stream += "q\n";
    stream += "0 0.863 1 RG\n";
    stream += "0.6 w\n";
    stream += `${ML} ${PH - headerH} m ${PW - MR} ${PH - headerH} l S\n`;
    stream += "Q\n";

    // 33-degree solid filled "E" logo
    // Draw a solid filled E shape rotated ~33 degrees using a filled polygon
    stream += "q\n";
    const lx = ML + 2;
    const ly = PH - 16;
    // E dimensions
    const eW = 18;
    const eH = 28;
    const barH = 5;
    const midBarW = 12;
    const stemW = 6;
    // Apply 33-degree rotation matrix: cos(33)=0.8387, sin(33)=0.5446
    const cos33 = 0.8387;
    const sin33 = 0.5446;
    // Transform point relative to (lx, ly)
    function tx(px: number, py: number) { return (lx + cos33 * px + sin33 * py).toFixed(2); }
    function ty(px: number, py: number) { return (ly - sin33 * px + cos33 * py).toFixed(2); }
    // E shape points (bottom-left origin going clockwise)
    // Outer: bottom-left, bottom-right, up to bottom bar top, inward, up to mid bar bottom, out, mid bar top, inward, up to top bar, top-right, top-left
    const pts: [number, number][] = [
      [0, 0],                           // bottom-left
      [eW, 0],                          // bottom-right
      [eW, barH],                       // bottom bar top-right
      [stemW, barH],                    // bottom bar top-inner
      [stemW, eH/2 - barH/2],          // mid bar bottom-inner
      [midBarW, eH/2 - barH/2],        // mid bar bottom-right
      [midBarW, eH/2 + barH/2],        // mid bar top-right
      [stemW, eH/2 + barH/2],          // mid bar top-inner
      [stemW, eH - barH],              // top bar bottom-inner
      [eW, eH - barH],                 // top bar bottom-right
      [eW, eH],                        // top-right
      [0, eH],                         // top-left
    ];
    // Neon cyan fill with slight glow effect
    stream += "0 0.918 1 rg\n";
    stream += `${tx(pts[0][0], -pts[0][1])} ${ty(pts[0][0], -pts[0][1])} m\n`;
    for (let i = 1; i < pts.length; i++) {
      stream += `${tx(pts[i][0], -pts[i][1])} ${ty(pts[i][0], -pts[i][1])} l\n`;
    }
    stream += "f\n";
    // Purple rim light on left edge
    stream += "0.753 0.518 0.988 RG\n";
    stream += "0.6 w\n";
    stream += `${tx(0, 0)} ${ty(0, 0)} m ${tx(0, -eH)} ${ty(0, -eH)} l S\n`;
    stream += "Q\n";

    // Brand name "EvoLegal" next to logo
    stream += "BT\n";
    stream += "1 1 1 rg\n";
    stream += `/F2 14 Tf\n`;
    stream += `${ML + 26} ${PH - 38} Td\n`;
    stream += `(${pdfEncode("EvoLegal")}) Tj\n`;
    stream += "ET\n";

    // Page number (right side)
    stream += "BT\n";
    stream += "0.55 0.58 0.65 rg\n";
    stream += `/F1 8 Tf\n`;
    stream += `${PW - MR - 70} ${PH - 38} Td\n`;
    stream += `(Page ${p + 1} of ${totalPages}) Tj\n`;
    stream += "ET\n";

    // ── PAGE CONTENT ─────────────────────────────────────────────────
    for (const cmd of page.cmds) {
      if (cmd.font === "__LINE__") {
        stream += "q\n0.78 0.82 0.87 RG\n0.5 w\n" + cmd.text + "\nQ\n";
        continue;
      }
      if (cmd.font === "__LINE_ACCENT__") {
        stream += "q\n0.82 0.85 0.88 RG\n0.4 w\n" + cmd.text + "\nQ\n";
        continue;
      }
      if (cmd.font === "__FULL_LINE__") {
        stream += "q\n0.75 0.78 0.82 RG\n0.4 w\n" + cmd.text + "\nQ\n";
        continue;
      }
      const [r, g, b] = cmd.color || [55, 58, 65];
      stream += "BT\n";
      stream += `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg\n`;
      stream += `/${cmd.font} ${cmd.size} Tf\n`;
      stream += `${cmd.x} ${cmd.y} Td\n`;
      stream += `(${pdfEncode(cmd.text)}) Tj\n`;
      stream += "ET\n";
    }

    // ── FOOTER ───────────────────────────────────────────────────────
    stream += "q\n0.82 0.84 0.87 RG\n0.3 w\n";
    stream += `${ML} ${MB - 6} m ${PW - MR} ${MB - 6} l S\n`;
    stream += "Q\n";

    // Disclaimer text
    let fy = MB - 18;
    for (const dl of disclaimerWrapped) {
      stream += "BT\n";
      stream += "0.48 0.50 0.55 rg\n";
      stream += `/F3 6.5 Tf\n`;
      stream += `${ML} ${fy} Td\n`;
      stream += `(${pdfEncode(dl)}) Tj\n`;
      stream += "ET\n";
      fy -= 8;
    }

    // "EvoLegal -- Confidential"
    stream += "BT\n";
    stream += "0.42 0.45 0.50 rg\n";
    stream += `/F1 6.5 Tf\n`;
    stream += `${PW - MR - 90} ${fy - 2} Td\n`;
    stream += `(${pdfEncode("EvoLegal -- Confidential")}) Tj\n`;
    stream += "ET\n";

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

  return new TextEncoder().encode(pdfLines.join("\n"));
}
