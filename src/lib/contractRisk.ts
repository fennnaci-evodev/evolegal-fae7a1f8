export type ClauseSeverity = "Green" | "Amber" | "Red";

export interface RiskClause {
  title: string;
  risk_score: number;
  severity: ClauseSeverity;
  explanation: string;
}

// Provider boundary: a future analysis service returns this payload unchanged.
export interface ContractRiskAnalysis {
  overall_risk_score: number;
  risk_level: string;
  summary: string;
  clauses: RiskClause[];
}

export interface ContractSection {
  title: string;
  text: string;
  baseline: string;
}

export const sampleAnalysis: ContractRiskAnalysis = {
  overall_risk_score: 72,
  risk_level: "Medium-High",
  summary: "This contract contains several non-standard clauses that increase potential liability.",
  clauses: [
    { title: "Limitation of Liability", risk_score: 85, severity: "Red", explanation: "The sample excludes broad categories of damages without defining an aggregate liability cap or exceptions." },
    { title: "Indemnification", risk_score: 68, severity: "Amber", explanation: "The sample indemnity is one-sided and does not specify notice, defense control, or settlement consent." },
    { title: "Confidentiality", risk_score: 18, severity: "Green", explanation: "The sample contains mutual confidentiality duties and conventional disclosure exceptions." },
    { title: "Payment Terms", risk_score: 22, severity: "Green", explanation: "The sample defines a payment period and a process for disputing invoices." },
    { title: "Insurance Requirements", risk_score: 61, severity: "Amber", explanation: "Coverage is described generically, without policy limits or evidence of insurance." },
    { title: "Force Majeure", risk_score: 15, severity: "Green", explanation: "The sample provides notice and a termination option for prolonged disruption." },
  ],
};

export const sampleSections: ContractSection[] = [
  { title: "Scope of Services", text: "Provider will deliver the services described in a mutually signed statement of work. Any change in scope, fees, or delivery dates will be recorded in writing and agreed by both parties.", baseline: "An illustrative baseline identifies deliverables, acceptance criteria, and a written change-control process." },
  { title: "Term and Termination", text: "This Agreement continues for two years from the Effective Date. Either party may terminate for a material breach that remains uncured thirty days after written notice.", baseline: "An illustrative baseline separates termination for breach from termination for convenience and addresses surviving obligations." },
  { title: "Limitation of Liability", text: "IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES OF ANY KIND, INCLUDING LOST PROFITS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.", baseline: "An illustrative alternative specifies an aggregate cap tied to fees and separately identifies negotiated exceptions. Enforceability depends on the applicable law and facts." },
  { title: "Indemnification", text: "Provider shall indemnify, defend, and hold harmless Client against any claims arising out of Provider’s gross negligence or willful misconduct.", baseline: "An illustrative alternative defines covered third-party claims, notice obligations, control of defense, settlement consent, and proportionate responsibility." },
  { title: "Governing Law", text: "The parties will agree the governing law and forum in the applicable statement of work. Neither is designated in this illustrative agreement.", baseline: "An illustrative baseline names the applicable law and dispute forum explicitly." },
  { title: "Payment Terms", text: "Undisputed invoices are payable within thirty days of receipt. Client may dispute an invoice in writing within fifteen days, identifying the amount and reason; undisputed amounts remain payable.", baseline: "An illustrative baseline identifies invoice timing, the dispute process, and treatment of undisputed amounts." },
  { title: "Insurance Requirements", text: "Provider will maintain commercially reasonable insurance during the term of this Agreement.", baseline: "An illustrative alternative specifies coverage types, negotiated limits, and a process for supplying certificates of insurance." },
  { title: "Confidentiality", text: "Each party will protect the other’s confidential information using reasonable care and use it only to perform this Agreement. Information already public, independently developed, or lawfully received from a third party is excluded. Required disclosures are subject to notice where lawful.", baseline: "An illustrative baseline includes mutual duties, permitted uses, disclosure exceptions, and a defined survival period." },
  { title: "Force Majeure", text: "Neither party is responsible for delay caused by events beyond its reasonable control, excluding payment obligations. The affected party will promptly notify the other and seek to mitigate the impact. Either party may terminate affected services after sixty days of continuing disruption.", baseline: "An illustrative baseline includes notice, mitigation, and a termination option for extended disruption." },
];

export function filterRiskClauses(clauses: RiskClause[], severity: ClauseSeverity | "All", query = "") {
  const search = query.trim().toLowerCase();
  return clauses.filter(clause => (severity === "All" || clause.severity === severity) &&
    `${clause.title} ${clause.explanation}`.toLowerCase().includes(search));
}

export const riskLabels: Record<ClauseSeverity, string> = { Green: "Safe", Amber: "Caution", Red: "High Risk" };

export const riskDisclaimer = "Illustrative sample scores, not a validated legal assessment. Baselines are examples, not market benchmarks. Informational only; not legal advice. Professional review may be appropriate.";