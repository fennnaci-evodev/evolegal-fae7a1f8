import { describe, it, expect } from "vitest";
import { documentContextExcerpt } from "@/lib/documentContext";
import { readContractViewerFile } from "@/lib/contractViewerInput";
import { normalizeHugoText } from "@/lib/hugoContractInput";

function fileFrom(bytes: Uint8Array, name = "contract.txt", type = "text/plain"): File {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const file = new File([buffer], name, { type });
  Object.defineProperty(file, "arrayBuffer", { value: async () => buffer });
  return file;
}
const textFile = (text: string) => fileFrom(new TextEncoder().encode(text));

describe("Document input regression safeguards", () => {
  it("bounds the last four long chat messages to the generator's 4,000-character excerpt", () => {
    const context = ["A".repeat(30_000), ...Array(3).fill("B".repeat(30_000))].join("\n");
    expect(documentContextExcerpt(context)).toBe("A".repeat(4000));
    expect(documentContextExcerpt(undefined)).toBeUndefined();
  });
  it("opens local contracts above both chat character and byte limits", async () => {
    const text = "Contract clause.\n".repeat(10_000);
    await expect(readContractViewerFile(textFile(text))).resolves.toBe(text);
  });
  it("allows text viewing at the 22 MiB boundary but rejects larger files", async () => {
    const text = "x".repeat(22 * 1024 * 1024);
    await expect(readContractViewerFile(textFile(text))).resolves.toHaveLength(22 * 1024 * 1024);
    await expect(readContractViewerFile(textFile(text + "x"))).rejects.toThrow("22 MiB");
  });
  it("normalizes exported page breaks without rejecting a contract", async () => {
    await expect(readContractViewerFile(textFile("Clause A\fClause B"))).resolves.toBe("Clause A\n\nClause B");
  });
  it("decodes Windows-1252 smart quotes instead of losing contractual wording", async () => {
    await expect(readContractViewerFile(fileFrom(new Uint8Array([0x93, 0x41, 0x94])))).resolves.toBe("“A”");
  });
  it("preserves existing Unicode replacement characters for local viewing", async () => {
    await expect(readContractViewerFile(textFile("Clause \uFFFD"))).resolves.toBe("Clause \uFFFD");
  });
  it("rejects binary, blank and unsupported local files", async () => {
    await expect(readContractViewerFile(textFile("a\0b"))).rejects.toThrow("binary");
    await expect(readContractViewerFile(textFile(" \f\n"))).rejects.toThrow("empty");
    await expect(readContractViewerFile(fileFrom(new Uint8Array([65]), "a.exe"))).rejects.toThrow(".pdf, .docx");
    await expect(readContractViewerFile(fileFrom(new Uint8Array([65]), "a.txt", "application/pdf"))).rejects.toThrow("content type does not match");
  });
  it("retains the separate 30,000-character Hugo chat limit", () => {
    expect(() => normalizeHugoText("x".repeat(30_000))).not.toThrow();
    expect(() => normalizeHugoText("x".repeat(30_001))).toThrow("30,000");
  });
});