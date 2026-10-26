import { describe, it, expect } from "vitest";
import { CONTRACT_AUDIT_BYTES, normalizeAuditText, readAuditFile } from "@/lib/contractAuditInput";
import { exposureCounts } from "@/lib/contractRisk";
describe("in-chat audit input", () => {
  it("accepts exactly 22 MiB of text", () => {
    expect(CONTRACT_AUDIT_BYTES).toBe(23068672);
    expect(normalizeAuditText("x".repeat(23068672)).length).toBe(23068672);
  });
  it("rejects more than 22 MiB by bytes rather than characters", () => {
    expect(() => normalizeAuditText("x".repeat(23068673))).toThrow();
    expect(() => normalizeAuditText("é".repeat(11534337))).toThrow();
  });
  it("keeps 30001 character contracts independent of chat limits", () => {
    expect(normalizeAuditText("a".repeat(30001)).length).toBe(30001);
  });
  it("rejects blank binary and unsupported attachments", async () => {
    expect(() => normalizeAuditText("  ")).toThrow();
    expect(() => normalizeAuditText("contract\u0000")).toThrow();
    await expect(readAuditFile(new File(["text"], "contract.pdf", { type: "application/pdf" }))).rejects.toThrow();
  });
  it("preserves literal clauses while normalizing page breaks", () => {
    expect(normalizeAuditText("A <clause>\r\nB\fC")).toBe("A <clause>\nB\n\nC");
  });
  it("counts each exposure independently", () => {
    const clause = { title: "Test", risk_score: 50, explanation: "Test" };
    expect(exposureCounts([{ ...clause, severity: "Red" }, { ...clause, severity: "Red" }, { ...clause, severity: "Amber" }, { ...clause, severity: "Green" }])).toEqual({ High: 2, Medium: 1, Low: 1 });
    expect(exposureCounts([])).toEqual({ High: 0, Medium: 0, Low: 0 });
  });
});