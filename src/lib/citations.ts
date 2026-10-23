/** Statutory reference detection for Hugo replies (UK + New York). */
export interface Citation { label: string; act: string }

export interface VerifiedSource {
  id: string;
  title: string;
  jurisdiction: string;
  source_url: string;
  excerpt: string;
  reviewed_at: string | null;
  effective_from: string;
}

const PATTERNS: RegExp[] = [
  // Companies Act 2006 s. 172 / section 172 / s172(1)
  /\b((?:[A-Z][a-z]+(?:\s+(?:and|of|the|for|\(?[A-Z][a-z]+\)?))*\s+)?Act\s+(?:19|20)\d{2})(?:,?\s*(?:s\.?|ss\.?|section|§)\s*\d+[A-Z]?(?:\(\d+\))*)?/g,
  // NY UCC § 2-207, N.Y. Gen. Oblig. Law § 5-1401, NY Real Property Law § 235-b
  /\b((?:N\.?Y\.?|New York)\s+(?:[A-Z][A-Za-z.]*\s+){1,4}(?:Law|UCC|Code))\s*§+\s*[\d-]+[a-z]?(?:\(\w+\))*/g,
  /\b(UCC)\s*§+\s*\d+-\d+/g,
];

export function extractCitations(text: string): Citation[] {
  const seen = new Map<string, Citation>();
  for (const re of PATTERNS) {
    for (const m of text.matchAll(re)) {
      const label = m[0].replace(/\s+/g, " ").trim();
      const act = m[1].replace(/\s+/g, " ").trim();
      if (label.length < 6 || seen.has(label.toLowerCase())) continue;
      seen.set(label.toLowerCase(), { label, act });
    }
  }
  return [...seen.values()].slice(0, 8);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** A citation counts as verified only when an approved source title contains its Act name. */
export function matchSource(c: Citation, sources: VerifiedSource[]): VerifiedSource | null {
  const act = norm(c.act);
  return sources.find(s => norm(s.title).includes(act)) ?? null;
}
