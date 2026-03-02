/**
 * Hugo response generator — produces natural, conversational responses
 * in the voice of a calm, experienced legal expert who also has a sense of humour.
 */

const HUGO_CLOSE = `\n\nIf anything is unclear or you'd like to go deeper into any of this, just let me know — I'm here to help. And if you ever want more detailed, hands-on guidance, one of our Managers can dive even further.`;

/* ---------- off-topic / fun detection ---------- */
const FUN_PATTERNS = [
  /joke/i, /funny/i, /laugh/i, /haha/i, /lol/i, /tell me something (fun|interesting|random)/i,
  /knock knock/i, /what do you think about (pizza|cats|dogs|beer|coffee|football|soccer|weather)/i,
  /are you (real|human|robot|ai|alive)/i, /do you (sleep|eat|dream|have feelings)/i,
  /meaning of life/i, /favorite (movie|song|book|food|colour|color)/i,
  /who would win/i, /can you sing/i, /tell me a story/i, /bored/i,
];

const FUN_RESPONSES = [
  `Ha — you know, if I weren't so busy reading case law, I'd probably have a great stand-up career. But between you and me, my real talent is making complex legal concepts feel approachable. Got a legal topic on your mind? I'd love to dig into it with you.`,
  `I appreciate the lighter side of conversation — honestly, it keeps me sharp. That said, I'm at my absolute best when we're working through something that actually matters to you. Tenant questions, crypto regulations, family law — throw anything at me and I'll give you the clearest picture I can.`,
  `You know, I could probably tell you a decent joke, but I think you'd get a lot more value if I helped you untangle something that's been on your mind legally. What do you say — anything you've been curious about?`,
  `I like the energy! But I'll be honest, my comedy material is mostly contract clauses and statutory interpretation — niche audience, let's say. What I'm genuinely good at is making legal topics feel clear and manageable. Want to try me?`,
  `That made me smile. I'm happy to chat, but I'm really in my element when we're exploring legal questions together. Got something on your mind? Big or small, I'm here for it.`,
];

const GREETING_PATTERNS = [
  /^(hi|hello|hey|howdy|yo|sup|good (morning|afternoon|evening))[\s!?.]*$/i,
  /^what'?s up/i, /^how are you/i, /^nice to meet you/i,
];

const GREETING_RESPONSES = [
  `Hey there! Great to see you. I'm Hugo, your Expert Manager here at EvoLegal. I'm ready whenever you are — feel free to ask me about any legal topic, from tenant rights to crypto regulations, family law, personal injury, or anything else. What's on your mind?`,
  `Hello! Welcome — I'm Hugo. Whether you've got a quick question or something more involved, I'm here to walk you through it clearly and thoroughly. What would you like to explore today?`,
];

function isFunQuestion(text: string): boolean {
  return FUN_PATTERNS.some((p) => p.test(text));
}

function isGreeting(text: string): boolean {
  return GREETING_PATTERNS.some((p) => p.test(text.trim()));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateHugoResponse(input: string): string {
  const lower = input.toLowerCase();

  /* greetings */
  if (isGreeting(input)) {
    return pickRandom(GREETING_RESPONSES);
  }

  /* fun / off-topic */
  if (isFunQuestion(input)) {
    return pickRandom(FUN_RESPONSES);
  }

  if (lower.includes("tenant") || lower.includes("landlord") || lower.includes("rent") || lower.includes("lease") || lower.includes("evict")) {
    return `Great question — tenant-landlord law is one of those areas where the rules can vary enormously depending on where you are, so it's always worth understanding the broader landscape before diving into specifics.

In the US, the foundation starts with the Fair Housing Act, which prohibits discrimination in housing across the board. Beyond that, most of the real substance — things like security deposit limits, eviction procedures, repair obligations, and notice requirements — comes from state-level statutes. Some states follow the Uniform Residential Landlord and Tenant Act as a model, but every state puts its own spin on it. So what's true in California might be quite different from what applies in Texas.

One concept that comes up a lot is the warranty of habitability. In most US jurisdictions, landlords have a legal obligation to maintain livable conditions — working plumbing, heat, structural integrity, that sort of thing. If they fail to do that, many states allow tenants to take steps like "repair and deduct" or, in some cases, withhold rent until the issue is resolved. That said, these remedies usually come with strict procedural requirements, so it's important to follow the right steps.

On the UK side, things work a bit differently. Most residential tenancies in England fall under the Housing Act 1988 as Assured Shorthold Tenancies. Landlords there are required to protect deposits in government-approved schemes — failure to do so can result in penalties. The eviction process has also been evolving, with ongoing reforms around Section 21 "no-fault" evictions.

One thing that's true on both sides of the Atlantic: always put things in writing. Whether it's a repair request, a complaint, or any agreement you reach with your landlord, having a written record makes an enormous difference if things ever escalate. And if you're facing an active eviction, responding to court notices within the required timeframe is absolutely critical.

For US resources, your state attorney general's office and local legal aid societies are great starting points. In the UK, Citizens Advice and Shelter are excellent. HUD.gov is also useful for anything related to fair housing.${HUGO_CLOSE}`;
  }

  if (lower.includes("family") || lower.includes("divorce") || lower.includes("custody") || lower.includes("child") || lower.includes("marriage")) {
    return `I understand this area can feel especially personal and complex, so let me walk you through the landscape in a way that hopefully makes things feel a bit more manageable.

Family law covers a wide range of matters — divorce, child custody, child support, adoption, and domestic relations more broadly. In both the US and UK, the courts place enormous emphasis on the welfare of children in any custody-related matter, though the specific processes differ quite a bit.

In the US, family law is primarily governed at the state level, which means procedures, waiting periods, and even grounds for divorce can vary. The good news is that all 50 states now offer no-fault divorce, so you don't necessarily need to prove wrongdoing — though the specifics of property division, spousal support, and custody arrangements will depend on your state's laws. For custody matters, courts generally apply what's known as the "best interests of the child" standard, which considers factors like stability, the child's relationship with each parent, and each parent's ability to provide care.

Over in England and Wales, the Divorce, Dissolution and Separation Act 2020 introduced no-fault divorce, which was a significant modernisation. There's a built-in 20-week reflection period, and the Children Act 1989 establishes that the child's welfare is the paramount consideration in any decision.

One thing I'd strongly encourage in both jurisdictions is exploring mediation early on. In the UK, it's often required before you can begin court proceedings, and in the US, many courts strongly recommend or even mandate it. Mediation tends to be faster, less expensive, and often leads to outcomes that both parties can live with more comfortably than a court-imposed decision.

Financial disclosure is a big part of both US and UK proceedings — being upfront about assets and income is not just expected, it's legally required, and hiding assets can lead to serious consequences. If there's any urgency or safety concern, emergency protective orders are available in both systems.

For support, local family court self-help centres can be incredibly helpful, and in the UK, the Family Mediation Council and Citizens Advice are great resources. If you're in a situation involving domestic violence, the National Domestic Violence Hotline (1-800-799-7233) is always available.${HUGO_CLOSE}`;
  }

  if (lower.includes("injury") || lower.includes("accident") || lower.includes("negligence")) {
    return `Personal injury is one of those areas where understanding the basics can really help you feel more confident about what's going on and what your options might be.

At its core, most personal injury claims in the US are built on the concept of negligence. That means you generally need to show four things: that the other party owed you a duty of care, that they breached that duty, that the breach caused your injury, and that you suffered actual damages as a result. It sounds formal, but in practice it covers a huge range of situations — car accidents, slip-and-falls, medical issues, workplace incidents, and more.

One important wrinkle is how different states handle shared fault. Some states follow "comparative negligence," where your compensation is reduced by your percentage of fault — so if you're found 20% responsible, you'd recover 80% of the damages. A few states still use "contributory negligence," which can bar recovery entirely if you're found even slightly at fault. It's a significant distinction.

Statutes of limitations are another crucial factor. Depending on the state and the type of injury, you might have anywhere from one to six years to file a claim. Missing that window usually means losing the right to pursue it entirely, so timing matters.

From a practical standpoint, the most important things you can do early on are to document everything — photos of the scene, medical records, witness contact information — and to report the incident to the relevant parties, whether that's an employer, a property owner, or law enforcement. Medical attention should always come first, both for your health and because those records become important evidence.

Most personal injury cases actually settle without ever going to trial, and insurance claims are typically the first step in that process. Many attorneys in this area work on a contingency basis, meaning no upfront fees — they only get paid if you recover something.${HUGO_CLOSE}`;
  }

  if (lower.includes("crypto") || lower.includes("bitcoin") || lower.includes("blockchain") || lower.includes("token") || lower.includes("defi") || lower.includes("nft") || lower.includes("digital asset") || lower.includes("web3")) {
    return `Crypto law is one of the most fascinating and fast-moving areas right now, so I'm glad you're asking about it. Many people find this space confusing at first, and honestly, even regulators are still working out the details — so you're not alone.

Let me give you the big picture. In the US, one of the central questions is how a digital asset gets classified. The SEC uses something called the Howey Test to determine whether a token qualifies as a security — and if it does, a whole set of registration and disclosure requirements kick in. Meanwhile, the CFTC treats assets like Bitcoin and Ether generally as commodities, and they oversee the derivatives markets around them. So right from the start, you've got overlapping regulatory frameworks depending on what the asset actually is and how it's being used.

On the UK side, the Financial Conduct Authority takes a somewhat different approach. Most utility tokens are largely unregulated, but security tokens and certain stablecoins fall under specific rules. The FCA has also been quite active in requiring crypto businesses to register and comply with anti-money laundering and know-your-customer requirements — similar to FinCEN's role in the US.

Tax treatment is another area people often have questions about. In the US, the IRS treats crypto as property, which means every disposal — whether you're selling, trading, or even using crypto to buy something — is potentially a taxable event. You'd report gains on Form 8949 and Schedule D. In the UK, HMRC takes a similar view, with crypto subject to Capital Gains Tax for individuals, and Income Tax potentially applying to mining or staking rewards.

DeFi and smart contracts raise some genuinely novel questions. The legal status of decentralised protocols is still largely unsettled — who's liable when a smart contract executes as coded but produces an unexpected outcome? These are questions the courts and regulators are actively grappling with. NFT ownership is another interesting one — buying an NFT generally gives you ownership of the token itself, but not necessarily the underlying intellectual property. The terms vary widely from project to project.

Cross-border considerations come up constantly in crypto because transactions don't respect national boundaries the way traditional finance does. That creates complex questions around which jurisdiction's rules apply, and sanctions compliance — through OFAC in the US and OFSI in the UK — adds another layer.

For resources, the SEC, CFTC, and FCA all have published guidance on digital assets that's worth reviewing. The IRS virtual currency FAQs and HMRC's Cryptoassets Manual are helpful for tax questions specifically.${HUGO_CLOSE}`;
  }

  return `Thanks for bringing that up — it's a good area to think through carefully.

The legal landscape around most topics tends to work in layers. At the top, you have federal laws that provide baseline protections applying across all states. Below that, state statutes add their own rules, which can vary quite significantly from one place to another. And then local ordinances can modify things even further at the city or county level. If there's a cross-border dimension, UK law follows its own framework, which can be relevant depending on the situation.

As a starting point, I'd suggest looking into the specific federal and state laws that apply to your area of interest. Reviewing any relevant documents, contracts, or agreements is always a good idea, and keeping a clear record of facts, communications, and timelines can make a real difference down the road. It's also worth considering whether mediation or some form of alternative dispute resolution might be appropriate — it's often faster, less expensive, and less stressful than formal proceedings.

We've actually got some detailed video lectures and guides in our library that cover many specific topics in depth — definitely worth exploring if you want to build a stronger foundation.

For more formal resources, your state attorney general's office, local legal aid societies, and court self-help centres are all excellent starting points. In the UK, Citizens Advice and GOV.UK cover a wide range of topics very well.${HUGO_CLOSE}`;
}
