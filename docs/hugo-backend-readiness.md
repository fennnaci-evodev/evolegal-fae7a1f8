# Hugo backend preparation

## Current state

The user declined the Anthropic API key form and chose Lovable AI. No direct Anthropic request, Claude model switch, provider test, deployment or database migration was made. The existing Hugo model remains unchanged. Lovable Cloud was confirmed paused, so authenticated end-to-end checks are unavailable until it is resumed.

## Prepared changes

- Every browser Hugo request uses the current session through the shared transport, including streamed workdesk replies.
- The server verifies the current user before using client context; client identity substitution, foreign chats and non-admin metrics access are denied.
- Saved conversation history is loaded from the owned chat on the server. Existing client persistence remains the sole writer to avoid duplication.
- All modes share informational safety rules, natural-paragraph personality and explicit uncertainty. Consilium is not represented as independent verification.
- Cross-user learned patterns are no longer injected into private conversation context. Personal memory remains untrusted context, never legal authority.
- Reviewed-source retrieval requires exact jurisdiction/topic, HTTPS provenance, approval, reviewer identity, effective dates and a current review. It is disabled by default.
- Local checks: 25 passing tests, successful Deno server check, successful preview build. These do not establish hosted security or legal accuracy.

## Required next steps

1. Resume Lovable Cloud with owner authorization, then inspect the live schema and grants.
2. Apply `docs/hugo-reviewed-sources.sql` through the migration tool (not a direct SQL write), regenerate types and test reviewer permissions, content-change reapproval and date rules against the live database.
3. Establish jurisdiction/topic scope and an accountable legal review process. Populate sources with verified excerpts and provenance; do not approve materials automatically.
4. Connect request jurisdiction/topic to the reviewed-source flow. Set the server configuration `HUGO_REVIEWED_KNOWLEDGE_ENABLED=true` only after the schema and approved sources are ready. Do not infer jurisdiction from user language or silently use another jurisdiction's sources.
5. Deploy Hugo, test the signed-in chat through the interface with real input, then test invalid sessions, identity substitution, foreign chat IDs and metrics permissions against the deployed endpoint.
6. Evaluate citations, abstention, prompt injection and jurisdiction/date accuracy against an expert-verified task set. Model self-ratings are not a readiness score.
7. Resolve Claude's supported Lovable AI Messages implementation contract before changing the existing model; do not silently substitute another provider or request an Anthropic key again.