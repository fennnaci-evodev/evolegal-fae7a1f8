import { describe, expect, it } from "vitest";
import { canApproveSource, emptyChecks, REVIEW_CHECKS, sourceDiff } from "../lib/sourceReview";
const checked = { provenance: true, scope: true, commencement: true, amendments: true, impact: true };
const now = Date.parse("2026-10-17T22:19:00Z");
const approve = (checks = checked, excerpt = "Reviewed law", notes = "Verified commencement", hash: string | null = "hash", due = "2026-11-17") => canApproveSource(checks, excerpt, notes, hash, due, now);
describe("Source verification", () => {
  for (const { key } of REVIEW_CHECKS) it(`requires ${key} verification`, () => expect(approve({ ...checked, [key]: false })).toBe(false));
  it("accepts completed verification", () => expect(approve()).toBe(true));
  it("requires actual reviewed content", () => expect(approve(checked, "Pending reviewer excerpt selection")).toBe(false));
  it("requires a saved official text hash", () => expect(approve(checked, "Reviewed law", "Notes", null)).toBe(false));
  it("requires a future review deadline", () => expect(approve(checked, "Reviewed law", "Notes", "hash", "2026-10-16")).toBe(false));
  it("requires review rationale", () => expect(approve(checked, "Reviewed law", " ")).toBe(false));
  it("starts with no attestations", () => expect(Object.values(emptyChecks()).some(Boolean)).toBe(false));
  it("preserves removed and added text", () => {
    const diff = sourceDiff("Limit is 10 days.", "Limit is 20 days.");
    expect(diff.filter(p => p.removed).map(p => p.value).join("")).toBe("10");
    expect(diff.filter(p => p.added).map(p => p.value).join("")).toBe("20");
  });
});
import { isVerbatimExcerpt, missingRequirements, suggestReviewDue } from "@/lib/sourceReview";
describe("anti-hallucination excerpt rule", () => {
  it("accepts an exact excerpt despite line wrapping", () => { expect(isVerbatimExcerpt("A person cannot\nexclude", "Text. A person cannot exclude liability.")).toBe(true); });
  it("rejects a paraphrased excerpt", () => { expect(isVerbatimExcerpt("A person may not exclude", "A person cannot exclude liability.")).toBe(false); });
  it("rejects when no official text exists", () => { expect(isVerbatimExcerpt("Anything", null)).toBe(false); });
  it("suggests a review date 90 days ahead", () => { expect(suggestReviewDue(Date.parse("2026-01-01T00:00:00Z"))).toBe("2026-04-01"); });
  it("lists nothing when everything is complete", () => {
    const checks = { provenance: true, scope: true, commencement: true, amendments: true, impact: true };
    expect(missingRequirements({ checks, excerpt: "cannot exclude", officialText: "A person cannot exclude.", notes: "ok", hash: "h", from: "2020-01-01", until: "", due: "2099-01-01", jurisdiction: "England and Wales", topic: "contract" })).toEqual([]);
  });
});
