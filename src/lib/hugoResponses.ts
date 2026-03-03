/**
 * Hugo response generator — produces natural, conversational responses
 * in the voice of a calm, experienced legal expert who also has a sense of humour.
 * Hugo asks clarifying questions for vague inputs and provides initial helpful context.
 */

const HUGO_CLOSE_VARIANTS = [
  `\n\nIf anything is unclear or you'd like to go deeper into any of this, just let me know — I'm here to help.`,
  `\n\nAnything unclear? Just let me know — happy to clarify or explore further.`,
  `\n\nIf this feels bigger than expected, one of our Managers would be glad to go deeper with you.`,
  `\n\nHappy to keep going on any of this — just say the word.`,
  `\n\nIf you'd like more detailed, hands-on guidance, one of our Managers can dive even further.`,
];

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
  `Hi! I'm Hugo — glad you're here. I cover everything from UK tenancy law to US personal injury to crypto regulation, and I genuinely enjoy untangling these things. What can I help with?`,
];

/* ---------- vague / short input detection ---------- */
const VAGUE_TENANT_PATTERNS = [
  /^(landlord|tenant|rent|lease|evict\w*|housing)\s*(issues?|problems?|help|questions?|law|rights?)?\s*[?.!]*$/i,
  /^(my )?(landlord|tenant)\s*$/i,
];

const VAGUE_FAMILY_PATTERNS = [
  /^(divorce|custody|family|marriage|child\s*support)\s*(law|issues?|help|questions?|rights?)?\s*[?.!]*$/i,
  /^(getting|want(ing)?|need) (a )?divorce\s*$/i,
];

const VAGUE_CRYPTO_PATTERNS = [
  /^(crypto|bitcoin|blockchain|token|nft|defi|web3)\s*(law|tax(es)?|rules?|regulation|issues?|help|questions?)?\s*[?.!]*$/i,
  /^(what about|how about|tell me about) crypto\s*(tax(es)?|law|regulation)?\s*[?.!]*$/i,
];

const VAGUE_INJURY_PATTERNS = [
  /^(injury|accident|negligence|personal injury)\s*(claim|law|help|questions?)?\s*[?.!]*$/i,
];

const VAGUE_GENERIC_PATTERNS = [
  /^(help|question|legal|law|advice|issue|problem)\s*[?.!]*$/i,
  /^(i need|i have|i want|i got) (help|a question|an issue|a problem)\s*[?.!]*$/i,
  /^(can you help|what can you do|what do you know)\s*[?.!]*$/i,
];

function isFunQuestion(text: string): boolean {
  return FUN_PATTERNS.some((p) => p.test(text));
}

function isGreeting(text: string): boolean {
  return GREETING_PATTERNS.some((p) => p.test(text.trim()));
}

function isVague(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text.trim()));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hugoClose(): string {
  return pickRandom(HUGO_CLOSE_VARIANTS);
}

export function generateHugoResponse(input: string): string {
  const lower = input.toLowerCase();
  const trimmed = input.trim();

  /* greetings */
  if (isGreeting(trimmed)) {
    return pickRandom(GREETING_RESPONSES);
  }

  /* fun / off-topic */
  if (isFunQuestion(trimmed)) {
    return pickRandom(FUN_RESPONSES);
  }

  /* ---------- vague inputs — ask clarifying questions ---------- */

  if (isVague(trimmed, VAGUE_TENANT_PATTERNS)) {
    return `Landlord-tenant matters come up a lot — I can definitely help you think through the landscape here. The rules can vary quite a bit depending on where you are, so just to make sure I'm focusing on the right area, is this more about a UK situation or something in a particular US state? And what kind of issue are we looking at — eviction, repairs, deposit disputes, rent increases, something else?

Even without those details, I can tell you that both the US and UK have fairly robust tenant protections, though they work quite differently. In England, most residential tenancies fall under Assured Shorthold Tenancies with specific rules around deposits and eviction notices. In the US, it's state-by-state, but concepts like the warranty of habitability and security deposit caps come up everywhere. Happy to go deeper once I know a bit more about your situation.${hugoClose()}`;
  }

  if (isVague(trimmed, VAGUE_FAMILY_PATTERNS)) {
    return `Family law is one of those areas that can feel especially personal and complex, so I want to make sure I'm giving you the most relevant picture. Could you share a bit more about what you're focused on — is it divorce, child custody, financial settlements, or something else? And are we talking about a UK context or a particular US state? That makes a real difference in how things work.

What I can say broadly is that both jurisdictions have moved towards no-fault divorce, which simplifies things considerably. Courts on both sides of the Atlantic prioritise the welfare of children above almost everything else in custody matters, and mediation is increasingly encouraged — and in England often required — before court proceedings begin.${hugoClose()}`;
  }

  if (isVague(trimmed, VAGUE_CRYPTO_PATTERNS)) {
    return `Thanks for asking — crypto law is one of the most fascinating and fast-moving areas right now, and I can see why people have questions. Many people find crypto regulation confusing at first, and honestly, even regulators are still working out the details, so you're not alone.

With crypto matters, it often helps to know whether we're talking about a token, an NFT, a DeFi protocol, stablecoins, or something else — could you share a bit more about what's on your mind? And are you mostly thinking about this in a US context, a UK context, or both? Tax treatment, classification rules, and regulatory frameworks can differ quite a bit between the two.

In the meantime, the big picture is that the US approach centres on whether something qualifies as a security under the Howey Test, while the UK's FCA takes a somewhat different classification approach. Tax-wise, both the IRS and HMRC generally treat crypto disposals as taxable events, though the specifics vary.${hugoClose()}`;
  }

  if (isVague(trimmed, VAGUE_INJURY_PATTERNS)) {
    return `Personal injury is an area where understanding the basics can really help you feel more confident about what's going on. To point you in the most useful direction, could you tell me a bit more about what kind of situation you're thinking about — a car accident, workplace injury, medical issue, slip-and-fall, or something else? And is there a particular timeframe or event you're focused on? That can make a big difference in how things are viewed, especially when it comes to limitation periods.

What I can tell you generally is that most personal injury claims in the US are built on negligence — duty of care, breach, causation, and damages. Statutes of limitations vary by state, typically ranging from one to six years, so timing always matters.${hugoClose()}`;
  }

  if (isVague(trimmed, VAGUE_GENERIC_PATTERNS)) {
    return `I'm glad you're here — I cover a pretty wide range of legal topics and I'm happy to help however I can. To get us started in the right direction, could you give me a sense of what area you're curious about? I work across tenant-landlord law, family and divorce matters, personal injury, contract disputes, employment issues, crypto regulation, and quite a bit more.

If you've got a specific question, go ahead and fire away. If it's more of a general "where do I even start" situation, that's perfectly fine too — we can work through it together.${hugoClose()}`;
  }

  /* ---------- substantive topic responses ---------- */

  if (lower.includes("tenant") || lower.includes("landlord") || lower.includes("rent") || lower.includes("lease") || lower.includes("evict")) {
    return `Great question — tenant-landlord law is one of those areas where the rules can vary enormously depending on where you are, so it's always worth understanding the broader landscape before diving into specifics.

In the US, the foundation starts with the Fair Housing Act, which prohibits discrimination in housing across the board. Beyond that, most of the real substance — things like security deposit limits, eviction procedures, repair obligations, and notice requirements — comes from state-level statutes. Some states follow the Uniform Residential Landlord and Tenant Act as a model, but every state puts its own spin on it. So what's true in California might be quite different from what applies in Texas.

One concept that comes up a lot is the warranty of habitability. In most US jurisdictions, landlords have a legal obligation to maintain livable conditions — working plumbing, heat, structural integrity, that sort of thing. If they fail to do that, many states allow tenants to take steps like "repair and deduct" or, in some cases, withhold rent until the issue is resolved. That said, these remedies usually come with strict procedural requirements, so it's important to follow the right steps.

On the UK side, things work a bit differently. Most residential tenancies in England fall under the Housing Act 1988 as Assured Shorthold Tenancies. Landlords there are required to protect deposits in government-approved schemes — failure to do so can result in penalties. The eviction process has also been evolving, with ongoing reforms around Section 21 "no-fault" evictions.

One thing that's true on both sides of the Atlantic: always put things in writing. Whether it's a repair request, a complaint, or any agreement you reach with your landlord, having a written record makes an enormous difference if things ever escalate. And if you're facing an active eviction, responding to court notices within the required timeframe is absolutely critical.${hugoClose()}`;
  }

  if (lower.includes("family") || lower.includes("divorce") || lower.includes("custody") || lower.includes("child") || lower.includes("marriage")) {
    return `I understand this area can feel especially personal and complex, so let me walk you through the landscape in a way that hopefully makes things feel a bit more manageable.

Family law covers a wide range of matters — divorce, child custody, child support, adoption, and domestic relations more broadly. In both the US and UK, the courts place enormous emphasis on the welfare of children in any custody-related matter, though the specific processes differ quite a bit.

In the US, family law is primarily governed at the state level, which means procedures, waiting periods, and even grounds for divorce can vary. All 50 states now offer no-fault divorce, so you don't necessarily need to prove wrongdoing — though the specifics of property division, spousal support, and custody arrangements will depend on your state's laws. For custody matters, courts generally apply what's known as the "best interests of the child" standard, which considers factors like stability, the child's relationship with each parent, and each parent's ability to provide care.

Over in England and Wales, the Divorce, Dissolution and Separation Act 2020 introduced no-fault divorce, which was a significant modernisation. There's a built-in 20-week reflection period, and the Children Act 1989 establishes that the child's welfare is the paramount consideration in any decision.

One thing I'd strongly encourage in both jurisdictions is exploring mediation early on. In the UK, it's often required before you can begin court proceedings, and in the US, many courts strongly recommend or even mandate it. Mediation tends to be faster, less expensive, and often leads to outcomes that both parties can live with more comfortably than a court-imposed decision.

Financial disclosure is a big part of both US and UK proceedings — being upfront about assets and income is not just expected, it's legally required, and hiding assets can lead to serious consequences.${hugoClose()}`;
  }

  if (lower.includes("injury") || lower.includes("accident") || lower.includes("negligence")) {
    return `Personal injury is one of those areas where understanding the basics can really help you feel more confident about what's going on and what your options might be.

At its core, most personal injury claims in the US are built on the concept of negligence. That means you generally need to show four things: that the other party owed you a duty of care, that they breached that duty, that the breach caused your injury, and that you suffered actual damages as a result. It sounds formal, but in practice it covers a huge range of situations — car accidents, slip-and-falls, medical issues, workplace incidents, and more.

One important wrinkle is how different states handle shared fault. Some states follow "comparative negligence," where your compensation is reduced by your percentage of fault — so if you're found 20% responsible, you'd recover 80% of the damages. A few states still use "contributory negligence," which can bar recovery entirely if you're found even slightly at fault. It's a significant distinction.

Statutes of limitations are another crucial factor. Depending on the state and the type of injury, you might have anywhere from one to six years to file a claim. Missing that window usually means losing the right to pursue it entirely, so timing matters.

From a practical standpoint, the most important things you can do early on are to document everything — photos of the scene, medical records, witness contact information — and to report the incident to the relevant parties, whether that's an employer, a property owner, or law enforcement. Medical attention should always come first, both for your health and because those records become important evidence.

Most personal injury cases actually settle without ever going to trial, and insurance claims are typically the first step in that process. Many attorneys in this area work on a contingency basis, meaning no upfront fees — they only get paid if you recover something.${hugoClose()}`;
  }

  if (lower.includes("crypto") || lower.includes("bitcoin") || lower.includes("blockchain") || lower.includes("token") || lower.includes("defi") || lower.includes("nft") || lower.includes("digital asset") || lower.includes("web3") || lower.includes("stablecoin") || lower.includes("wallet") || lower.includes("mining") || lower.includes("staking")) {
    return `Crypto law is one of the most fascinating and fast-moving areas right now, so I'm glad you're asking about it. Many people find this space confusing at first, and honestly, even regulators are still working out the details — so you're not alone.

Let me give you the big picture. In the US, one of the central questions is how a digital asset gets classified. The SEC uses something called the Howey Test to determine whether a token qualifies as a security — essentially asking whether there's an investment of money in a common enterprise with an expectation of profits derived from the efforts of others. If the answer is yes, a whole set of registration and disclosure requirements kick in. Meanwhile, the CFTC treats assets like Bitcoin and Ether generally as commodities, and they oversee the derivatives markets around them. So right from the start, you've got overlapping regulatory frameworks depending on what the asset actually is and how it's being used.

On the UK side, the Financial Conduct Authority takes a somewhat different approach. The FCA classifies most cryptoassets under the Financial Services and Markets Act, with security tokens falling under existing securities regulation and utility tokens largely sitting outside the regulated perimeter for now. Stablecoins and staking are under active review, and the FCA has been quite active in requiring crypto businesses to register and comply with anti-money laundering and know-your-customer requirements — similar to FinCEN's role in the US.

Tax treatment is another area people often have questions about. In the US, the IRS treats crypto as property, which means every disposal — whether you're selling, trading, or even using crypto to buy something — is potentially a taxable event. In the UK, HMRC takes a similar view, with crypto subject to Capital Gains Tax for individuals, and Income Tax potentially applying to mining or staking rewards.

DeFi and smart contracts raise some genuinely novel questions. The legal status of decentralised protocols is still largely unsettled — who's liable when a smart contract executes as coded but produces an unexpected outcome? Smart contract vulnerabilities, rug pulls, and protocol exploits sit in a grey area between code-is-law philosophy and traditional legal frameworks. NFT ownership is another interesting one — buying an NFT generally gives you ownership of the token itself, but not necessarily the underlying intellectual property. The terms vary widely from project to project.

Cross-border considerations come up constantly in crypto because transactions don't respect national boundaries the way traditional finance does. That creates complex questions around which jurisdiction's rules apply, and sanctions compliance — through OFAC in the US and OFSI in the UK — adds another layer. Wallet security also intersects with legal responsibility in interesting ways — the question of who bears the loss when private keys are compromised or when exchanges fail is still evolving.${hugoClose()}`;
  }

  if (lower.includes("contract") || lower.includes("agreement") || lower.includes("breach")) {
    return `Contract law is one of the foundational areas of legal practice, and the principles are surprisingly consistent across many jurisdictions, even though the details can differ meaningfully between the US and UK.

At the core, a valid contract generally requires an offer, acceptance, consideration (something of value exchanged), and an intention to create legal relations. In England, that last element is particularly important — social and domestic agreements are presumed not to create legal obligations unless there's clear evidence otherwise.

When things go wrong, the concept of breach comes into play. A material breach — one that goes to the heart of the agreement — typically allows the non-breaching party to terminate and seek damages. A minor breach might entitle you to damages but not necessarily to walk away from the deal. The distinction matters quite a bit in practice.

Just to make sure I'm giving you the most useful insight — are you mostly thinking about this in a US context, or does it involve UK rules too? And is there a particular type of contract or situation you have in mind? Employment agreements, commercial contracts, and consumer contracts can each have their own specific rules layered on top of the general principles.${hugoClose()}`;
  }

  if (lower.includes("employ") || lower.includes("work") || lower.includes("fired") || lower.includes("dismissal") || lower.includes("redundan")) {
    return `Employment law is an area that touches nearly everyone at some point, and the frameworks in the US and UK are quite different in their underlying philosophy.

In the US, most employment relationships are "at-will," which means either party can end the relationship at any time for any reason — or no reason at all — as long as it's not for a prohibited reason like discrimination. Federal laws like Title VII, the Americans with Disabilities Act, and the Fair Labor Standards Act set important baselines, but individual states often add their own protections on top.

The UK takes a fundamentally different approach. Employees there have statutory protections against unfair dismissal after a qualifying period, and employers generally need to follow fair procedures when ending someone's employment. The Employment Rights Act 1996 is the primary statute, and employment tribunals handle disputes.

I can see why this area feels complex — there's a lot of nuance depending on the specific circumstances. Could you share a bit more about what's on your mind? Whether it's a termination, workplace dispute, contract question, or something else, that context helps me give you a clearer picture.${hugoClose()}`;
  }

  /* ---------- catch-all with clarifying questions ---------- */
  return `Thanks for bringing that up — I'd love to help you think through this. I can see there's something on your mind, and to make sure I give you the most useful insight, could you share a bit more about the specifics? A couple of things that would help me focus: what area of law are we looking at — tenant-landlord, family, personal injury, crypto, contracts, employment, or something else entirely? And is this primarily a US or UK situation, or does it involve both?

Even in general terms, most legal questions benefit from understanding which jurisdiction's rules apply and what the key facts are. The frameworks in the US and UK can overlap in philosophy but diverge quite a bit in the details — and that's doubly true for newer areas like crypto regulation, where the rules are still actively being shaped.

In the meantime, we've got some detailed guides and video lectures in our library that cover many specific topics in depth — definitely worth exploring if you want to build a stronger foundation while we narrow things down.${hugoClose()}`;
}
