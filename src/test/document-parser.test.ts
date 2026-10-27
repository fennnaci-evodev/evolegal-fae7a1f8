import { describe, it, expect } from "vitest";
import { stripRepeatedPageNoise, sanitizeExtracted, detectKind, extractDocumentText } from "@/lib/documentParser";
const f = (name: string, body: BlobPart, type = "") => new File([body], name, { type });
describe("documentParser", () => {
  it("strips repeated headers, footers and page numbers", () => {
    const pages = [1, 2, 3, 4].map(n => `ACME MSA - CONFIDENTIAL\nClause ${n} text here.\nPage ${n} of 4`);
    const out = stripRepeatedPageNoise(pages).join("\n");
    expect(out).not.toMatch(/CONFIDENTIAL|Page \d of 4/);
    expect(out).toContain("Clause 3 text here.");
  });
  it("removes control characters", () => { expect(sanitizeExtracted("a\u0000b\u0007c")).toBe("abc"); });
  it("rejects unsupported formats", () => { expect(() => detectKind(f("x.doc", "x"))).toThrow(".pdf, .docx"); });
  it("flags encrypted Word files as password-protected", async () => {
    await expect(extractDocumentText(f("c.docx", new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 1, 2, 3, 4])))).rejects.toThrow("password-protected");
  });
  it("rejects corrupt Word files", async () => {
    await expect(extractDocumentText(f("c.docx", "not a zip"))).rejects.toThrow("corrupt");
  });
  it("rejects files above 22 MiB", async () => {
    await expect(extractDocumentText(f("c.pdf", new Uint8Array(22 * 1024 * 1024 + 1)))).rejects.toThrow("22 MiB");
  });
});
