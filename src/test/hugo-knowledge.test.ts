import { describe, it, expect } from "vitest";
import { isEligibleSource, type LegalSource } from "../../supabase/functions/hugo-chat/knowledge";
const now = new Date("2026-10-17T11:23:00Z");
const source: LegalSource = { id: "source-1", title: "Reviewed legislation", source_url: "https://www.legislation.gov.uk/example", jurisdiction: "UK", topic: "contract", excerpt: "A reviewed excerpt.", status: "approved", reviewed_by: "reviewer", reviewed_at: "2026-10-01T00:00:00Z", review_due_at: "2026-11-01T00:00:00Z", effective_from: "2026-01-01T00:00:00Z", effective_until: null };
const eligible = (overrides: Partial<LegalSource> = {}) => isEligibleSource({ ...source, ...overrides }, "UK", "contract", now);
describe("Reviewed legal-source eligibility", () => {
  it("accepts only an approved current source in the requested scope", () => expect(eligible()).toBe(true));
  it("excludes drafts", () => expect(eligible({ status: "draft" })).toBe(false));
  it("requires an identified reviewer", () => expect(eligible({ reviewed_by: null })).toBe(false));
  it("requires a completed review", () => expect(eligible({ reviewed_at: null })).toBe(false));
  it("rejects future reviews", () => expect(eligible({ reviewed_at: "2026-10-18T00:00:00Z" })).toBe(false));
  it("rejects overdue reviews", () => expect(eligible({ review_due_at: "2026-10-17T11:23:00Z" })).toBe(false));
  it("rejects not-yet-effective law", () => expect(eligible({ effective_from: "2027-01-01T00:00:00Z" })).toBe(false));
  it("rejects expired law", () => expect(eligible({ effective_until: "2026-10-17T11:23:00Z" })).toBe(false));
  it("does not mix jurisdictions", () => expect(eligible({ jurisdiction: "US" })).toBe(false));
  it("does not mix topics", () => expect(eligible({ topic: "employment" })).toBe(false));
  it("requires secure provenance", () => expect(eligible({ source_url: "http://example.com" })).toBe(false));
});