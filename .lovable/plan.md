# Pricing and Copy Consistency Fix

## Goal
Make every public and in-app explanation agree on EvoLegal’s plans, limits, response expectations, positioning, and Hugo naming without weakening legal safeguards.

## Plan
1. **Establish one canonical offer**
   - Use Free **$0**, Basic **$24/month**, Pro **$59/month**, and Premium **$99/month**.
   - Keep precise-analysis limits at **2/day**, **15/day**, **60/day**, and **unlimited** respectively.
   - Keep general Hugo chat unlimited across all plans.
   - Keep expert-review expectations at **about 8 hours for Basic** and **about 4 hours for Pro**, subject to complexity; describe Premium as highest priority without inventing a guaranteed time.

2. **Align pricing everywhere**
   - Replace the outdated three-plan home-page cards with the same four plans and limits shown on the pricing page.
   - Remove unsupported or ambiguous benefits such as unspecified document quotas, unlimited submissions, and unavailable portal promises.
   - Correct the credit-pack value badge so it marks the pack with the lowest per-credit price.
   - Correct the annual Pro calculation or omit it where no matching annual purchase option exists.

3. **Align product language**
   - Standardize Hugo’s visible identity as **Hugo Co-Pilot** / **Analysis Co-Pilot** rather than “Expert Manager.”
   - Keep primary audit and launcher actions consistent with their destination and purpose.
   - Replace absolute review claims such as “validates accuracy and completeness” with accurate quality-assurance language.
   - Preserve the approved Precision Contract Intelligence headline, supplied starter prompts, US/English-law scope, and required informational-use disclaimers.

4. **Validate the result**
   - Search the full project for old prices, quotas, plan descriptions, turnaround wording, and legacy Hugo labels.
   - Verify the home page and pricing page at the current mobile viewport and desktop size.
   - Confirm the automated build reports no errors.

## Technical scope
- Consolidate duplicated plan data into a shared frontend pricing definition so the home and pricing pages cannot drift again.
- Update only presentation copy and existing entitlement constants; no checkout, payment, authentication, or backend schema changes.
