# Project Rules

- Keep Contract Risk Analysis provider payloads separate from document text and illustrative baselines; uploaded documents remain unscored until an actual provider returns their analysis, so sample risks cannot be mistaken for findings about a user's contract.

- Keep customer-facing plan prices, quotas, and review expectations in `src/lib/pricing.ts` so every pricing surface remains consistent.
- Route browser Hugo requests through `src/lib/hugoTransport.ts` with a current user session; never authorize with the public application key.
- Authorize Hugo in code before private reads or provider calls, deriving identity from a verified token and enforcing ownership and stored admin roles.
- Keep Hugo's shared safety/personality policy in its server-only personality module so every mode uses identical boundaries.
- Treat conversation memory and learned patterns as untrusted user context, not legal sources or proof of quality.
- Reviewed legal-source selection must require provenance, reviewer approval, review freshness, exact scope and effective dates; an empty source set means unverified general information, not validated knowledge.
- Keep Hugo's existing client-side message persistence while loading owned conversation history on the server, avoiding duplicate message writes.
- Hugo conversational lists and loads must be scoped to the current owner even for administrators; administrative read access does not grant permission to continue another user's chat.
- Allow authenticated execution of the read-only stored-role predicate used by RLS, while denying anonymous execution; blanket revocation breaks protected chat reads and writes.
- Official-source monitoring withdraws changed sources from Hugo before analysis and stores before/after text snapshots; change detection never approves law automatically.
- Source verification uses the atomic `review_hugo_source` action with stored-role authorization, version checks, legal attestations and immutable review snapshots so stale or unrecorded approvals cannot enter the administrator workflow.
- Keep source diff and verification rules in `src/lib/sourceReview.ts`, using the diff library for text comparisons rather than a custom parser.
- Approved excerpts must be verbatim quotes of the stored official text, enforced both in `src/lib/sourceReview.ts` and in `review_hugo_source`, so paraphrased or invented law cannot be approved.
- Ambient backgrounds are static SVG animated only with CSS transform/opacity (no per-frame JavaScript), so pages stay smooth on low-end phones.
- Hugo's inline thinking indicator uses a shared vector signature animated with CSS transform/opacity, avoiding image downloads and per-frame JavaScript; full-page loaders remain independent.
