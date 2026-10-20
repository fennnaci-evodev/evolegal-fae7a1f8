import { describe, expect, it } from "vitest";
import { filterRiskClauses, sampleAnalysis } from "@/lib/contractRisk";

describe("contract analysis provider boundary", () => {
  it("preserves the supplied overall mock score and risk level", () => {
    expect(sampleAnalysis.overall_risk_score).toBe(72);
    expect(sampleAnalysis.risk_level).toBe("Medium-High");
  });
  it("preserves the supplied liability and indemnity scores", () => {
    expect(sampleAnalysis.clauses.find(c => c.title === "Limitation of Liability")).toMatchObject({ risk_score: 85, severity: "Red" });
    expect(sampleAnalysis.clauses.find(c => c.title === "Indemnification")).toMatchObject({ risk_score: 68, severity: "Amber" });
  });
  it("filters only the requested severity and search term", () => {
    expect(filterRiskClauses(sampleAnalysis.clauses, "Amber").map(c => c.title)).toEqual(["Indemnification", "Insurance Requirements"]);
    expect(filterRiskClauses(sampleAnalysis.clauses, "All", "liability").map(c => c.title)).toEqual(["Limitation of Liability"]);
    expect(filterRiskClauses(sampleAnalysis.clauses, "Green", "liability")).toEqual([]);
  });
});