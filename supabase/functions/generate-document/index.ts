import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCLAIMER =
  "This is a general informational template only. It is not legal advice and does not create an attorney-client relationship. Laws vary by jurisdiction. Always consult a licensed professional for your specific situation.";

const DOCUMENT_MODEL = "google/gemini-2.5-flash";
const EXPERT_REVIEW_MESSAGE =
  "This topic may benefit from expert review. Would you like to connect with an EvoLegal Expert?";

// ── Document type definitions ──────────────────────────────────────
const DOCUMENT_TYPES: Record<string, { label: string; role: string; prompt: string }> = {
  overview: {
    label: "Legal Briefing Paper",
    role: "Elite Research Counsel producing bespoke legal briefing papers for high-value corporate clients.",
    prompt: `Draft a bespoke, hyper-contextual Legal Briefing Paper analyzing the specific legal doctrines, statutes, and precedents triggered by the exact facts of the client's Case File. Do NOT write a generic educational overview. Identify the operative cause(s) of action and controlling framework (e.g. trade secret misappropriation under the DTSA and applicable state UTSA; wrongful termination under Title VII; breach of fiduciary duty; etc.) and analyze them against the client's stated timeline, parties, and jurisdiction. Tone: clinical, sophisticated, objective, closer to a Wachtell / Cravath internal memo than a consumer article. Weave the client's facts directly into every section. Placeholders {{like_this}} only for strictly private figures (account balances, SSNs, home addresses).`,
  },
  checklist: {
    label: "Evidentiary and Tactical Preparation Ledger",
    role: "Senior Litigation Strategist preparing the case for imminent proceedings.",
    prompt: `Draft an exhaustive, granular Evidentiary and Tactical Preparation Ledger. Every item must reference the client's actual dispute variables (parties, dates, contracts, communications) drawn from the Case File. Enumerate the exact documents, digital footprints (email threads, Slack/Teams DMs, git logs, CCTV, GPS, badge access), witness statements, financial records, communication logs, and internal evidence the client must secure to build an airtight defense or claim. Include preservation-of-evidence tasks (litigation hold), chain-of-custody notes, and privilege considerations. Zero boilerplate. Every action item must be case-specific and actionable this week.`,
  },
  template: {
    label: "Tailored Pleading / Contractual Skeleton",
    role: "Bespoke Document Draftsman drafting instruments ready for attorney redline.",
    prompt: `Draft a sophisticated Tailored Pleading or Contractual Skeleton pre-populated with the established facts, jurisdictions, parties, and identified legal entities from the Case File. Use formal legal register: WHEREAS, NOW, THEREFORE, IN WITNESS WHEREOF, comes now, prays this Honorable Court. Populate preamble, recitals, jurisdiction/venue statements, factual background, and numbered causes of action or clauses with the client's real context. Leave {{placeholder}} tokens ONLY for strictly confidential fields (financial figures, private addresses, unsigned dates, tax IDs). This is a draftsman skeleton for an attorney to redline, not a blank form.`,
  },
  comparative: {
    label: "Strategic Options Matrix",
    role: "Risk Assessment Auditor advising a general counsel on path selection.",
    prompt: `Draft a rigorous, side-by-side Strategic Options Matrix mapping the alternative courses of action available given the specific dispute in the Case File (e.g. Mediation, Arbitration, Aggressive Litigation, Cease & Desist + Settlement, Regulatory Complaint, Do-Nothing). For each path: (1) mechanics and typical timeline in this jurisdiction; (2) pros tied to the client's leverage points; (3) cons and hidden structural risks (counterclaims, discovery exposure, reputational blowback); (4) projected legal spend ranges; (5) probability-weighted outcome band. Use the "Key Concepts" blocks as the paths and "Important Considerations" blocks as the risk/cost analysis. Completely tailored to this dispute.`,
  },
};

// ── System prompts ─────────────────────────────────────────────────

const GENERATOR_SYSTEM = `You are an elite EvoLegal drafting counsel. You produce hyper-customized, client-specific legal work product from the Hugo Consilium Case File provided in the user message. You NEVER write generic educational articles.

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

Hard rules:
- FORBIDDEN openings: "Here is your document", "Sure", "Certainly", "Below is", "As requested", "I have prepared", "Of course". Never speak to the reader in first person about the drafting process. The "title" field is the very first thing; the "introduction" opens directly with substantive analysis of the client's matter.
- NO meta-commentary, no self-reference, no AI disclaimers inside the document body (the corporate footer disclaimer is handled separately).
- Weave the Case File facts, parties, jurisdiction, timeline, and identified legal issues directly into every section. If a paragraph could apply to any random reader, rewrite it until it can only apply to this client.
- Placeholders {{Like This}} ONLY for strictly confidential values the client must fill in themselves (specific dollar figures, account numbers, home addresses, dates of birth). Never use placeholders for facts already established in the Case File.
- Plain ASCII only. Straight quotes, straight apostrophes, hyphens, periods. No em-dashes, smart quotes, Unicode bullets, markdown, or code fences.
- Register: senior corporate counsel. Precise, restrained, confident. No filler, no repetition.
- Every section substantive. Never thin or placeholder-like.
- Set needsExpertReview to true ONLY for active named court proceedings with real case numbers where drafting would risk unauthorized practice. General informational and pre-litigation strategic content proceeds normally.`;

const REVIEWER_SYSTEM = `You are the EvoLegal Senior Partner Reviewer. You enforce elite-firm publication standards on drafts.

Return ONLY valid JSON in the SAME schema you received. No prose, no code fences.

Silently upgrade the draft on the following axes before returning JSON:
- Remove any greeting, meta-commentary, or first-person drafter voice ("Here is", "I have prepared", "As requested"). The title must be the first thing; the introduction opens with substantive analysis.
- Ensure every section references the client's specific facts, parties, jurisdiction, and timeline from the Case File. If a paragraph reads as generic, rewrite it to be client-specific.
- Sharpen legal precision. Name the operative doctrines, statutes, or clause types explicitly.
- Fix non-ASCII: smart quotes -> straight quotes, em-dashes -> --, Unicode bullets -> hyphens. Strip markdown artifacts.
- Fix weak hierarchy, repetition, mechanical phrasing, thin sections, and placeholder misuse (placeholders only for strictly confidential values).
- Preserve the four-part JSON structure (introduction, keyConcepts, importantConsiderations, commonQuestions, furtherResources).

Rules:
- Output ONLY plain ASCII inside JSON string values.
- Preserve the sophisticated, restrained corporate-counsel register.
- Only set needsExpertReview to true for active named court proceedings with real case numbers. General strategic drafting must remain generatable.`;

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

    const contextNote = conversation_context
      ? `\n\nContext from the user's conversation: ${conversation_context.slice(0, 1000)}`
      : "";

    // ── GENERATION ──────────────────────────────────────────────────
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DOCUMENT_MODEL,
        messages: [
          { role: "system", content: GENERATOR_SYSTEM },
          {
            role: "user",
            content: `DOCUMENT TYPE: ${docConfig.label}\nTOPIC: ${topic}\nCURRENT DATE: ${dateLabel}\n\n${docConfig.prompt}${contextNote}`,
          },
        ],
        temperature: 0.25,
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
            content: `DOCUMENT TYPE: ${docConfig.label}\nTOPIC: ${topic}\nCURRENT DATE: ${dateLabel}\n\nDOCUMENT TO REVIEW:\n\n${JSON.stringify(generatedPayload)}`,
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

  const pageObjStart = 4;
  const contentObjStart = pageObjStart + totalPages;
  const pagesObjId = contentObjStart + totalPages;
  const catalogObjId = pagesObjId + 1;

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
