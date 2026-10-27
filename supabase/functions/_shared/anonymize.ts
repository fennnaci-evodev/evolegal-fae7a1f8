/** Privacy-first redaction for training curation. Statutory citations are shielded before PII patterns run. */
const CITATIONS: RegExp[] = [
  /\[(?:19|20)\d{2}\]\s+[A-Z][A-Za-z]{1,8}(?:\s+(?:Civ|Crim|Ch|QB|KB|Fam|Comm|Pat|TCC|Admin))?\s+\d{1,5}/g, // [2019] UKSC 5
  /\b(?:\d{1,4}\s+)?(?:U\.S\.C\.|C\.F\.R\.|N\.Y\.(?:\s+[A-Z][a-z]*\.)*)\s*§*\s*[\d\-.()a-z]*/g,
  /§+\s*[\d][\w\-.()]*/g,
  /\b[A-Z][A-Za-z()]*(?:\s+(?:[A-Z][A-Za-z()]*|and|of|the|for|to|on|\(\w+\)))*\s+(?:Act|Regulations|Order|Rules|Code|Law)(?:\s+(?:19|20)\d{2})?\b/g,
  /\b(?:s|ss|art|reg|para|sch|r)\.\s?\d+[A-Za-z]?(?:\(\d+\))*(?:\([a-z]\))?/gi,
  /\b(?:Section|Sections|Article|Regulation|Schedule|Rule|Part|Clause)\s+\d+[A-Za-z]?(?:\(\d+\))*(?:\([a-z]\))?/g,
  /\b(?:19|20)\d{2}\s+c\.\s?\d+/g,
];
const PII: [RegExp, string][] = [
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]"],
  [/https?:\/\/\S+/gi, "[URL]"],
  [/\b(?:\d{4}[ -]?){3}\d{1,4}\b/g, "[CARD]"],
  [/\b\d{3}-\d{2}-\d{4}\b/g, "[ID_NUMBER]"],
  [/\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/g, "[ID_NUMBER]"],
  [/(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,5}\)[\s.-]?)?\d{2,5}(?:[\s.-]\d{2,5}){1,4}/g, "[PHONE]"],
  [/\b\d{1,5}[A-Za-z]?\s+(?:[A-Z][a-z]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Boulevard|Blvd|Drive|Dr|Close|Way|Place|Pl|Court|Ct|Square|Terrace|Crescent)\b\.?(?:,?\s*(?:Apt|Suite|Flat|Unit)\.?\s*\w+)?/g, "[ADDRESS]"],
  [/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g, "[POSTCODE]"],
  [/\b(?:Mr|Mrs|Ms|Miss|Dr|Prof|Sir|Dame|Lord|Lady)\.?\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?/g, "[NAME]"],
  [/\b((?:my name is|I am|I'm|this is|signed by|regards,|sincerely,|landlord is|tenant is|employer is|client is)\s+)[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){0,2}/gi, "$1[NAME]"],
];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function anonymize(text: string, knownNames: string[] = []): { text: string; redactions: number } {
  const shield: string[] = [];
  let out = text;
  for (const re of CITATIONS) out = out.replace(re, (m) => `\u0000${shield.push(m) - 1}\u0000`);
  let count = 0;
  const names = knownNames.map((n) => n.trim()).filter((n) => n.length >= 2);
  for (const n of names) out = out.replace(new RegExp(`\\b${esc(n)}\\b`, "gi"), () => { count++; return "[NAME]"; });
  for (const [re, rep] of PII) {
    out = out.replace(re, (...args) => {
      const m = args[0] as string;
      if (rep === "[PHONE]" && m.replace(/\D/g, "").length < 9) return m;
      count++;
      return rep.startsWith("$1") ? `${args[1]}[NAME]` : rep;
    });
  }
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => shield[Number(i)]);
  return { text: out, redactions: count };
}
