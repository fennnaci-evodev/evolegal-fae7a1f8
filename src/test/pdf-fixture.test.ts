import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { extractDocumentText } from "@/lib/documentParser";
it("keeps repeated governing-law and liability footers from a 4-page PDF", async () => {
  const buf = readFileSync("src/test/fixtures-msa.pdf");
  const { text } = await extractDocumentText(new File([buf], "msa.pdf", { type: "application/pdf" }));
  console.log(JSON.stringify({ gov: (text.match(/governed by the laws of England and Wales/g) || []).length, lol: (text.match(/Limitation of Liability applies/g) || []).length, pages: (text.match(/Page \d of 4/g) || []).length, docusign: (text.match(/DocuSign/g) || []).length, hdr: (text.match(/ACME MSA/g) || []).length }));
  expect(text.match(/This Agreement is governed by the laws of England and Wales/g)).toHaveLength(4);
  expect(text.match(/Limitation of Liability applies as stated in clause 4/g)).toHaveLength(4);
  expect(text).not.toMatch(/Page \d of 4|DocuSign|ACME MSA/);
});
