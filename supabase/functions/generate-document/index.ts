import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCLAIMER =
  "This is a general informational document only. It is not legal advice and does not create an attorney-client relationship. Laws vary by jurisdiction. Consult a licensed professional for your specific situation.";

const DOCUMENT_TYPES: Record<string, { label: string; prompt: string }> = {
  overview: {
    label: "Information Overview",
    prompt: `Create a comprehensive general Information Overview document. Structure it with clear sections covering: Introduction, Key Concepts, Important Considerations, Common Questions, and Further Resources. Use placeholder fields like [Your Name], [Date], [Your Jurisdiction] where personal data would go. Keep all information general and educational. Do NOT provide specific legal advice.`,
  },
  checklist: {
    label: "Preparation Checklist",
    prompt: `Create a thorough Preparation Checklist document. Structure it with: Purpose section, a numbered checklist of items to prepare/gather/consider, a timeline section with placeholder dates, a notes section. Use placeholders like [Your Name], [Date], [Deadline], [Your Attorney]. Keep everything general — no personalized advice.`,
  },
  template: {
    label: "Template Outline",
    prompt: `Create a blank Template Outline document with clear structure and placeholder fields. Include: Header section with [Your Name], [Date], [Reference Number], then a structured body with labeled sections, bullet points for key items, and signature/acknowledgment blocks at the end. This is a blank framework only — no filled-in content.`,
  },
  comparative: {
    label: "Comparative Guide",
    prompt: `Create a Comparative Guide document that compares approaches, frameworks, or jurisdictions related to the topic. Structure it with: Introduction, Side-by-Side Comparison sections, Key Differences, Similarities, Practical Considerations, and a Summary. Use placeholders where jurisdiction-specific details would go. Keep everything general and educational.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
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

    // Verify user
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

    // Generate content via AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contextNote = conversation_context
      ? `\n\nThe user has been discussing: ${conversation_context.slice(0, 1000)}`
      : "";

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
            content: `You are the EvoLegal Modular Legal Document Generation Engine — a deterministic, safety-first system that constructs generic legal templates from modular clauses. You do NOT behave like a chatbot.

Execute the following steps IN ORDER for every document request:

## STEP 1: UNDERSTAND THE TASK
Analyze the input and extract: Document type, Jurisdiction (if provided), Legal issue/context, Key entities (parties, addresses, dates), Missing critical data.
Create an internal structured summary before proceeding.

## STEP 2: RISK ASSESSMENT (Mandatory — before any generation)
Scan for Red Words: court, lawsuit, sued, eviction, police, fine, deadline, urgent, debt, chargeback, legal action, sue, foreclosure, arrest, restraining order, garnishment, lien, injunction, subpoena, contempt, bankruptcy, seizure, repossession, criminal, felony, misdemeanor, indictment.
Only escalate when the request contains clear high-risk signals, asks for personalized legal strategy, or requires specific legal judgment.
Do NOT escalate solely because information is missing when a safe generic template can be produced using placeholders.
For Template Outline documents specifically, low-detail input is expected and should still produce a blank, generic framework.
If Red Words are present or the case appears genuinely high-risk/complex → output ONLY:
"RISK_ESCALATION: This situation appears to involve higher risk or complexity. I recommend connecting you with an EvoLegal Expert for a more precise review."
Only proceed if risk is low and suitable for a generic template.

## STEP 3: SELECT CLAUSES
Select relevant clauses classified as:
1. Core clauses (always required for this document type)
2. Conditional clauses (based on the specific issue)
3. Protective clauses (general risk mitigation)
4. Jurisdiction-specific clauses (only if jurisdiction is explicitly confirmed)
If unsure about a clause → use a neutral fallback version.

## STEP 4: CLAUSE GENERATION
For each selected clause:
- Generate as a standalone, legally coherent unit.
- Use clear, professional, neutral language.
- Replace ALL variables with {{placeholder}} syntax: {{Tenant Name}}, {{Landlord Name}}, {{Property Address}}, {{Date}}, {{Your Name}}, {{Your Jurisdiction}}, {{Your Attorney}}, {{Reference Number}}, etc.
- If a required variable is missing, use [REQUIRES USER INPUT: {{field_name}}] in the document instead of escalating, unless the request is high-risk.
- Do NOT invent facts, laws, or jurisdiction-specific rules.
- Do NOT use vague or absolute wording.
- Avoid redundancy.

## STEP 5: INTERNAL REVIEW
Before final assembly, verify:
- No inconsistencies or conflicting clauses
- All essential clauses present for this document type (Definitions, Governing Law, Severability where appropriate)
- No vague or ambiguous language
- No logical conflicts
- All user data uses {{placeholder}} syntax only
- No content interpretable as personalized advice
If issues found → correct them silently using safer neutral versions.

## STEP 6: DOCUMENT ASSEMBLY
Assemble using this structure:
1. Title
2. Parties (with placeholders)
3. Recitals / Background (if appropriate)
4. Main Provisions (numbered sections)
5. Conditional Clauses
6. General / Protective Clauses
7. Signatures / Execution (with placeholders)
Use "SECTION:" prefix for all section headers. Ensure logical flow and clear separation.

## STEP 7: OUTPUT FORMAT
- Output ONLY the clean, ready-to-use document.
- No explanations, comments, reasoning, or chat text.
- Use "SECTION:" headers, numbered lists, "•" for bullets.
- Write in formal but accessible legal English.
- Focus on US and English/UK law frameworks where relevant.
- Each section should be substantive but concise.
- The PDF system adds the disclaimer automatically — do not include it in body text.

## FAIL-SAFE RULES
- Escalate only for genuine risk, complexity, or requests for personalized advice.
- Missing factual detail alone is not a reason to escalate when a safe placeholder-based generic document can be generated.
- Never guess or fabricate missing data or laws.
- Always prioritize safety and compliance over completeness.`,
          },
          {
            role: "user",
            content: `DOCUMENT TYPE: ${docConfig.label}\nTOPIC: ${topic}\n\n${docConfig.prompt}${contextNote}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI generation failed:", aiResponse.status);
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

    // Check if AI flagged high risk — refuse to generate document
    if (content.trim().startsWith("RISK_ESCALATION:")) {
      return new Response(
        JSON.stringify({
          escalated: true,
          message: content.replace("RISK_ESCALATION:", "").trim(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── LEGAL DOCUMENT REVIEWER (internal, silent) ──────────────────
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
            content: `You are the EvoLegal Legal Document Reviewer — an independent internal quality operator that reviews modular clause-based documents.

REVIEW CHECKLIST (apply silently, fix all issues):
1. CLAUSE COHERENCE: Verify each clause is standalone and legally coherent. Fix contradictions or conflicts between clauses.
2. MISSING CLAUSES: Add essential clauses for this document type (Definitions, Governing Law, Severability, Entire Agreement, Amendments, Notices where appropriate).
3. VAGUE LANGUAGE: Replace ambiguous wording with precise, clear, neutral language.
4. STRUCTURE: Ensure proper assembly order (Title → Parties → Recitals → Main Provisions → Conditional → Protective → Signatures). Fix numbering and "SECTION:" headers.
5. PLACEHOLDER INTEGRITY: Verify ALL user-specific data uses {{placeholder}} syntax. Replace any filled-in specifics with placeholders.
6. COMPLIANCE: Remove anything interpretable as personalized advice. Ensure 100% generic and informational.
7. NO HALLUCINATIONS: Remove invented laws, cases, statutes, or jurisdiction-specific rules that are not widely accepted.
8. REDUNDANCY: Eliminate duplicate or overlapping clauses.

OUTPUT RULES:
- Output ONLY the improved document. No review notes, no explanations, no commentary.
- If the document is already excellent, output as-is.
- If high-risk content detected, output ONLY: "RISK_ESCALATION: This document requires expert review."
- Maintain format: "SECTION:" headers, numbered lists, "•" bullets.
- Keep all {{placeholders}} intact.`,
          },
          {
            role: "user",
            content: `DOCUMENT TYPE: ${docConfig.label}\nTOPIC: ${topic}\n\nDOCUMENT TO REVIEW:\n\n${content}`,
          },
        ],
        temperature: 0.15,
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

    // Build a simple text-based PDF manually (no external PDF lib needed in Deno)
    // We'll use a minimal PDF generator
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

    // Save record (use service role to bypass RLS for insert since user_id matches)
    // Actually we need to insert as the user. Let's use the user's client.
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

// ── Minimal PDF Generator ──────────────────────────────────────────
// Generates a valid PDF 1.4 document without any external library.

function generatePDF(
  title: string,
  docType: string,
  topic: string,
  content: string,
  disclaimer: string
): Uint8Array {
  const lines: string[] = [];
  const objects: { offset: number }[] = [];
  let currentOffset = 0;

  function write(s: string) {
    lines.push(s);
    currentOffset += new TextEncoder().encode(s + "\n").length;
  }

  function startObj(id: number) {
    objects[id] = { offset: currentOffset };
    write(`${id} 0 obj`);
  }

  // Escape PDF string
  function pdfStr(s: string): string {
    return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  // Word wrap
  function wordWrap(text: string, maxChars: number): string[] {
    const result: string[] = [];
    const paragraphs = text.split("\n");
    for (const para of paragraphs) {
      if (para.trim() === "") {
        result.push("");
        continue;
      }
      const words = para.split(/\s+/);
      let line = "";
      for (const word of words) {
        if (line.length + word.length + 1 > maxChars) {
          result.push(line);
          line = word;
        } else {
          line = line ? line + " " + word : word;
        }
      }
      if (line) result.push(line);
    }
    return result;
  }

  // Build pages of content
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 60;
  const lineHeight = 14;
  const headerHeight = 80;
  const footerHeight = 60;
  const usableHeight = pageHeight - margin - headerHeight - footerHeight;
  const linesPerPage = Math.floor(usableHeight / lineHeight);
  const charsPerLine = 80;

  // Prepare all text lines
  const allLines: string[] = [];

  // Title page content
  allLines.push("__TITLE__");
  allLines.push("");
  allLines.push(`Document Type: ${docType}`);
  allLines.push(`Topic: ${topic}`);
  allLines.push(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  allLines.push("");
  allLines.push("─".repeat(60));
  allLines.push("");

  // Main content
  const wrappedContent = wordWrap(content, charsPerLine);
  allLines.push(...wrappedContent);

  // Split into pages
  const pages: string[][] = [];
  for (let i = 0; i < allLines.length; i += linesPerPage) {
    pages.push(allLines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push([""]);

  const totalPages = pages.length;

  // PDF structure
  write("%PDF-1.4");

  // Font (Helvetica)
  startObj(1);
  write("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  write("endobj");

  // Bold font
  startObj(2);
  write("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  write("endobj");

  // Build page objects
  const pageObjStart = 3;
  const contentObjStart = pageObjStart + totalPages;

  // Pages parent
  const pagesObjId = contentObjStart + totalPages;
  const catalogObjId = pagesObjId + 1;

  // Create content streams for each page
  for (let p = 0; p < totalPages; p++) {
    const pageLines = pages[p];
    let stream = "";

    // Header: EvoLegal branding
    stream += "BT\n";
    stream += "/F2 16 Tf\n";
    stream += `${margin} ${pageHeight - 45} Td\n`;
    stream += `(${pdfStr("E  EVOLEGAL")}) Tj\n`;
    stream += "ET\n";

    // Header line
    stream += `${margin} ${pageHeight - 55} m ${pageWidth - margin} ${pageHeight - 55} l S\n`;

    // Page content
    let y = pageHeight - headerHeight - margin;
    for (const line of pageLines) {
      if (y < footerHeight + margin) break;

      if (line === "__TITLE__") {
        stream += "BT\n";
        stream += "/F2 14 Tf\n";
        stream += `${margin} ${y} Td\n`;
        stream += `(${pdfStr(title)}) Tj\n`;
        stream += "ET\n";
      } else if (line.startsWith("SECTION:") || line.startsWith("---")) {
        stream += "BT\n";
        stream += "/F2 11 Tf\n";
        stream += `${margin} ${y} Td\n`;
        stream += `(${pdfStr(line.replace("SECTION:", "").trim())}) Tj\n`;
        stream += "ET\n";
      } else {
        stream += "BT\n";
        stream += "/F1 10 Tf\n";
        stream += `${margin} ${y} Td\n`;
        stream += `(${pdfStr(line)}) Tj\n`;
        stream += "ET\n";
      }
      y -= lineHeight;
    }

    // Footer: disclaimer + page number
    const disclaimerLines = wordWrap(disclaimer, 90);
    let fy = footerHeight;
    stream += `${margin} ${fy + 5} m ${pageWidth - margin} ${fy + 5} l S\n`;
    for (const dl of disclaimerLines) {
      stream += "BT\n";
      stream += "/F1 7 Tf\n";
      stream += `${margin} ${fy - 8} Td\n`;
      stream += `(${pdfStr(dl)}) Tj\n`;
      stream += "ET\n";
      fy -= 9;
    }

    // Page number
    stream += "BT\n";
    stream += "/F1 8 Tf\n";
    stream += `${pageWidth / 2 - 15} 25 Td\n`;
    stream += `(Page ${p + 1} of ${totalPages}) Tj\n`;
    stream += "ET\n";

    // Write content object
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
    write(`<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentId} 0 R /Resources << /Font << /F1 1 0 R /F2 2 0 R >> >> >>`);
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

  return new TextEncoder().encode(lines.join("\n"));
}
