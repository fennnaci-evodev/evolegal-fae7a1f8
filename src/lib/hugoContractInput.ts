import { z } from "zod";
export const CONTRACT_MESSAGE_LIMIT = 30_000;
export const CONTRACT_FILE_BYTES = CONTRACT_MESSAGE_LIMIT * 4;
export const CONTRACT_AUDIT_PREFIX = "Audit this contract for liability, indemnity, termination and non-standard terms:\n\n";
const textSchema = z.string().max(CONTRACT_MESSAGE_LIMIT).refine(s => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFD]/u.test(s), "Use valid UTF-8 text without binary control characters.");
/** Preserve literal contractual wording. Do not HTML-escape or rewrite legal excerpts. */
export function normalizeHugoText(text: string): string {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/[\u200B\u202A-\u202E\u2066-\u2069]/g, "");
  const parsed = textSchema.safeParse(normalized);
  if (!parsed.success) throw new Error(normalized.length > CONTRACT_MESSAGE_LIMIT ? "Message too long — up to 30,000 characters per message." : "Use valid UTF-8 text without binary control characters.");
  if (!normalized.trim()) throw new Error("Enter non-empty contract text or a question.");
  return normalized;
}
export async function readContractFile(file: File): Promise<string> {
  if (!/\.(txt|md)$/i.test(file.name)) throw new Error("Attach a .txt or .md contract.");
  if (file.type && !["text/plain", "text/markdown", "text/x-markdown"].includes(file.type)) throw new Error("This file's content type does not match a text contract.");
  if (!file.size) throw new Error("This file is empty. Attach a text contract.");
  if (file.size > CONTRACT_FILE_BYTES) throw new Error("Contract file exceeds the 120,000-byte upload limit.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const text = await Promise.race([file.text(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Reading this file timed out. Try another text contract.")), 10_000); })]).finally(() => clearTimeout(timer));
  return normalizeHugoText(text);
}
export function prepareContractAttachment(text: string): string {
  return normalizeHugoText(CONTRACT_AUDIT_PREFIX + normalizeHugoText(text));
}
export function contractDocumentText(text: string): string {
  return text.startsWith(CONTRACT_AUDIT_PREFIX) ? text.slice(CONTRACT_AUDIT_PREFIX.length) : text;
}
