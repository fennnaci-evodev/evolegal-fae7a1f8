/** Unified client-side contract text extraction (.txt, .md, .pdf, .docx). */
export const DOCUMENT_MAX_BYTES = 22 * 1024 * 1024;
export type DocumentKind = "text" | "pdf" | "docx";

export class DocumentParseError extends Error {
  constructor(message: string, readonly code: "unsupported" | "too_large" | "empty" | "scanned" | "password" | "corrupt" | "timeout") { super(message); }
}

const TEXT_TYPES = ["", "text/plain", "text/markdown", "text/x-markdown"];
const PDF_TYPES = ["", "application/pdf", "application/x-pdf"];
const DOCX_TYPES = ["", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"];

export function detectKind(file: File): DocumentKind {
  const name = file.name.toLowerCase();
  if (/\.(txt|md)$/.test(name) && TEXT_TYPES.includes(file.type)) return "text";
  if (name.endsWith(".pdf") && PDF_TYPES.includes(file.type)) return "pdf";
  if (name.endsWith(".docx") && DOCX_TYPES.includes(file.type)) return "docx";
  throw new DocumentParseError("Choose a .pdf, .docx, .txt or .md contract.", "unsupported");
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([p, new Promise<never>((_, rej) => { t = setTimeout(() => rej(new DocumentParseError("Reading this document timed out. Try a smaller file.", "timeout")), ms); })]).finally(() => clearTimeout(t));
}

/** Remove control characters and normalise whitespace from extracted text. */
export function sanitizeExtracted(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/\u000C/g, "\n\n")
    .replace(/[\u0000-\u0008\u000B\u000E-\u001F\u007F\uFFFD\u200B\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\u00A0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

const PAGE_NUMBER = /^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$|^[-–—]\s*\d{1,4}\s*[-–—]$/i;
/** Drop page numbers and lines repeated at the top/bottom of most pages (headers/footers). */
export function stripRepeatedPageNoise(pages: string[]): string[] {
  if (pages.length < 3) return pages.map(p => p.split("\n").filter(l => !PAGE_NUMBER.test(l.trim())).join("\n"));
  const key = (l: string) => l.trim().toLowerCase().replace(/\d+/g, "#");
  const counts = new Map<string, number>();
  for (const page of pages) {
    const lines = page.split("\n").map(l => l.trim()).filter(Boolean);
    new Set([...lines.slice(0, 3), ...lines.slice(-3)].map(key)).forEach(k => counts.set(k, (counts.get(k) ?? 0) + 1));
  }
  const threshold = Math.max(3, Math.ceil(pages.length * 0.6));
  const noisy = new Set([...counts].filter(([k, c]) => c >= threshold && k.length > 0 && k.length < 160).map(([k]) => k));
  return pages.map(page => {
    const lines = page.split("\n");
    const edge = (i: number) => i < 4 || i >= lines.length - 4;
    return lines.filter((l, i) => !(PAGE_NUMBER.test(l.trim()) || (edge(i) && noisy.has(key(l))))).join("\n");
  });
}

async function readText(bytes: ArrayBuffer) {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { return new TextDecoder("windows-1252").decode(bytes); }
}

async function readPdf(bytes: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  let doc;
  try { doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, disableFontFace: true }).promise; }
  catch (e) {
    const name = (e as { name?: string })?.name;
    if (name === "PasswordException") throw new DocumentParseError("This PDF is password-protected. Remove the password and upload it again.", "password");
    throw new DocumentParseError("This PDF could not be read. It may be corrupt; export it again and retry.", "corrupt");
  }
  try {
    const pages: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      let out = "";
      for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
        if (typeof item.str !== "string") continue;
        out += item.str + (item.hasEOL ? "\n" : "");
      }
      pages.push(out);
      page.cleanup();
    }
    const chars = pages.join("").replace(/\s/g, "").length;
    if (chars < Math.max(40, doc.numPages * 20)) throw new DocumentParseError("This PDF appears to be a scanned image without selectable text. Upload a digital PDF, or export it to Word or text first.", "scanned");
    return stripRepeatedPageNoise(pages).join("\n\n");
  } finally { await doc.destroy(); }
}

async function readDocx(bytes: ArrayBuffer) {
  const head = new Uint8Array(bytes.slice(0, 8));
  // Encrypted Office files are OLE compound documents, not ZIP packages.
  if (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0) throw new DocumentParseError("This Word document is password-protected. Remove the password and upload it again.", "password");
  if (head[0] !== 0x50 || head[1] !== 0x4b) throw new DocumentParseError("This Word document could not be read. It may be corrupt; save it again as .docx and retry.", "corrupt");
  const mammoth = await import("mammoth");
  try { return (await mammoth.extractRawText({ arrayBuffer: bytes })).value; }
  catch { throw new DocumentParseError("This Word document could not be read. It may be corrupt; save it again as .docx and retry.", "corrupt"); }
}

export async function extractDocumentText(file: File, maxBytes = DOCUMENT_MAX_BYTES): Promise<{ text: string; kind: DocumentKind }> {
  const kind = detectKind(file);
  if (!file.size) throw new DocumentParseError("This document is empty.", "empty");
  if (file.size > maxBytes) throw new DocumentParseError(`Choose a document no larger than ${Math.round(maxBytes / 1048576)} MiB.`, "too_large");
  let bytes: ArrayBuffer | null = await withTimeout(file.arrayBuffer(), 15_000);
  try {
    const raw = await withTimeout(kind === "pdf" ? readPdf(bytes) : kind === "docx" ? readDocx(bytes) : readText(bytes), 60_000);
    if (kind === "text" && /[\u0000-\u0008\u000B\u000E-\u001F\u007F]/u.test(raw.replace(/\u000C/g, ""))) throw new DocumentParseError("This file contains binary characters. Choose a readable contract.", "corrupt");
    const text = sanitizeExtracted(raw);
    if (!text) throw new DocumentParseError("No readable text was found in this document.", "empty");
    return { text, kind };
  } finally { bytes = null; }
}

export const DOCUMENT_ACCEPT = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";
