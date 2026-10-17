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