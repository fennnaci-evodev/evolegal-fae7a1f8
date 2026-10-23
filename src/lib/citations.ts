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
  /\b(?:Section|section)\s+(\d+[A-Z]?(?:\([\w]+\))*)\s+of\s+the\s+((?:[A-Z][A-Za-z.]*\s+){1,6}(?:Act\s+(?:19|20)\d{2}|(?:\(UCC\)|UCC)))/g,
  // Companies Act 2006 s. 172 / section 172 / s172(1)
  /\b((?:[A-Z][a-z]+(?:\s+(?:and|of|the|for|\(?[A-Z][a-z]+\)?))*\s+)?Act\s+(?:19|20)\d{2})(?:,?\s*(?:s\.?|ss\.?|section|§)\s*\d+[A-Z]?(?:\(\d+\))*)?/g,
  // NY UCC § 2-207, N.Y. Gen. Oblig. Law § 5-1401, NY Real Property Law § 235-b
  /\b((?:N\.?Y\.?|New York)\s+(?:[A-Z][A-Za-z.]*\s+){0,4}(?:Law|UCC|Code))\s*§+\s*[\d-]+[a-z]?(?:\(\w+\))*/g,
  /\b(UCC)\s*§+\s*\d+-\d+/g,
];

const LEAD = /^(?:(?:See|Under|Per|In|The|Also|And|Of|By|Section)\s+)+/;

export function extractCitations(text: string): Citation[] {
  const seen = new Map<string, Citation>();
  for (const re of PATTERNS) {
    for (const m of text.matchAll(re)) {
      if (re === PATTERNS[0]) {
        const act = m[2].includes("UCC") ? "NY UCC" : m[2];
        const label = `${act} ${act.includes("UCC") ? "§" : "s."} ${m[1]}`;
        seen.set(label.toLowerCase(), { label, act });
        continue;
      }
      const label = m[0].replace(/\s+/g, " ").trim().replace(LEAD, "");
      const act = m[1].replace(/\s+/g, " ").trim().replace(LEAD, "");
      if ([...seen.keys()].some(k => k.includes(label.toLowerCase()))) continue;
      if (label.length < 6 || seen.has(label.toLowerCase())) continue;
      seen.set(label.toLowerCase(), { label, act });
    }
  }
  return [...seen.values()].slice(0, 8);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Fail closed: a reviewed Act does not verify every section of that Act. */
export function matchSource(c: Citation, sources: VerifiedSource[]): VerifiedSource | null {
  const section = (s: string) => s.replace(/\b(?:section|s\.)\s*/gi, "section ").replace(/§\s*/g, "section ");
  const key = norm(section(c.label));
  const matches = sources.filter(s => s.reviewed_at && norm(section(s.title)) === key &&
    (/\b(?:NY|N\.Y\.|New York)\b/i.test(c.act) ? /new york|\bny\b/i.test(s.jurisdiction) :
      c.act.includes("Act") ? /england|united kingdom|\buk\b/i.test(s.jurisdiction) : false));
  return matches.length === 1 ? matches[0] : null;
}
