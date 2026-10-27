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
  if (/\.(txt|md|pdf|docx)$/.test(name)) throw new DocumentParseError("This file's content type does not match its extension.", "unsupported");
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

// Tier 1: purely technical noise, stripped wherever it forms a whole line.
const TECHNICAL_NOISE: RegExp[] = [
  /^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/i,
  /^[-–—]\s*\d{1,4}\s*[-–—]$/,
  /^(docusign\s+envelope\s+id|adobe\s+sign\s+(document|transaction|agreement)\s+id)\s*:?\s*[A-Z0-9-]{8,}$/i,
  /^([a-z]:\\|\\\\|\/)[^\s]*([\\/][^\\/]*)*\.(docx?|pdf|txt|rtf|odt)$/i,
  /^[\w\-. ()]{1,120}\.(docx?|pdf|rtf|odt)$/i,
  /^((printed|exported|generated|saved|created|last\s+(modified|saved))(\s+on)?\s*:?\s*)?\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}([ ,T]+\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?(\s*(utc|gmt|[A-Z]{2,4}))?)?$/i,
  /^(printed|exported|generated|saved)(\s+on)?\s*:?\s*.{0,40}\d{1,2}:\d{2}.*$/i,
];
// Tier 2: substantive legal wording that must never be removed.
const LEGAL_ANCHOR = /\b(governing\s+law|governed\s+by|jurisdiction|liabilit(y|ies)|liable|indemni\w*|arbitrat\w*|dispute\s+resolution|severab\w*|terminat\w*)\b/i;
const OPERATIVE_VERB = /\b(shall|will|must|agrees?|undertakes?|warrants?|represents?|acknowledges?|covenants?|may\s+not|is\s+entitled|subject\s+to)\b/i;
const SENTENCE_END = /[.;:!?]["')\]]?$/;

export const isTechnicalNoise = (line: string) => TECHNICAL_NOISE.some(r => r.test(line.trim()));
export const isProtectedLegalLine = (line: string) => {
  const l = line.trim();
  return LEGAL_ANCHOR.test(l) || (OPERATIVE_VERB.test(l) && SENTENCE_END.test(l));
};
const isSafeStamp = (line: string) => { const l = line.trim(); return l.length > 0 && l.length < 80 && !/[.;:!?]/.test(l) && !isProtectedLegalLine(l); };

/** Three-tier cleanup: strip technical noise, protect legal text, then drop only short repeated title/draft stamps at page edges. */
export function stripRepeatedPageNoise(pages: string[]): string[] {
  const drop = (l: string) => !isProtectedLegalLine(l) && isTechnicalNoise(l);
  if (pages.length < 3) return pages.map(p => p.split("\n").filter(l => !drop(l)).join("\n"));
  const key = (l: string) => l.trim().toLowerCase().replace(/\s+/g, " ");
  const edgeIndexes = (lines: string[]) => {
    const kept = lines.map((l, i) => [l, i] as const).filter(([l]) => l.trim() && !drop(l));
    return new Set([...kept.slice(0, 2), ...kept.slice(-2)].map(([, i]) => i));
  };
  const counts = new Map<string, number>();
  for (const page of pages) {
    const lines = page.split("\n"); const edges = edgeIndexes(lines);
    new Set([...edges].map(i => lines[i]).filter(isSafeStamp).map(key)).forEach(k => counts.set(k, (counts.get(k) ?? 0) + 1));
  }
  const threshold = Math.max(3, Math.ceil(pages.length * 0.6));
  const stamps = new Set([...counts].filter(([, c]) => c >= threshold).map(([k]) => k));
  return pages.map(page => {
    const lines = page.split("\n"); const edges = edgeIndexes(lines);
    return lines.filter((l, i) => !(drop(l) || (edges.has(i) && isSafeStamp(l) && stamps.has(key(l))))).join("\n");
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
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), disableFontFace: true, useSystemFonts: false });
  let doc;
  try { doc = await task.promise; }
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
  } finally { await task.destroy().catch(() => undefined); }
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

export async function extractDocumentText(file: File, maxBytes = DOCUMENT_MAX_BYTES, opts: { literalText?: boolean } = {}): Promise<{ text: string; kind: DocumentKind }> {
  const kind = detectKind(file);
  if (!file.size) throw new DocumentParseError("This document is empty.", "empty");
  if (file.size > maxBytes) throw new DocumentParseError(`Choose a document no larger than ${Math.round(maxBytes / 1048576)} MiB.`, "too_large");
  let bytes: ArrayBuffer | null = await withTimeout(file.arrayBuffer(), 15_000);
  try {
    const raw = await withTimeout(kind === "pdf" ? readPdf(bytes) : kind === "docx" ? readDocx(bytes) : readText(bytes), 60_000);
    if (kind === "text" && /[\u0000-\u0008\u000B\u000E-\u001F\u007F]/u.test(raw.replace(/\u000C/g, ""))) throw new DocumentParseError("This file contains binary characters. Choose a readable contract.", "corrupt");
    // Plain-text viewing keeps literal wording; binary formats are always sanitized.
    const text = kind === "text" && opts.literalText ? raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/\u000C/g, "\n\n") : sanitizeExtracted(raw);
    if (!text.trim()) throw new DocumentParseError("This document is empty.", "empty");
    return { text, kind };
  } finally { bytes = null; }
}

export const DOCUMENT_ACCEPT = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";
