/** Local viewing is independent of Hugo's smaller message/attachment limits. */
export const CONTRACT_VIEWER_FILE_BYTES = 20 * 1024 * 1024;

export async function readContractViewerFile(file: File): Promise<string> {
  if (!/\.(txt|md)$/i.test(file.name)) throw new Error("Choose a .txt or .md contract.");
  if (file.type && !["text/plain", "text/markdown", "text/x-markdown"].includes(file.type)) throw new Error("This file's content type does not match a text contract.");
  if (!file.size) throw new Error("This document is empty.");
  if (file.size > CONTRACT_VIEWER_FILE_BYTES) throw new Error("Choose a text document no larger than 20 MB.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const bytes = await Promise.race([
    file.arrayBuffer(),
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Reading this document timed out. Try another text contract.")), 10_000); }),
  ]).finally(() => clearTimeout(timer));
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { text = new TextDecoder("windows-1252").decode(bytes); }
  // Page breaks are normal in exported contracts; preserve literal wording.
  text = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/\u000C/g, "\n\n");
  if (/[\u0000-\u0008\u000B\u000E-\u001F\u007F]/u.test(text)) throw new Error("This file contains binary control characters. Choose a text contract.");
  if (!text.trim()) throw new Error("This document is empty.");
  return text;
}