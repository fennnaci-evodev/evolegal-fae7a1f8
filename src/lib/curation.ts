export const FEEDBACK_REASONS = [
  { id: "inaccurate_citation", label: "Inaccurate citation" },
  { id: "invented_clause", label: "Invented clause" },
  { id: "wrong_jurisdiction", label: "Wrong jurisdiction" },
  { id: "too_vague", label: "Too vague" },
  { id: "tone", label: "Tone" },
  { id: "other", label: "Other" },
] as const;
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number]["id"];

export interface StagedPair {
  id: string; track: string; status: string; prompt: string;
  chosen: string | null; rejected: string | null; reasons: string[]; source_kind: string;
}

const SYSTEM = "You are Hugo, EvoLegal's legal information co-pilot. Provide general information, not legal advice.";

/** Only approved, complete pairs are exportable; each line is one JSON object. */
export function toSftJsonl(rows: StagedPair[]): string {
  return rows.filter(r => r.status === "approved" && r.track === "sft" && r.chosen?.trim())
    .map(r => JSON.stringify({ messages: [{ role: "system", content: SYSTEM }, { role: "user", content: r.prompt }, { role: "assistant", content: r.chosen }] }))
    .join("\n");
}
export function toDpoJsonl(rows: StagedPair[]): string {
  return rows.filter(r => r.status === "approved" && r.track === "dpo" && r.chosen?.trim() && r.rejected?.trim())
    .map(r => JSON.stringify({ prompt: r.prompt, chosen: r.chosen, rejected: r.rejected, metadata: { reasons: r.reasons, source: r.source_kind } }))
    .join("\n");
}
