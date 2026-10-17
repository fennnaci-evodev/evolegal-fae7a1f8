import { describe, it, expect } from "vitest";
import { extractMonitoredText, countUnappliedEffects, dataXmlUrl } from "../../supabase/functions/hugo-source-monitor/monitor";
describe("Official source monitoring", () => {
  it("uses the official XML address", () => expect(dataXmlUrl("https://www.legislation.gov.uk/ukpga/1977/50/section/3")).toBe("https://www.legislation.gov.uk/ukpga/1977/50/section/3/data.xml"));
  it("ignores metadata changes", () => {
    const a = '<Legislation><Metadata><dc:modified>2026-01-01</dc:modified></Metadata><Body><P>Text</P></Body></Legislation>';
    const b = a.replace("2026-01-01", "2026-10-17");
    expect(extractMonitoredText(a)).toBe(extractMonitoredText(b));
  });
  it("detects body changes", () => expect(extractMonitoredText("<Body>A</Body>")).not.toBe(extractMonitoredText("<Body>B</Body>")));
  it("counts unapplied amendments", () => expect(countUnappliedEffects("<ukm:UnappliedEffect a='1'/><ukm:UnappliedEffect a='2'/>")).toBe(2));
});
