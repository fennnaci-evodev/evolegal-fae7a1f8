import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { auditCoverage, analysisSchema, redlineSchema } from "./schema.ts";
Deno.test("oversized contracts disclose assessed coverage", () => {
  const result = auditCoverage("a".repeat(60001));
  assertEquals(result.assessed_characters, 60000);
  assertEquals(result.total_characters, 60001);
  assertEquals(result.partial, true);
  assertEquals(auditCoverage("short").partial, false);
});
Deno.test("scores must be provider numbers between zero and one hundred", () => {
  const value = { overall_risk_score: 55, risk_level: "Medium", summary: "Estimate", clauses: [{ title: "Liability", risk_score: 85, severity: "Red", excerpt: "Original text", explanation: "Exposure", recommendation: "Alternative" }] };
  assert(analysisSchema.safeParse(value).success);
  assert(!analysisSchema.safeParse({ ...value, overall_risk_score: 101 }).success);
  assert(!analysisSchema.safeParse({ ...value, clauses: [] }).success);
});
Deno.test("redlines require an original and bounded alternative", () => {
  assert(redlineSchema.safeParse({ original: "old", suggested: "new", reasoning: "tradeoff" }).success);
  assert(!redlineSchema.safeParse({ original: "", suggested: "new", reasoning: "tradeoff" }).success);
});