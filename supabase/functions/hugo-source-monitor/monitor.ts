/** Official machine-readable XML for legislation.gov.uk and Find Case Law pages. */
export function dataXmlUrl(sourceUrl: string): string {
  return sourceUrl.replace(/\/+$/, "") + "/data.xml";
}
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
/** Keeps only the legal body so publisher metadata timestamps do not trigger false changes. */
export function extractMonitoredText(xml: string): string {
  const body = xml.match(/<(?:\w+:)?(?:Body|judgmentBody)\b[^>]*>[\s\S]*?<\/(?:\w+:)?(?:Body|judgmentBody)>/)?.[0] ?? "";
  return decode(body.replace(/<(?:\w+:)?Commentar(?:y|ies)\b[^>]*>[\s\S]*?<\/(?:\w+:)?Commentar(?:y|ies)>/g, " ")
    .replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
/** Publisher-reported amendments not yet incorporated into the displayed text. */
export function countUnappliedEffects(xml: string): number {
  return (xml.match(/<(?:\w+:)?UnappliedEffect[\s>]/g) ?? []).length;
}
