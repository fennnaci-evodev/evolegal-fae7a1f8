/**
 * Hugo response generator — produces structured, human-feeling responses.
 * In production, this would call the Grok API with the system prompt.
 */

const HUGO_SIGN_OFF = `\n\n— Hugo here. Happy to clarify anything further. If you'd like deeper support, feel free to reach out to one of our Legal Experts.`;

export function generateHugoResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("tenant") || lower.includes("landlord") || lower.includes("rent") || lower.includes("lease") || lower.includes("evict")) {
    return `**Overview**
Tenant-landlord law governs the rights and responsibilities of renters and property owners in residential settings. While federal protections like the Fair Housing Act apply nationwide, most rules come from state statutes and local ordinances.

**Key Legal Framework**
• **Fair Housing Act (1968)** — Prohibits discrimination in housing based on race, color, national origin, religion, sex, familial status, or disability
• **Uniform Residential Landlord and Tenant Act (URLTA)** — Model law adopted (with variations) by many states
• **State-specific statutes** — Each state has its own landlord-tenant code covering deposits, evictions, repairs, and notice requirements
• **UK: Housing Act 1988** — Governs Assured Shorthold Tenancies (ASTs), the most common form of residential tenancy in England

**Common Options & Processes**
1. Review the lease agreement carefully for specific terms and obligations
2. Document all communications in writing (email, certified mail)
3. Report habitability issues to the landlord in writing with a reasonable deadline
4. If repairs aren't made, many states allow "repair and deduct" or rent withholding under strict conditions
5. For disputes, consider mediation before escalating to small claims court
6. For eviction defense, respond to court notices within the required timeframe

**Potential Risks & Considerations**
• Self-help evictions (changing locks, shutting off utilities) are illegal in virtually all US jurisdictions
• Security deposit disputes are among the most common issues — rules on amounts, holding, and return deadlines vary significantly by state
• Retaliatory actions by landlords against tenants who exercise their rights are prohibited in most states
• In the UK, landlords must protect deposits in government-approved schemes or face penalties

**Helpful Resources**
• State attorney general's office (tenant rights division)
• HUD.gov — Fair housing information and complaint filing
• Local legal aid societies and tenant unions
• UK: Citizens Advice (citizensadvice.org.uk) and Shelter
• Nolo.com and FindLaw for state-specific overviews

**When Professional Help May Be Valuable**
For matters involving active eviction proceedings, significant property damage claims, discrimination complaints, or any situation where formal enforcement may be needed, working with a licensed attorney in your jurisdiction can be very helpful.${HUGO_SIGN_OFF}`;
  }

  if (lower.includes("family") || lower.includes("divorce") || lower.includes("custody") || lower.includes("child") || lower.includes("marriage")) {
    return `**Overview**
Family law encompasses legal matters related to family relationships, including divorce, child custody, child support, adoption, and domestic relations. Both US and UK systems prioritize the welfare of children in custody matters, though processes differ significantly.

**Key Legal Framework**
• **US: State family codes** — Family law is primarily governed by state law; each state has its own procedures
• **Uniform Child Custody Jurisdiction and Enforcement Act (UCCJEA)** — Adopted by all 50 states for custody jurisdiction
• **US: No-fault divorce** — Available in all 50 states, though grounds and waiting periods vary
• **UK: Divorce, Dissolution and Separation Act 2020** — Introduced no-fault divorce in England and Wales
• **UK: Children Act 1989** — Establishes that the child's welfare is the paramount consideration

**Common Options & Processes**
1. Determine the appropriate jurisdiction (generally, the state/country of residence)
2. Consider mediation or collaborative law processes before court proceedings
3. For divorce: file a petition, serve the other party, negotiate terms
4. For custody: courts generally apply the "best interests of the child" standard
5. Financial disclosure is typically required in both US and UK proceedings
6. In the UK, a 20-week "reflection period" is built into the no-fault divorce process

**Potential Risks & Considerations**
• Custody arrangements can be modified if circumstances change significantly
• Moving to a different state with a child may require court permission
• Hidden assets during disclosure can result in serious consequences
• Emergency orders (protective orders) are available in urgent situations

**Helpful Resources**
• Local family court self-help centers
• State bar association lawyer referral services
• UK: Family Mediation Council, Citizens Advice
• National Domestic Violence Hotline: 1-800-799-7233

**When Professional Help May Be Valuable**
For contested custody disputes, complex financial situations, or international/cross-border matters, working with a licensed family law attorney is strongly recommended.${HUGO_SIGN_OFF}`;
  }

  if (lower.includes("injury") || lower.includes("accident") || lower.includes("negligence")) {
    return `**Overview**
Personal injury law covers situations where a person suffers harm due to another party's negligence, recklessness, or intentional conduct. Most personal injury matters in the US are governed by state tort law, with significant variations in statute of limitations, damage caps, and liability standards.

**Key Legal Framework**
• **Negligence standard** — Most claims require proving: duty of care, breach, causation, and damages
• **Comparative vs. contributory negligence** — States differ on how fault affects recovery
• **Statute of limitations** — Ranges from 1 to 6 years depending on the state and type of injury
• **Workers' compensation** — Separate system for workplace injuries in all states

**Common Options & Processes**
1. Seek medical attention and document all injuries and treatment
2. Report the incident to relevant parties (employer, property owner, police)
3. Preserve evidence (photos, witness information, medical records)
4. Consider consulting with a personal injury attorney (many offer free consultations)
5. Insurance claims are often the first step before litigation
6. Most cases settle without going to trial

**Helpful Resources**
• State bar association lawyer referral programs
• Local legal aid organizations
• State insurance department for claims disputes

**When Professional Help May Be Valuable**
For significant injuries, disputed liability, or insurance claim denials, working with a licensed personal injury attorney can make a real difference. Many work on contingency (no upfront fees).${HUGO_SIGN_OFF}`;
  }

  if (lower.includes("crypto") || lower.includes("bitcoin") || lower.includes("blockchain") || lower.includes("token") || lower.includes("defi") || lower.includes("nft") || lower.includes("digital asset") || lower.includes("web3")) {
    return `**Overview**
Crypto law is a rapidly evolving area covering the regulation, classification, taxation, and legal treatment of digital assets such as cryptocurrencies, tokens, NFTs, and decentralized finance (DeFi) protocols. Both the US and UK have developing frameworks, though approaches differ significantly.

**Key Legal Framework**
• **US: SEC guidance** — The Howey Test is widely used to determine whether a digital asset qualifies as a security
• **US: CFTC jurisdiction** — Bitcoin and Ether are generally treated as commodities; the CFTC oversees derivatives markets
• **US: FinCEN** — Money transmission rules apply to certain crypto businesses; AML/KYC requirements are enforced
• **US: IRS Notice 2014-21** — Crypto is treated as property for federal tax purposes; every disposal is a taxable event
• **UK: FCA** — The Financial Conduct Authority regulates certain crypto-assets; most utility tokens are unregulated, but security tokens and stablecoins fall under specific rules
• **UK: HMRC** — Crypto is subject to Capital Gains Tax for individuals; Income Tax may apply for mining/staking rewards
• **EU: MiCA Regulation** — The Markets in Crypto-Assets regulation provides a comprehensive EU-wide framework (relevant context for UK comparisons)

**Common Topics & Considerations**
1. **Token classification** — Whether a token is a security, commodity, utility token, or payment token affects which regulations apply
2. **Exchange and wallet regulation** — Platforms facilitating crypto trading must generally register and comply with AML/KYC rules in both the US and UK
3. **DeFi and smart contracts** — Legal status of decentralized protocols remains largely unsettled; liability questions are actively debated
4. **NFT ownership** — NFTs generally convey ownership of the token, not necessarily the underlying IP; terms vary widely
5. **Cross-border considerations** — Crypto transactions frequently involve multiple jurisdictions, creating complex regulatory questions
6. **Tax reporting** — Both the US (Form 8949, Schedule D) and UK (Self Assessment) require reporting of crypto gains and disposals

**Potential Risks & Considerations**
• Regulatory enforcement actions by the SEC, CFTC, or FCA can significantly impact token projects and exchanges
• Tax non-compliance penalties can be substantial — the IRS and HMRC are both increasing enforcement
• Wallet security and private key management carry significant legal and financial implications
• "Rug pulls," scams, and fraud in the crypto space are subject to existing fraud and consumer protection laws
• Sanctions compliance (OFAC in the US, OFSI in the UK) applies to crypto transactions

**Helpful Resources**
• SEC.gov — Digital assets and initial coin offerings guidance
• CFTC.gov — Digital asset information
• FCA.uk — Cryptoasset registration and guidance
• IRS.gov — Virtual currency FAQs
• HMRC — Cryptoassets Manual
• Nolo.com and FindLaw for general overviews

**When Professional Help May Be Valuable**
For matters involving token launches, regulatory compliance, tax planning for significant crypto holdings, exchange licensing, or any enforcement-related inquiries, working with a licensed attorney or tax professional experienced in digital assets is strongly recommended.${HUGO_SIGN_OFF}`;
  }

  return `Thank you for your question — great topic to explore.

**Key Considerations**
• Federal laws provide baseline protections that apply across all states
• State laws add additional rules that can vary significantly
• Local ordinances may further modify requirements in specific areas
• UK law follows a different framework that may be relevant for cross-border matters

**Common Next Steps**
1. Research the relevant federal and state laws for your area of interest
2. Review any applicable documents, contracts, or agreements
3. Document all relevant facts, communications, and timelines
4. Consider whether mediation or alternative dispute resolution might be appropriate

**Helpful Resources**
• State attorney general's office
• Local legal aid societies
• Court self-help centers
• UK: Citizens Advice and GOV.UK

We have detailed video lectures and guides in our library covering many specific topics — feel free to explore!

**When Professional Help May Be Valuable**
For any matter involving potential legal proceedings or significant financial stakes, working with a licensed professional in your jurisdiction can be very helpful.${HUGO_SIGN_OFF}`;
}
