# Project Rules

- Verify privileged edge execution through the caller-JWT-bound `is_admin` database predicate; deny missing/invalid sessions with 403, preserve owner-only conversational operations, and keep private request notes in an admin-RLS store so mixed user/admin request reads cannot expose them.

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
- Hugo's model calls go only through `supabase/functions/hugo-chat/provider.ts`, which always emits OpenAI-style output; switching to Anthropic needs only `HUGO_PROVIDER=anthropic` plus `ANTHROPIC_API_KEY`, with no client changes.
- Citation chips show "verified" only for an unambiguous exact statute/section title and jurisdiction match to a reviewed source returned by `list_verified_hugo_citations`; matching an Act never verifies all its sections.
- In-chat contract cards detect clauses only and stay unscored, consistent with the Contract Risk Analysis rule against invented scores.
- Normalize attached contract input in `hugoContractInput.ts`, enforcing the complete message limit and stripping the audit instruction before clause detection to prevent invented excerpts.
- Keep local text viewing in `contractViewerInput.ts` separate from Hugo message validation so large view-only contracts do not weaken chat limits; render uploaded text as literal text and never assign sample findings.
- Bound supplemental document context before browser transmission and normalize it on the server within the shared request-byte cap so long chats cannot break document extraction.
- Recover chats through owner-validated local pointers and existing owned chat history, never an optional missing recovery table; this preserves recovery without failing requests.

- Read all Hugo SSE through `src/lib/hugoStream.ts`; only terminally completed responses enter message storage or memory, preventing truncated or fabricated fallback answers.
- Centralize server request bounds, verified-session throttles and provider failure handling in `supabase/functions/_shared/safety.ts`; only transient 429/5xx receive one delayed retry and permanent provider blocks persist until access is restored and an operator clears the pause.
- Fetch monitored legal text only from allowlisted HTTPS publishers with no redirects and bounded time/bytes; source rows are untrusted and cannot authorize network destinations.
- Wrap full Hugo chat routes in a render error boundary with an explicit reload action so rendering failures never leave a blank or frozen interface.
- Keep browser and edge request validation on patched Zod 4 APIs, with explicit record key schemas; npm dependency updates do not update Deno's pinned imports.
- Keep Bun and npm locks synchronized after dependency patches; constrain selector-parser and esbuild to patched releases for legacy tooling chains and rerun tests before claiming a clean advisory audit.
