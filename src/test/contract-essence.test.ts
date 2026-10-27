import { describe, expect, it } from "vitest";
import { buildContractEssence, MONTHLY_FREE_AUDITS } from "@/lib/contractRisk";
const text = "This Agreement is governed by the laws of England and Wales. Provider's aggregate liability shall not exceed the fees paid in the prior twelve months. Either party may terminate for convenience on thirty (30) days written notice.";
describe("contract essence", () => {
  it("grants 3 free audits per month", () => expect(MONTHLY_FREE_AUDITS).toBe(3));
  it("extracts jurisdiction, liability cap and termination terms", () => {
    const e = buildContractEssence({ overall_risk_score: 60, risk_level: "Medium", clauses: [
      { title: "Liability", severity: "Red", risk_score: 80, explanation: "Cap tied to fees." },
      { title: "Confidentiality", severity: "Green", risk_score: 10, explanation: "Mutual." }] }, text);
    expect(e.entities.jurisdiction).toBe("England and Wales");
    expect(e.entities.liability_caps[0]).toContain("shall not exceed");
    expect(e.entities.termination_terms[0]).toContain("thirty (30) days");
    expect(e.risk_vectors).toEqual(["Liability (Red, 80)"]);
  });
});
