# Hugo backend preparation

## Current state

As of 2026-10-17, Lovable Cloud is healthy. The prepared reviewed-source schema has been applied and session-protected `hugo-chat` deployed. Hugo still uses its existing Lovable AI model; no Claude switch or direct Anthropic connection was made. The knowledge table is empty and reviewed-source retrieval remains disabled.

## Prepared changes

- Every browser Hugo request uses the current session through the shared transport, including streamed workdesk replies.
- The server verifies the current user before using client context; client identity substitution, foreign chats and non-admin metrics access are denied.
- Saved conversation history is loaded from the owned chat on the server. Existing client persistence remains the sole writer to avoid duplication.
- All modes share informational safety rules, natural-paragraph personality and explicit uncertainty. Consilium is not represented as independent verification.
- Cross-user learned patterns are no longer injected into private conversation context. Personal memory remains untrusted context, never legal authority.
- Reviewed-source retrieval requires exact jurisdiction/topic, HTTPS provenance, approval, reviewer identity, effective dates and a current review. It is disabled by default.
- Local checks: 25 passing tests, successful Deno server check, successful preview build. These do not establish hosted security or legal accuracy.

## Required next steps

1. Completed: apply `docs/hugo-reviewed-sources.sql` verbatim through the migration tool and regenerate types. Remove inherited anonymous table privileges in a follow-up migration.
2. Completed: restore signed-in execution of the read-only `has_role` RLS predicate (anonymous execution remains revoked); its earlier blanket revocation prevented chat creation. Live review-trigger rejection, content-change reapproval and date-rule tests remain outstanding; local eligibility tests pass.
3. Establish jurisdiction/topic scope and an accountable legal review process. Populate sources with verified excerpts and provenance; do not approve materials automatically.
4. Connect request jurisdiction/topic to the reviewed-source flow. Set the server configuration `HUGO_REVIEWED_KNOWLEDGE_ENABLED=true` only after the schema and approved sources are ready. Do not infer jurisdiction from user language or silently use another jurisdiction's sources.
5. Completed: deploy Hugo and test a signed-in liability-cap question through the interface. One user message and one assistant reply persist and reload through the chat URL. The deployed endpoint rejects missing/invalid sessions (401), identity substitution/foreign chats/non-admin metrics (403), and injected system messages (400). A non-admin source read returns no rows.
6. Evaluate citations, abstention, prompt injection and jurisdiction/date accuracy against an expert-verified task set. Model self-ratings are not a readiness score.
7. Resolve Claude's supported Lovable AI Messages implementation contract before changing the existing model; do not silently substitute another provider or request an Anthropic key again.

## Live-test limitations

- The reply explicitly disclosed that reviewed sources were unavailable, but still included specific legal propositions and directive wording; this is not evidence of legal accuracy or complete personality compliance.
- Existing optional `hugo_session_recovery` calls return 404; the saved chat URL still reloads both messages correctly. Long-term memory tables and background learning were not verified.
- No legal sources were seeded or approved and no reviewer account was impersonated.