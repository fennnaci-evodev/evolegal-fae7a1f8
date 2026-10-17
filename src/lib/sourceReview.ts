import { diffWordsWithSpace } from "diff";

export const REVIEW_CHECKS = [
  { key: "provenance", label: "Official provenance and provision verified" },
  { key: "scope", label: "Jurisdiction, territorial extent and topic verified" },
  { key: "commencement", label: "Commencement and effective dates verified" },
  { key: "amendments", label: "Unapplied amendments and transitional rules assessed" },
  { key: "impact", label: "Legal impact and reviewed excerpt verified" },
] as const;
export type ReviewChecks = Record<(typeof REVIEW_CHECKS)[number]["key"], boolean>;
export const emptyChecks = (): ReviewChecks => ({ provenance: false, scope: false, commencement: false, amendments: false, impact: false });
export function canApproveSource(checks: ReviewChecks, excerpt: string, notes: string, hash: string | null, due: string, now: number = Date.now()) {
  return REVIEW_CHECKS.every(({ key }) => checks[key]) && Boolean(excerpt.trim())
    && !excerpt.trim().startsWith("Pending reviewer") && Boolean(notes.trim()) && Boolean(hash)
    && Date.parse(due) > now;
}
export function sourceDiff(before: string, after: string) {
  return diffWordsWithSpace(before, after);
}
/** Collapse whitespace so verbatim comparison ignores line wrapping only. */
export const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();
/** Anti-hallucination rule: a reviewed excerpt must be copied word-for-word from the official text. */
export function isVerbatimExcerpt(excerpt: string, officialText: string | null) {
  const e = normalizeText(excerpt);
  return Boolean(e && officialText) && normalizeText(officialText ?? "").includes(e);
}
export const suggestReviewDue = (now: number = Date.now(), days = 90) => new Date(now + days * 86400000).toISOString().slice(0, 10);
/** Plain-language list of what still blocks approval. */
export function missingRequirements(input: { checks: ReviewChecks; excerpt: string; officialText: string | null; notes: string; hash: string | null; from: string; until: string; due: string; jurisdiction: string; topic: string }, now: number = Date.now()) {
  const m: string[] = [];
  if (!input.hash || !normalizeText(input.officialText ?? "")) m.push("Fetch the official text");
  if (!isVerbatimExcerpt(input.excerpt, input.officialText)) m.push("Excerpt must be copied exactly from the official text");
  if (!input.jurisdiction.trim() || !input.topic.trim()) m.push("Set jurisdiction and topic");
  if (!input.from || Date.parse(input.from) > now) m.push("Effective-from date must be today or earlier");
  if (input.until && Date.parse(input.until) <= now) m.push("Effective-until date must be in the future");
  if (!input.due || Date.parse(input.due) <= now) m.push("Next review date must be in the future");
  const open = REVIEW_CHECKS.filter(({ key }) => !input.checks[key]).length;
  if (open) m.push(`Confirm ${open} remaining legal check${open > 1 ? "s" : ""}`);
  if (!input.notes.trim()) m.push("Write the review rationale");
  return m;
}
