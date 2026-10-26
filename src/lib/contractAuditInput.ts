export const CONTRACT_AUDIT_BYTES = 22 * 1024 * 1024;
export function normalizeAuditText(text: string): string {
  const value = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/\u000C/g, "\n\n").replace(/[\u200B\u202A-\u202E\u2066-\u2069]/g, "");
  if (!value.trim()) throw new Error("This contract is empty.");
  if (new TextEncoder().encode(value).byteLength > CONTRACT_AUDIT_BYTES) throw new Error("Choose contract text no larger than 22 MiB.");
  if (/[\u0000-\u0008\u000B\u000E-\u001F\u007F\uFFFD]/u.test(value)) throw new Error("Choose readable text without binary characters.");
  return value;
}
export async function readAuditFile(file: File) {
  if (!/\.(txt|md)$/i.test(file.name) || (file.type && !["text/plain", "text/markdown", "text/x-markdown"].includes(file.type))) throw new Error("Choose a .txt or .md contract.");
  if (file.size > CONTRACT_AUDIT_BYTES) throw new Error("Choose a contract no larger than 22 MiB.");
  const bytes = await file.arrayBuffer();
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { text = new TextDecoder("windows-1252").decode(bytes); }
  return normalizeAuditText(text);
}