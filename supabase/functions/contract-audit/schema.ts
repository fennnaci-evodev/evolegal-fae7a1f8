import { z } from "npm:zod@4.6.7";
export const analysisSchema = z.object({
  overall_risk_score: z.number().int().min(0).max(100),
  risk_level: z.string().min(1).max(80), summary: z.string().min(1).max(1600),
  clauses: z.array(z.object({ title: z.string().min(1).max(120), risk_score: z.number().int().min(0).max(100),
    severity: z.enum(["Red", "Amber", "Green"]), excerpt: z.string().min(1).max(2000),
    explanation: z.string().min(1).max(1600), recommendation: z.string().min(1).max(1600) })).min(1).max(15),
});
export const redlineSchema = z.object({ original: z.string().min(1).max(2000), suggested: z.string().min(1).max(2500), reasoning: z.string().min(1).max(1600) });
/** Never silently score text outside the provider's explicit coverage. */
export function auditCoverage(text: string) {
  const limit = 60000;
  return { text: text.slice(0, limit), assessed_characters: Math.min(text.length, limit), total_characters: text.length, partial: text.length > limit };
}