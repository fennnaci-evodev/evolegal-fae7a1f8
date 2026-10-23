import { describe, it, expect } from "vitest";
import { extractCitations, matchSource } from "@/lib/citations";
import { extractClauses, looksLikeContract } from "@/lib/contractRisk";

describe("citations", () => {
  it("detects UK and NY statutory references", () => {
    const labels = extractCitations("See Companies Act 2006 s. 172 and NY UCC § 2-207.").map(c => c.label);
    expect(labels).toContain("Companies Act 2006 s. 172");
    expect(labels.some(l => l.includes("§ 2-207"))).toBe(true);
  });
  it("marks a citation verified only when an approved source matches", () => {
    const [c] = extractCitations("Companies Act 2006 s. 172");
    expect(matchSource(c, [])).toBeNull();
    const src = { id: "1", title: "Companies Act 2006", jurisdiction: "England", source_url: "https://x", excerpt: "e", reviewed_at: null, effective_from: "2006-01-01" };
    expect(matchSource(c, [src])?.id).toBe("1");
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
});
