# Roadmap

- [ ] Add Contract Risk Analysis to the Expert Dashboard, matching the supplied reference with isolated sample data, document upload, linked clause details, severity filters and report export; verify and publish.

- [x] Repair Hugo sending when an administrator opens another account's conversation: owner-scoped lists/loads, safe return to a new chat, unsaved-message rollback and draft restoration. Live verification: foreign chat blocked, owned chat returns 200, user and assistant persist (201) and both reload; 14 regression tests pass. Ownership restrictions unchanged.

- [x] Prepare a free official-source review shortlist for New York State and England: 16 draft cards in the dated Files document, with official URLs, date evidence and reviewer checks. Eight England primary links returned 200; eight NY Senate links returned 403 and require manual text/date verification. No sources imported or approved; no paid services connected.
- [ ] Begin voice-chat work after the source shortlist. Await the user's next instruction; no paid voice services to be connected during this source-preparation task.
- [ ] Connect Hugo directly to Anthropic /v1/messages using protected ANTHROPIC_API_KEY, preserving the chat UI, session gates and reviewed-source policy. Deferred at the user's request: API funding is unavailable; wait for the user to resume. The secure key form was cancelled before execution; no provider code was changed and no Claude requests were sent.
- [x] Assess Hugo's logical maturity and readiness for system-prompt personality plus grounded legal knowledge, without model fine-tuning; completed a source-level audit, not a live legal-accuracy evaluation.
- [x] Prepare and deploy server-verified identity, chat-ownership and administrative-role gates; live checks reject missing/invalid sessions, identity substitution, foreign chats and non-admin metrics access.
- [x] Prepare shared Hugo personality and reviewed-source eligibility without fine-tuning; unreviewed memory is never legal authority. Reviewed-source retrieval is disabled until setup is complete.
- [x] Test authorization, source eligibility, session transport and request validation locally (25 tests passed); Deno server check and preview build pass.
- [x] Apply the prepared reviewed-source schema, deploy session-protected Hugo, and verify a signed-in conversation plus denied access paths live. One user message and one reply persist and reload; 25 local tests pass. Restored authenticated execution of the read-only role predicate required by RLS; anonymous source privileges revoked.
- [ ] Populate and legally review the knowledge base, establish jurisdiction/topic scope and an expert-verified evaluation set, including hosted approval/date/reapproval checks. Blocked: no reviewed legal materials or authorized reviewer process supplied. Retrieval remains disabled; the live reply disclosed the verification gap but still used specific legal propositions and directive wording, so accuracy/personality compliance is not established. Optional recovery-table calls return 404; saved chat URLs work.

- [x] Preserve the existing home UI and refine only the randomized neural-point background, with phone-specific density and motion.
- [x] Replace the oversized mobile dropdown with a compact, polished navigation panel while preserving routes and page content.
- [x] Make the neural background visibly dynamic with organic drift, breathing links, and flowing signals while retaining mobile performance controls.
- [x] Make neural node placement, motion, connections, and signal flow smooth, stable, and logically consistent.
- [x] Replace the neural field's simple grid character with organic clusters, curved paths, and coordinated depth.- [x] England official-source monitor: 10 draft England sources loaded; admin-only checker fetches official XML, detects text and pending-amendment changes, withdraws changed approved sources from Hugo, and stores a draft impact note for reviewer approval.
- [ ] Run the monitor daily. Blocked: automatic daily scheduling is not available for this project yet; run manually as administrator.
- [ ] Add New York via the free NY Senate Open Legislation key. Waits on the user obtaining the key.
- [x] Administrator verification workflow at /dashboard/admin/sources: saved text diff, five legal attestations, atomic version-checked approval/rejection, immutable review history. Signed-in admin approved and rejected a test-only source, then it was retired; no real law approved. Fixed auth-resolution redirect race and official XML extraction. Manual checks from this panel do not use paid analysis. Hugo retrieval remains disabled pending actual expert approval.
- [ ] Discover new related English provisions/judgments daily and add them as drafts (needs a daily schedule, not available yet; run manually meanwhile).
- [ ] First English sources approved by the administrator in the panel (waiting on the administrator's own review).
