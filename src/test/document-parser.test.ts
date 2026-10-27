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
  it("strips DocuSign IDs, file paths and export timestamps", () => {
    const out = stripRepeatedPageNoise(["DocuSign Envelope ID: 3B8F9A12-4C11-4D2E\nC:\\Users\\Legal\\MSA_v4.docx\nPrinted on 10/24/2026 14:32 UTC\nBody."]).join("\n");
    expect(out.trim()).toBe("Body.");
  });
  it("never strips repeated legal anchor lines at page edges", () => {
    const pages = [1, 2, 3, 4].map(n => `Clause ${n}.\nThis Agreement is governed by the laws of England`);
    expect(stripRepeatedPageNoise(pages).join("\n").match(/governed by/g)).toHaveLength(4);
  });
  it("keeps repeated termination and liability labels without punctuation", () => {
    const pages = [1, 2, 3].map(n => `Termination Rights\nBody ${n}.\nLimitation of Liability`);
    const out = stripRepeatedPageNoise(pages).join("\n");
    expect(out.match(/Termination Rights/g)).toHaveLength(3);
    expect(out.match(/Limitation of Liability/g)).toHaveLength(3);
  });
  it("keeps repeated operative sentences", () => {
    const pages = [1, 2, 3].map(n => `Body ${n}.\nEach party shall keep this information secret.`);
    expect(stripRepeatedPageNoise(pages).join("\n").match(/shall keep/g)).toHaveLength(3);
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
