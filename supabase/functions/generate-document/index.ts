import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCLAIMER =
  "This is a general informational template only. It is not legal advice and does not create an attorney-client relationship. Laws vary by jurisdiction. Always consult a licensed professional for your specific situation.";

const DOCUMENT_TYPES: Record<string, { label: string; prompt: string }> = {
  overview: {
    label: "Information Overview",
    prompt: `Produce a professional Information Overview document. Follow this exact structure:

TITLE: [Clear, professional title]

SECTION: Introduction
A brief, neutral paragraph introducing the topic and its relevance. State that this is general information only.

SECTION: Key Concepts and Principles
Organize into clearly labeled subsections. Each subsection should have a concise heading followed by a well-written paragraph. Use numbered or lettered items only where a true list is appropriate.

SECTION: Important Considerations
Cover practical factors, common pitfalls, and things to be aware of. Use short, focused paragraphs with clear subheadings.

SECTION: Common Questions
Present 3-5 frequently asked questions with thoughtful, general answers. Format as "Q:" followed by "A:" paragraphs.

SECTION: Further Resources
List general categories of resources (not specific URLs) that may be helpful.

SECTION: Prepared By
EvoLegal Experts
Date: {{Date}}`,
  },
  checklist: {
    label: "Preparation Checklist",
    prompt: `Produce a professional Preparation Checklist document. Follow this exact structure:

TITLE: [Clear, professional title]

SECTION: Purpose
A brief paragraph explaining what this checklist helps prepare for.

SECTION: Documents to Gather
A numbered list of documents or records to collect, with brief descriptions.

SECTION: Steps to Complete
A numbered sequence of actions to take, each with a one-sentence explanation.

SECTION: Timeline
Key milestones with {{Date}} placeholders.

SECTION: Notes
Space for personal notes: [YOUR NOTES HERE]

SECTION: Prepared By
EvoLegal Experts
Date: {{Date}}`,
  },
  template: {
    label: "Template Outline",
    prompt: `Produce a professional Template Outline document — a blank framework with placeholder fields. Follow this exact structure:

TITLE: [Clear, professional title]

SECTION: Parties
{{Party A Full Name}}
{{Party A Address}}
{{Party B Full Name}}
{{Party B Address}}

SECTION: Background
[Brief recital of the purpose of this document — keep generic]

SECTION: Terms and Provisions
Numbered sections with clear headings. Each provision should have placeholder fields where specific terms would be inserted.

SECTION: General Provisions
Standard protective clauses (Governing Law, Severability, Entire Agreement, Amendments, Notices) with {{Jurisdiction}} placeholders.

SECTION: Signatures
{{Party A Signature}} — Date: {{Date}}
{{Party B Signature}} — Date: {{Date}}

SECTION: Prepared By
EvoLegal Experts
Date: {{Date}}`,
  },
  comparative: {
    label: "Comparative Guide",
    prompt: `Produce a professional Comparative Guide document. Follow this exact structure:

TITLE: [Clear, professional title]

SECTION: Introduction
A brief paragraph explaining what is being compared and why.

SECTION: Overview of Approaches
Describe each approach or framework in its own clearly labeled subsection.

SECTION: Key Differences
Organized comparison of the most significant differences, with clear subheadings.

SECTION: Similarities
Common ground between the approaches.

SECTION: Practical Considerations
Guidance on factors that may influence which approach applies, using {{Jurisdiction}} placeholders where relevant.

SECTION: Summary
A neutral, balanced concluding paragraph.

SECTION: Prepared By
EvoLegal Experts
Date: {{Date}}`,
  },
};

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
          {
            role: "system",
            content: `You are the EvoLegal Document Writer — a professional legal information writer that produces clean, well-structured general informational documents.

VOICE AND TONE:
- Write in calm, professional, neutral legal English.
- Never use exclamation marks, energetic language, or marketing speak.
- Be concise but thorough. Every sentence should add value.
- Use formal but accessible language — understandable by non-lawyers.

CRITICAL FORMATTING RULES:
- Use "SECTION:" prefix for all main section headings (e.g., "SECTION: Introduction").
- Use "SUBSECTION:" prefix for subsection headings (e.g., "SUBSECTION: Community Property States").
- For numbered items, use "1.", "2.", "3." at the start of lines.
- For bullet points, use a simple dash "- " at the start of lines.
- For Q&A, use "Q:" and "A:" prefixes.
- NEVER use markdown syntax: no **, no *, no #, no __, no \`\`.
- NEVER use special Unicode bullets like bullet characters. Only use "- " for bullets.
- Write clean plain text with the SECTION:/SUBSECTION: markers only.
- Do NOT include a disclaimer in the body — the PDF system adds it automatically.

PLACEHOLDER RULES:
- Use {{Placeholder Name}} for all variable fields.
- If data is missing, use {{Placeholder Name}} — never invent or assume data.

RISK ASSESSMENT:
- If the topic involves active legal proceedings, imminent deadlines, criminal matters, or requests for specific legal strategy, output ONLY:
  "RISK_ESCALATION: This topic involves complexity that warrants expert review. We recommend connecting with an EvoLegal Expert."
- For general informational topics, proceed normally.

OUTPUT:
- Output ONLY the document content. No preamble, no explanation, no commentary.`,
          },
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
        JSON.stringify({
          escalated: true,
          message: content.replace("RISK_ESCALATION:", "").trim(),
        }),
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
          {
            role: "system",
            content: `You are the EvoLegal Document Reviewer — an independent quality editor.

Your job is to take the document below and produce a polished, final version. Apply these fixes silently:

1. FORMATTING CLEANUP:
   - Remove ALL markdown artifacts: **, *, #, __, \`\` — replace with clean plain text.
   - Ensure all section headers use "SECTION:" prefix.
   - Ensure all subsection headers use "SUBSECTION:" prefix.
   - Ensure bullet points use only "- " (dash space).
   - Ensure numbered items use "1.", "2.", "3." format.
   - Remove any broken characters, encoding artifacts, or Unicode bullets.
   - Remove any repeated or redundant sections.

2. CONTENT QUALITY:
   - Tighten verbose or repetitive language.
   - Ensure logical flow between sections.
   - Add missing essential content if a section feels thin.
   - Remove any content that could be interpreted as personalized legal advice.
   - Verify all placeholders use {{Placeholder}} syntax.

3. TONE:
   - Ensure calm, professional, neutral voice throughout.
   - Remove any energetic, chatty, or marketing language.

4. RISK CHECK:
   - If the document contains specific legal strategy or advice for a particular case, output ONLY:
     "RISK_ESCALATION: This document requires expert review."

OUTPUT: The complete, polished document only. No review notes, no commentary.`,
          },
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
            JSON.stringify({
              escalated: true,
              message: reviewed.replace("RISK_ESCALATION:", "").trim(),
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        finalContent = reviewed;
      }
    } else {
      console.error("Document review failed, using original:", reviewResponse.status);
    }

    // ── POST-PROCESS: strip any remaining markdown ──────────────────
    finalContent = stripMarkdown(finalContent);

    // ── BUILD PDF ───────────────────────────────────────────────────
    const pdfBytes = generatePDF(title, docConfig.label, topic, finalContent, DISCLAIMER);

    // Upload to storage
    const timestamp = Date.now();
    const safeTopic = topic.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50);
    const filePath = `${user.id}/${document_type}_${safeTopic}_${timestamp}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("generated-documents")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to save document." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: urlData } = supabase.storage
      .from("generated-documents")
      .getPublicUrl(filePath);

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

    if (insertError) {
      console.error("Insert error:", insertError);
    }

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

// ── Markdown stripper ──────────────────────────────────────────────
function stripMarkdown(text: string): string {
  return text
    // Remove bold/italic markdown
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    // Remove markdown headings
    .replace(/^#{1,6}\s+/gm, "")
    // Remove backticks
    .replace(/`(.+?)`/g, "$1")
    // Clean up bullet artifacts
    .replace(/^[•●◦▪▸►¢]\s*/gm, "- ")
    // Normalize multiple blank lines
    .replace(/\n{3,}/g, "\n\n");
}

// ── PDF Generator ──────────────────────────────────────────────────
// Produces a professional, branded PDF with proper visual hierarchy.

interface PdfLine {
  text: string;
  type: "title" | "section" | "subsection" | "body" | "bullet" | "numbered" | "qa-q" | "qa-a" | "blank" | "meta";
}

function parseLinesFromContent(title: string, docType: string, topic: string, content: string): PdfLine[] {
  const result: PdfLine[] = [];

  // Meta header
  result.push({ text: title, type: "title" });
  result.push({ text: "", type: "blank" });
  result.push({ text: `Document Type: ${docType}`, type: "meta" });
  result.push({ text: `Topic: ${topic}`, type: "meta" });
  result.push({ text: `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, type: "meta" });
  result.push({ text: "", type: "blank" });

  const lines = content.split("\n");
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      result.push({ text: "", type: "blank" });
    } else if (trimmed.startsWith("TITLE:")) {
      // Skip — we already have the title
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
  function pdfStr(s: string): string {
    return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  // Word-wrap helper
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
  const PW = 612; // Letter width
  const PH = 792; // Letter height
  const ML = 54;  // Left margin
  const MR = 54;  // Right margin
  const MT = 70;  // Top margin (below header)
  const MB = 90;  // Bottom margin (above footer)
  const CW = PW - ML - MR; // Content width
  const BODY_CHARS = 85;
  const BULLET_INDENT = 16;
  const BULLET_CHARS = 78;
  const NUM_INDENT = 20;
  const NUM_CHARS = 76;

  // Line heights per type
  const LH_BODY = 13;
  const LH_SECTION = 22; // includes spacing before
  const LH_SUBSECTION = 18;
  const LH_BLANK = 8;
  const LH_META = 13;

  // Parse content into structured lines
  const structured = parseLinesFromContent(title, docType, topic, content);

  // Build render instructions per page
  interface RenderCmd {
    font: string; size: number; x: number; y: number; text: string;
    color?: [number, number, number];
  }
  interface PageData { cmds: RenderCmd[]; }

  const pages: PageData[] = [];
  let currentPage: RenderCmd[] = [];
  let y = PH - MT;

  function newPage() {
    if (currentPage.length > 0) pages.push({ cmds: currentPage });
    currentPage = [];
    y = PH - MT;
  }

  function needSpace(h: number) {
    if (y - h < MB) {
      newPage();
    }
  }

  function addText(font: string, size: number, x: number, text: string, color?: [number, number, number]) {
    currentPage.push({ font, size, x, y, text, color });
  }

  // Render each structured line
  for (const item of structured) {
    switch (item.type) {
      case "title": {
        const wrapped = wrapText(item.text, 65);
        for (const line of wrapped) {
          needSpace(20);
          addText("F2", 15, ML, line, [0, 60, 80]);
          y -= 20;
        }
        // Decorative line under title
        needSpace(6);
        currentPage.push({ font: "__LINE__", size: 0, x: ML, y: y + 8, text: `${ML} ${y + 8} m ${ML + 180} ${y + 8} l S` });
        y -= 10;
        break;
      }
      case "section": {
        needSpace(LH_SECTION + 14);
        y -= 8; // space before section
        addText("F2", 12, ML, item.text.toUpperCase(), [0, 70, 90]);
        y -= 4;
        // Thin accent line
        currentPage.push({ font: "__LINE_ACCENT__", size: 0, x: ML, y, text: `${ML} ${y} m ${ML + 120} ${y} l S` });
        y -= LH_SECTION - 8;
        break;
      }
      case "subsection": {
        needSpace(LH_SUBSECTION + 6);
        y -= 4;
        addText("F2", 10.5, ML, item.text, [30, 30, 30]);
        y -= LH_SUBSECTION - 4;
        break;
      }
      case "qa-q": {
        const wrapped = wrapText("Q:  " + item.text, BODY_CHARS);
        for (const line of wrapped) {
          needSpace(LH_BODY);
          addText("F2", 10, ML + 4, line, [30, 50, 70]);
          y -= LH_BODY;
        }
        y -= 2;
        break;
      }
      case "qa-a": {
        const wrapped = wrapText("A:  " + item.text, BODY_CHARS - 2);
        for (const line of wrapped) {
          needSpace(LH_BODY);
          addText("F1", 10, ML + 8, line, [50, 55, 65]);
          y -= LH_BODY;
        }
        y -= 4;
        break;
      }
      case "bullet": {
        const wrapped = wrapText(item.text, BULLET_CHARS);
        for (let i = 0; i < wrapped.length; i++) {
          needSpace(LH_BODY);
          if (i === 0) {
            // Bullet marker
            addText("F1", 10, ML + 6, "\u2013", [0, 130, 170]); // en-dash as bullet
            addText("F1", 10, ML + BULLET_INDENT, wrapped[i], [50, 55, 65]);
          } else {
            addText("F1", 10, ML + BULLET_INDENT, wrapped[i], [50, 55, 65]);
          }
          y -= LH_BODY;
        }
        y -= 2;
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
            addText("F2", 10, ML + 4, num, [0, 130, 170]);
            addText("F1", 10, ML + NUM_INDENT, wrapped[i], [50, 55, 65]);
          } else {
            addText("F1", 10, ML + NUM_INDENT, wrapped[i], [50, 55, 65]);
          }
          y -= LH_BODY;
        }
        y -= 2;
        break;
      }
      case "meta": {
        needSpace(LH_META);
        addText("F1", 9, ML, item.text, [100, 110, 125]);
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
          addText("F1", 10, ML, line, [50, 55, 65]);
          y -= LH_BODY;
        }
        y -= 2;
        break;
      }
    }
  }

  // Push final page
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
  // Italic for disclaimer
  startObj(3);
  write("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>");
  write("endobj");

  const pageObjStart = 4;
  const contentObjStart = pageObjStart + totalPages;
  const pagesObjId = contentObjStart + totalPages;
  const catalogObjId = pagesObjId + 1;

  // Disclaimer word-wrap
  const disclaimerWrapped = wrapText(disclaimer, 95);

  for (let p = 0; p < totalPages; p++) {
    const page = pages[p];
    let stream = "";

    // ── Page header: dark band ──────────────────────────────────────
    // Dark header background
    stream += "q\n";
    stream += "0.047 0.059 0.098 rg\n"; // ~12,15,25
    stream += `0 ${PH - 44} ${PW} 44 re f\n`;
    stream += "Q\n";

    // Cyan accent line under header
    stream += "q\n";
    stream += "0 0.863 1 RG\n"; // cyan
    stream += "0.5 w\n";
    stream += `${ML} ${PH - 44} m ${PW - MR} ${PH - 44} l S\n`;
    stream += "Q\n";

    // 33° slanted "E" logo
    stream += "q\n";
    stream += "0 0.918 1 RG\n"; // neon cyan
    stream += "2 w\n";
    const lx = ML;
    const ly = PH - 32;
    const sl = 4;
    stream += `${lx + sl} ${ly} m ${lx} ${ly - 14} l S\n`; // vertical (slanted)
    stream += `${lx + sl} ${ly} m ${lx + sl + 8} ${ly} l S\n`; // top bar
    stream += `${lx + sl * 0.5 + 0.5} ${ly - 7} m ${lx + sl * 0.5 + 7} ${ly - 7} l S\n`; // mid bar
    stream += `${lx} ${ly - 14} m ${lx + 8} ${ly - 14} l S\n`; // bottom bar
    // Purple rim
    stream += "0.753 0.518 0.988 RG\n";
    stream += "0.4 w\n";
    stream += `${lx + sl + 0.4} ${ly + 0.3} m ${lx + 0.4} ${ly - 14.3} l S\n`;
    stream += "Q\n";

    // Brand name
    stream += "BT\n";
    stream += "1 1 1 rg\n";
    stream += `/F2 13 Tf\n`;
    stream += `${ML + 16} ${PH - 35} Td\n`;
    stream += `(${pdfStr("voLegal")}) Tj\n`;
    stream += "ET\n";

    // Page number in header (right)
    stream += "BT\n";
    stream += "0.6 0.65 0.72 rg\n";
    stream += `/F1 8 Tf\n`;
    stream += `${PW - MR - 60} ${PH - 35} Td\n`;
    stream += `(Page ${p + 1} of ${totalPages}) Tj\n`;
    stream += "ET\n";

    // ── Page content ────────────────────────────────────────────────
    for (const cmd of page.cmds) {
      if (cmd.font === "__LINE__") {
        stream += "q\n0.75 0.8 0.85 RG\n0.5 w\n" + cmd.text + "\nQ\n";
        continue;
      }
      if (cmd.font === "__LINE_ACCENT__") {
        stream += "q\n0 0.7 0.86 RG\n0.6 w\n" + cmd.text + "\nQ\n";
        continue;
      }
      const [r, g, b] = cmd.color || [50, 55, 65];
      stream += "BT\n";
      stream += `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg\n`;
      stream += `/${cmd.font} ${cmd.size} Tf\n`;
      stream += `${cmd.x} ${cmd.y} Td\n`;
      stream += `(${pdfStr(cmd.text)}) Tj\n`;
      stream += "ET\n";
    }

    // ── Footer ──────────────────────────────────────────────────────
    // Footer separator line
    stream += "q\n0.82 0.84 0.87 RG\n0.3 w\n";
    stream += `${ML} ${MB - 10} m ${PW - MR} ${MB - 10} l S\n`;
    stream += "Q\n";

    // Disclaimer
    let fy = MB - 22;
    for (const dl of disclaimerWrapped) {
      stream += "BT\n";
      stream += "0.5 0.52 0.56 rg\n";
      stream += `/F3 6.5 Tf\n`;
      stream += `${ML} ${fy} Td\n`;
      stream += `(${pdfStr(dl)}) Tj\n`;
      stream += "ET\n";
      fy -= 8;
    }

    // "EvoLegal - Confidential" right-aligned at bottom
    stream += "BT\n";
    stream += "0.45 0.48 0.52 rg\n";
    stream += `/F1 6.5 Tf\n`;
    stream += `${PW - MR - 80} ${MB - 22 - disclaimerWrapped.length * 8 - 2} Td\n`;
    stream += `(${pdfStr("EvoLegal \u2014 Confidential")}) Tj\n`;
    stream += "ET\n";

    // Write content stream object
    const contentId = contentObjStart + p;
    startObj(contentId);
    const streamBytes = new TextEncoder().encode(stream);
    write(`<< /Length ${streamBytes.length} >>`);
    write("stream");
    write(stream.trimEnd());
    write("endstream");
    write("endobj");

    // Write page object
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
