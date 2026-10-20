import type { ContractRiskAnalysis, ContractSection } from "./contractRisk";
import { riskDisclaimer, riskLabels } from "./contractRisk";

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

export function exportRiskReport(analysis: ContractRiskAnalysis, sections: ContractSection[]) {
  const tokens = getComputedStyle(document.documentElement);
  const primary = tokens.getPropertyValue("--primary").trim();
  const foreground = tokens.getPropertyValue("--foreground").trim();
  const background = tokens.getPropertyValue("--background").trim();
  const border = tokens.getPropertyValue("--border").trim();
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>EvoLegal — Contract Risk Report</title><style>
    body{font:15px/1.7 system-ui,sans-serif;max-width:800px;margin:40px auto;padding:24px;color:hsl(${foreground});background:hsl(${background})}h1,h2{line-height:1.3}header{border-bottom:2px solid hsl(${primary});padding-bottom:20px}article{break-inside:avoid;border-top:1px solid hsl(${border});padding:16px 0}small{opacity:.7}blockquote{margin:12px 0;padding-left:16px;border-left:2px solid hsl(${primary})}svg{vertical-align:middle;margin-right:10px;fill:hsl(${primary})}@media print{body{margin:0;max-width:none}h2{break-after:avoid}@page{size:A4;margin:20mm}}
    </style><header><svg width="26" height="32" viewBox="0 0 26 32" aria-label="EvoLegal E"><g transform="translate(7 2) skewX(-33)"><path d="M0 0h18v5H5v7h11v5H5v8h13v5H0z"/></g></svg><strong>EvoLegal</strong><h1>Contract Risk Analysis</h1><small>Illustrative report · Master Services Agreement</small></header>
    <h2>1. Overview</h2><p>${escapeHtml(analysis.summary)}</p>
    <h2>2. Risk Summary</h2><p>${analysis.overall_risk_score}/100 · ${escapeHtml(analysis.risk_level)} · Sample score, not validated.</p>
    <h2>3. Clause Findings</h2>${analysis.clauses.map(c => `<article><h3>${escapeHtml(c.title)} — ${riskLabels[c.severity]} (${c.risk_score}/100)</h3><p>${escapeHtml(c.explanation)}</p></article>`).join("")}
    <h2>4. Original Text</h2>${sections.filter(s => analysis.clauses.some(c => c.title === s.title)).map(s => `<article><h3>${escapeHtml(s.title)}</h3><blockquote>${escapeHtml(s.text)}</blockquote></article>`).join("")}
    <h2>5. Illustrative Baselines</h2>${sections.filter(s => analysis.clauses.some(c => c.title === s.title)).map(s => `<article><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.baseline)}</p></article>`).join("")}
    <h2>6. Limitations & Review</h2><p>${escapeHtml(riskDisclaimer)}</p><p>No jurisdiction-specific enforceability assessment or official-source verification has been performed.</p>
    <h2>7. Report Date</h2><p>${new Date().toISOString().slice(0, 10)}</p><footer><small>EvoLegal · Informational sample · Not legal advice</small></footer></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "EvoLegal-Contract-Risk-Report.html";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}