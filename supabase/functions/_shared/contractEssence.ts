// Pure TypeScript: shared by the browser (src/lib/contractRisk.ts) and the contract-audit edge function.
export const MONTHLY_FREE_AUDITS = 3;

export interface EssenceClauseInput { title: string; severity: "Red" | "Amber" | "Green"; risk_score: number; explanation: string }
export interface ContractEssence {
  version: 1;
  overall_risk_score: number;
  risk_level: string;
  clause_summaries: { title: string; severity: string; risk_score: number; summary: string }[];
  risk_vectors: string[];
  entities: { jurisdiction: string | null; liability_caps: string[]; termination_terms: string[] };
  partial: boolean;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const sentences = (text: string) => text.replace(/\s+/g, " ").split(/(?<=[.;])\s+/);
const unique = (xs: string[], n: number) => [...new Set(xs.map(x => clip(x.trim(), 220)))].slice(0, n);

export function extractEntities(text: string): ContractEssence["entities"] {
  const s = sentences(text);
  const gov = text.match(/governed by(?: and construed in accordance with)? the laws? of ([A-Z][A-Za-z ,]{2,60}?)(?:[.,;]|\s+without)/);
  const liability = s.filter(x => /liabilit/i.test(x) && /(shall not exceed|not exceed|capped|aggregate liability|limited to)/i.test(x));
  const termination = s.filter(x => /terminat/i.test(x) && /(\d+|thirty|sixty|ninety|fourteen|seven)\s*\(?\d*\)?\s*(days?|months?)|notice|breach|convenience/i.test(x));
  return { jurisdiction: gov ? gov[1].trim() : null, liability_caps: unique(liability, 3), termination_terms: unique(termination, 3) };
}

/** Distil a completed analysis plus its assessed text into a compact, token-cheap artifact. */
export function buildContractEssence(
  analysis: { overall_risk_score: number; risk_level: string; clauses: EssenceClauseInput[] },
  assessedText: string,
  partial = false,
): ContractEssence {
  const ranked = [...analysis.clauses].sort((a, b) => b.risk_score - a.risk_score);
  return {
    version: 1,
    overall_risk_score: analysis.overall_risk_score,
    risk_level: analysis.risk_level,
    clause_summaries: ranked.slice(0, 12).map(c => ({ title: c.title, severity: c.severity, risk_score: c.risk_score, summary: clip(c.explanation, 200) })),
    risk_vectors: ranked.filter(c => c.severity !== "Green").slice(0, 6).map(c => `${c.title} (${c.severity}, ${c.risk_score})`),
    entities: extractEntities(assessedText),
    partial,
  };
}
