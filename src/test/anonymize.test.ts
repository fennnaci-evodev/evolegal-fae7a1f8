import { describe, it, expect } from "vitest";
import { anonymize } from "../../supabase/functions/_shared/anonymize";

describe("training anonymizer", () => {
  it("strips emails, phones, addresses and titled names", () => {
    const r = anonymize("Mr John Carter at 221 Baker Street, call +44 20 7946 0958 or john@x.com");
    expect(r.text).not.toMatch(/John|Carter|Baker|7946|john@/);
    expect(r.redactions).toBeGreaterThanOrEqual(4);
  });
  it("strips names after self-introductions and known profile names", () => {
    expect(anonymize("My name is Anna Kowalska.").text).toBe("My name is [NAME].");
    expect(anonymize("Ask Bohdan about it", ["Bohdan"]).text).toBe("Ask [NAME] about it");
  });
  it("preserves statutory citations", () => {
    const t = "Under Companies Act 2006 s.172(1) and Section 21 of the Housing Act 1988, see [2019] UKSC 5 and N.Y. Gen. Oblig. Law § 5-1401; 1985 c. 6.";
    expect(anonymize(t).text).toBe(t);
  });
  it("keeps short numbers like years and amounts", () => {
    expect(anonymize("Pay 1,500 within 30 days in 2026.").text).toBe("Pay 1,500 within 30 days in 2026.");
  });
});
