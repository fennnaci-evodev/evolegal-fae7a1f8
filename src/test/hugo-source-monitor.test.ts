import { describe, it, expect } from "vitest";
import { extractMonitoredText, countUnappliedEffects, dataXmlUrl } from "../../supabase/functions/hugo-source-monitor/monitor";
describe("Official source monitoring", () => {
  it("uses the official XML address", () => expect(dataXmlUrl("https://www.legislation.gov.uk/ukpga/1977/50/section/3")).toBe("https://www.legislation.gov.uk/ukpga/1977/50/section/3/data.xml"));
  it("rejects internal, insecure and lookalike publisher URLs", () => {
    for (const url of ["http://www.legislation.gov.uk/a", "https://127.0.0.1/a", "https://legislation.gov.uk.evil.com/a", "https://user@legislation.gov.uk/a"]) expect(() => dataXmlUrl(url)).toThrow();
  });
  it("ignores metadata changes", () => {
    const a = '<Legislation><Metadata><dc:modified>2026-01-01</dc:modified></Metadata><Body><P>Text</P></Body></Legislation>';
    const b = a.replace("2026-01-01", "2026-10-17");
    expect(extractMonitoredText(a)).toBe(extractMonitoredText(b));
  });
  it("detects body changes", () => expect(extractMonitoredText("<Body>A</Body>")).not.toBe(extractMonitoredText("<Body>B</Body>")));
  it("counts unapplied amendments", () => expect(countUnappliedEffects("<ukm:UnappliedEffect a='1'/><ukm:UnappliedEffect a='2'/>")).toBe(2));
  it("retains legal text after a self-closing commentary reference", () => expect(extractMonitoredText('<Body><CommentaryRef Ref="x"/><Text>Negligence liability</Text></Body><Commentaries><Commentary>Editorial note</Commentary></Commentaries>')).toBe("Negligence liability"));
  it("rejects pages without an official legal body", () => expect(extractMonitoredText("<html>Access denied</html>")).toBe(""));
});
