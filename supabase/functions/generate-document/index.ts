import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCLAIMER =
  "This is a general informational template only. It is not legal advice and does not create an attorney-client relationship. Laws vary by jurisdiction. Always consult a licensed professional for your specific situation.";

// ── Document type definitions ──────────────────────────────────────
const DOCUMENT_TYPES: Record<string, { label: string; prompt: string }> = {
  overview: {
    label: "Information Overview",
    prompt: `Produce a luxury-quality Information Overview document. Follow this exact structure:

TITLE: [Elegant, precise title]

SECTION: Introduction
A brief, calm, neutral paragraph introducing the topic and its relevance. State that this document provides general educational information only.

SECTION: Key Concepts
Organize into clearly labeled subsections using SUBSECTION: prefix. Each subsection should contain well-crafted paragraphs with excellent flow. Cover all essential aspects thoroughly.

SECTION: Important Considerations
Cover practical factors, common pitfalls, and critical nuances. Use focused paragraphs with clear SUBSECTION: headings where appropriate. Use bullet points (with "- " prefix) only where a true list adds clarity.

SECTION: Common Questions
Present 3-5 thoughtful questions with comprehensive, neutral answers. Format each as "Q:" followed by "A:" paragraphs.

SECTION: Further Resources
List general categories of resources (not specific URLs) that may be helpful for further research.

SECTION: Prepared By
EvoLegal Experts
Date: {{Date}}`,
  },
  checklist: {
    label: "Preparation Checklist",
    prompt: `Produce a luxury-quality Preparation Checklist document. Follow this exact structure:

TITLE: [Elegant, precise title]

SECTION: Purpose
A brief paragraph explaining what this checklist helps prepare for and who would benefit from it.

SECTION: Documents to Gather
A numbered list of documents or records to collect, each with a brief explanatory note.

SECTION: Actions to Complete
A numbered sequence of actions to take, each with a concise explanation of its purpose.

SECTION: Timeline
Key milestones with {{Date}} placeholders where dates would be inserted.

SECTION: Notes
Space for personal notes: [REQUIRES USER INPUT: Your notes here]

SECTION: Prepared By
EvoLegal Experts
Date: {{Date}}`,
  },
  template: {
    label: "Template Outline",
    prompt: `Produce a luxury-quality Template Outline document. Follow this exact structure:

TITLE: [Elegant, precise title]

SECTION: Parties
{{Party A Full Name}}
{{Party A Address}}
{{Party B Full Name}}
{{Party B Address}}

SECTION: Background
[Brief recital of the purpose of this document]

SECTION: Terms and Provisions
Numbered sections with clear headings. Each provision should have placeholder fields using {{Placeholder Name}} syntax where specific terms would be inserted.

SECTION: General Provisions
Standard protective clauses (Governing Law, Severability, Entire Agreement, Amendments, Notices) with {{Jurisdiction}} placeholders.

SECTION: Signatures
{{Party A Signature}} -- Date: {{Date}}
{{Party B Signature}} -- Date: {{Date}}

SECTION: Prepared By
EvoLegal Experts
Date: {{Date}}`,
  },
  comparative: {
    label: "Comparative Guide",
    prompt: `Produce a luxury-quality Comparative Guide document. Follow this exact structure:

TITLE: [Elegant, precise title]

SECTION: Introduction
A brief paragraph explaining what is being compared and why this comparison is valuable.

SECTION: Overview of Approaches
Describe each approach or framework in its own clearly labeled SUBSECTION:. Provide balanced, thorough coverage.

SECTION: Key Differences
Organized comparison of the most significant differences, with clear SUBSECTION: headings for each dimension of comparison.

SECTION: Similarities
Common ground between the approaches, clearly articulated.

SECTION: Practical Considerations
Guidance on factors that may influence which approach applies, using {{Jurisdiction}} placeholders where relevant.

SECTION: Summary
A neutral, balanced concluding paragraph synthesizing the key takeaways.

SECTION: Prepared By
EvoLegal Experts
Date: {{Date}}`,
  },
};

// ── System prompts ─────────────────────────────────────────────────

const GENERATOR_SYSTEM = `You are the EvoLegal Document Writer -- a senior legal information specialist who produces calm, elegant, trustworthy documents that feel like they come from a premium law firm.

VOICE AND TONE:
- Write in a calm, confident, professional voice -- never energetic, robotic, or overly formal.
- Every sentence should feel considered and purposeful. Favor clarity over complexity.
- Use formal but accessible language -- a well-educated non-lawyer should understand every paragraph.
- Aim for the reading experience of a high-end legal briefing, not a textbook.
- Use smooth transitions between sections and paragraphs. The document should flow naturally.

CRITICAL FORMATTING RULES (FOLLOW EXACTLY):
- Use "SECTION:" prefix for all main section headings.
- Use "SUBSECTION:" prefix for subsection headings.
- For numbered items, use "1.", "2.", "3." at the start of lines.
- For bullet points, use a simple dash "- " at the start of lines.
- For Q&A, use "Q:" and "A:" prefixes.
- NEVER use markdown syntax: no **, no *, no #, no __, no backticks, no ---.
- NEVER use special Unicode characters: no em-dashes, no en-dashes, no smart quotes, no bullet symbols, no ellipsis characters.
- Use only plain ASCII characters: use "--" instead of em-dash, use "-" for bullets, use regular quotes " and ', use "..." for ellipsis.
- Write clean plain text with the SECTION:/SUBSECTION: markers only.
- Do NOT include a disclaimer in the body -- the PDF system adds it automatically.
- Do NOT use the word "step" or "steps" anywhere. Do NOT use "you should", "you must", "need to", "have to".

CONTENT QUALITY:
- Be thorough but never repetitive. Each paragraph should add distinct value.
- Use excellent paragraph flow -- each section should read like well-crafted prose, not a list.
- Where lists are used, keep them purposeful and well-explained.
- Replace all variables with {{Placeholder Name}} syntax.
- If data is missing, use {{Placeholder Name}} -- never invent or assume data.

RISK ASSESSMENT:
- If the topic involves active legal proceedings, imminent deadlines, criminal matters, or requests for specific legal strategy, output ONLY:
  "RISK_ESCALATION: This topic involves complexity that warrants expert review. We recommend connecting with an EvoLegal Expert."
- For general informational topics, proceed normally.

OUTPUT:
- Output ONLY the document content. No preamble, no explanation, no commentary.`;

const REVIEWER_SYSTEM = `You are the EvoLegal Document Reviewer -- an independent senior editor ensuring every document meets luxury publication standards.

Your job is to take the document below and produce a polished, final version. Apply these fixes silently:

1. ENCODING AND CHARACTER CLEANUP (HIGHEST PRIORITY):
   - Replace ALL em-dashes, en-dashes, and any Unicode dash variants with "--" (double hyphen).
   - Replace ALL smart/curly quotes with straight quotes (" and ').
   - Replace ALL Unicode bullet symbols with "- " (dash space).
   - Replace ALL ellipsis characters with "..." (three dots).
   - Remove ALL other non-ASCII characters except letters with accents when needed for proper nouns.
   - The output must be 100% clean ASCII-safe text (WinAnsiEncoding compatible).

2. FORMATTING CLEANUP:
   - Remove ALL markdown artifacts: **, *, #, __, backticks -- replace with clean plain text.
   - Ensure all section headers use "SECTION:" prefix exactly.
   - Ensure all subsection headers use "SUBSECTION:" prefix exactly.
   - Ensure bullet points use only "- " (dash space).
   - Ensure numbered items use "1.", "2.", "3." format.
   - Remove any repeated or redundant sections.
   - Remove the words "step", "steps", "you should", "you must", "need to", "have to" -- rephrase naturally.

3. CONTENT QUALITY:
   - Tighten verbose or repetitive language -- every sentence must earn its place.
   - Ensure smooth logical flow between sections and paragraphs.
   - Add missing essential content if a section feels thin.
   - Remove any content that could be interpreted as personalized legal advice.
   - Verify all placeholders use {{Placeholder Name}} syntax.
   - Ensure the writing feels calm, confident, and expertly crafted.

4. TONE:
   - Ensure calm, professional, neutral voice throughout -- like a premium law firm overview.
   - Remove any energetic, chatty, casual, or marketing language.
   - The document should feel trustworthy and authoritative without being stiff.

5. STRUCTURE CHECK:
   - Verify sections appear in the correct order.
   - Verify each section has substantive content -- no empty or skeleton sections.

6. RISK CHECK:
   - If the document contains specific legal strategy or advice for a particular case, output ONLY:
     "RISK_ESCALATION: This document requires expert review."

OUTPUT: The complete, polished document only. No review notes, no commentary, no explanations. Use ONLY plain ASCII characters.`;

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
    const title = `${docConfig.label}: ${topic}`;

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
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: GENERATOR_SYSTEM },
          {
            role: "user",
            content: `DOCUMENT TYPE: ${docConfig.label}\nTOPIC: ${topic}\n\n${docConfig.prompt}${contextNote}`,
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

    if (content.trim().startsWith("RISK_ESCALATION:")) {
      return new Response(
        JSON.stringify({ escalated: true, message: content.replace("RISK_ESCALATION:", "").trim() }),
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
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: REVIEWER_SYSTEM },
          {
            role: "user",
            content: `DOCUMENT TYPE: ${docConfig.label}\nTOPIC: ${topic}\n\nDOCUMENT TO REVIEW:\n\n${content}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    let finalContent = content;
    if (reviewResponse.ok) {
      const reviewData = await reviewResponse.json();
      const reviewed = reviewData.choices?.[0]?.message?.content || "";
      if (reviewed.trim()) {
        if (reviewed.trim().startsWith("RISK_ESCALATION:")) {
          return new Response(
            JSON.stringify({ escalated: true, message: reviewed.replace("RISK_ESCALATION:", "").trim() }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        finalContent = reviewed;
      }
    } else {
      console.error("Document review failed, using original:", reviewResponse.status);
    }

    // ── POST-PROCESS ────────────────────────────────────────────────
    finalContent = sanitizeForPdf(finalContent);

    // ── BUILD PDF ───────────────────────────────────────────────────
    const pdfBytes = generatePDF(title, docConfig.label, topic, finalContent, DISCLAIMER);

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
      title,
      topic,
      file_path: filePath,
      file_url: urlData.publicUrl,
    });

    if (insertError) console.error("Insert error:", insertError);

    return new Response(
      JSON.stringify({
        success: true,
        title,
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
    // Clean up excessive newlines
    .replace(/\n{3,}/g, "\n\n");
}

// ── PDF Generator ──────────────────────────────────────────────────

interface PdfLine {
  text: string;
  type: "title" | "section" | "subsection" | "body" | "bullet" | "numbered" | "qa-q" | "qa-a" | "blank" | "meta";
}

function parseLinesFromContent(title: string, docType: string, topic: string, content: string): PdfLine[] {
  const result: PdfLine[] = [];

  result.push({ text: title, type: "title" });
  result.push({ text: "", type: "blank" });
  result.push({ text: `Document Type: ${docType}`, type: "meta" });
  result.push({ text: `Topic: ${topic}`, type: "meta" });
  result.push({ text: `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, type: "meta" });
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

function generatePDF(
  title: string,
  docType: string,
  topic: string,
  content: string,
  disclaimer: string
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
  const CW = PW - ML - MR;
  const BODY_CHARS = 82;
  const BULLET_INDENT = 18;
  const BULLET_CHARS = 76;
  const NUM_INDENT = 22;
  const NUM_CHARS = 74;

  const LH_BODY = 15;
  const LH_SECTION = 28;
  const LH_SUBSECTION = 22;
  const LH_BLANK = 10;
  const LH_META = 14;

  const structured = parseLinesFromContent(title, docType, topic, content);

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

    // 33-degree slanted "E" logo
    stream += "q\n";
    stream += "0 0.918 1 RG\n";
    stream += "2.2 w\n";
    const lx = ML;
    const ly = PH - 34;
    const sl = 4.5;
    stream += `${lx + sl} ${ly} m ${lx} ${ly - 15} l S\n`;           // vertical bar (slanted)
    stream += `${lx + sl} ${ly} m ${lx + sl + 9} ${ly} l S\n`;       // top bar
    stream += `${lx + sl * 0.5 + 0.5} ${ly - 7.5} m ${lx + sl * 0.5 + 7.5} ${ly - 7.5} l S\n`; // middle bar
    stream += `${lx} ${ly - 15} m ${lx + 9} ${ly - 15} l S\n`;       // bottom bar
    // Purple rim light
    stream += "0.753 0.518 0.988 RG\n";
    stream += "0.4 w\n";
    stream += `${lx + sl + 0.4} ${ly + 0.3} m ${lx + 0.4} ${ly - 15.3} l S\n`;
    stream += "Q\n";

    // Brand name "EvoLegal" -- the "E" is the logo graphic, text starts with "vo"
    // But we write the FULL word so it reads correctly
    // Brand name "EvoLegal" -- the "E" is the logo graphic, text starts with "vo"
    // But we write the FULL word so it reads correctly
    stream += "BT\n";
    stream += "1 1 1 rg\n";
    stream += `/F2 14 Tf\n`;
    stream += `${ML + 18} ${PH - 38} Td\n`;
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
