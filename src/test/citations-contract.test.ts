import { describe, it, expect } from "vitest";
import { extractCitations, matchSource } from "@/lib/citations";
import { extractClauses, looksLikeContract } from "@/lib/contractRisk";
import { CONTRACT_AUDIT_PREFIX, prepareContractAttachment } from "@/lib/hugoContractInput";

describe("citations", () => {
  it("detects UK and NY statutory references", () => {
    const labels = extractCitations("See Companies Act 2006 s. 172 and NY UCC § 2-207.").map(c => c.label);
    expect(labels).toContain("Companies Act 2006 s. 172");
    expect(labels.some(l => l.includes("§ 2-207"))).toBe(true);
  });
  it("marks a citation verified only when an approved source matches", () => {
    const [c] = extractCitations("Companies Act 2006 s. 172");
    expect(matchSource(c, [])).toBeNull();
    const src = { id: "1", title: "Companies Act 2006 s. 172", jurisdiction: "England", source_url: "https://x", excerpt: "e", reviewed_at: "2026-10-01", effective_from: "2006-01-01" };
    expect(matchSource(c, [src])?.id).toBe("1");
    expect(matchSource(c, [{ ...src, title: "Companies Act 2006" }])).toBeNull();
    expect(matchSource(c, [{ ...src, title: "Companies Act 2006 s. 173" }])).toBeNull();
    expect(matchSource(c, [{ ...src, jurisdiction: "New York" }])).toBeNull();
    expect(matchSource(c, [{ ...src, reviewed_at: null }])).toBeNull();
    expect(matchSource(c, [src, { ...src, id: "2" }])).toBeNull();
  });
  it("detects section-first references used in live replies", () => {
    const labels = extractCitations("Section 172 of the Companies Act 2006 and Section 2-207 of the New York Uniform Commercial Code (UCC).").map(c => c.label);
    expect(labels).toContain("Companies Act 2006 s. 172");
    expect(labels).toContain("NY UCC § 2-207");
  });
});

describe("in-chat contract detection", () => {
  const contract = "This Agreement is made between the parties. The Provider shall indemnify and hold harmless the Client. ".repeat(6)
    + "In no event shall either party be liable for any indirect damages. This Agreement is governed by the laws of England.";
  it("recognises pasted contracts but not short questions", () => {
    expect(looksLikeContract(contract)).toBe(true);
    expect(looksLikeContract("What does indemnity mean?")).toBe(false);
  });
  it("extracts clauses without scoring them", () => {
    const titles = extractClauses(contract).map(c => c.title);
    expect(titles).toEqual(expect.arrayContaining(["Indemnification", "Limitation of Liability", "Governing Law"]));
    expect(extractClauses(contract)[0]).not.toHaveProperty("risk_score");
  });
  it("excludes the attachment instruction from clause excerpts", () => {
    const text = prepareContractAttachment("Either party may terminate this Agreement after thirty days' written notice.");
    expect(extractClauses(text).find(c => c.title === "Term and Termination")?.excerpt).toBe("Either party may terminate this Agreement after thirty days' written notice.");
  });
  it("limits the complete attachment message to 30,000 characters", () => {
    expect(prepareContractAttachment("x".repeat(30_000 - CONTRACT_AUDIT_PREFIX.length))).toHaveLength(30_000);
    expect(() => prepareContractAttachment("x".repeat(30_001 - CONTRACT_AUDIT_PREFIX.length))).toThrow();
  });
  it("counts decoded characters rather than UTF-8 bytes", () => {
    expect(prepareContractAttachment("界".repeat(15_000))).toHaveLength(15_000 + CONTRACT_AUDIT_PREFIX.length);
  });
  it("rejects empty attachments", () => expect(() => prepareContractAttachment(" \n")).toThrow());
});
