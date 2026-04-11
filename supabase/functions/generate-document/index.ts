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
            content: `You are an EvoLegal document generator. You create professional, general-purpose legal informational documents. 

CRITICAL RULES:
- NEVER include personalized legal advice
- ALWAYS use placeholders: [Your Name], [Date], [Your Jurisdiction], [Your Attorney], [Reference Number], etc.
- Keep all content general, educational, and informational
- Structure content clearly with numbered sections and subsections
- Write in professional, clear English
- Focus on US and English/UK law frameworks where relevant
- Each section should be substantive but concise

Format the document content in clean plain text with clear section headers using "SECTION:" prefix, numbered lists, and bullet points using "•" character.`,
          },
          {
            role: "user",
            content: `Topic: ${topic}\n\n${docConfig.prompt}${contextNote}`,
          },
        ],
        temperature: 0.4,
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

    // Build a simple text-based PDF manually (no external PDF lib needed in Deno)
    // We'll use a minimal PDF generator
    const pdfBytes = generatePDF(title, docConfig.label, topic, content, DISCLAIMER);

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
