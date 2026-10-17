# Roadmap

- [ ] Switch Hugo to Claude through Lovable AI, preserving the chat UI. Blocked: user declined the direct Anthropic key and chose Lovable AI again; the available gateway implementation contract still excludes Anthropic Messages. Preserve the existing model until supported.
- [x] Assess Hugo's logical maturity and readiness for system-prompt personality plus grounded legal knowledge, without model fine-tuning; completed a source-level audit, not a live legal-accuracy evaluation.
- [x] Prepare server-verified identity, chat-ownership and administrative-role gates; update every chat caller to use the user's session. Local authorization and transport tests pass; not live-verified.
- [x] Prepare shared Hugo personality and reviewed-source eligibility without fine-tuning; unreviewed memory is never legal authority. Reviewed-source retrieval is disabled until setup is complete.
- [x] Test authorization, source eligibility, session transport and request validation locally (25 tests passed); Deno server check and preview build pass.
- [ ] Apply the reviewed-source schema and deploy/test Hugo end-to-end. Lovable Cloud is enabled and healthy again; no migration, deployment, authenticated live request or provider call has been performed yet.
- [ ] Populate and legally review the knowledge base, establish jurisdiction/topic scope and an expert-verified evaluation set. Blocked: no reviewed legal materials or authorized review process supplied; source approval is not itself legal validation.

- [x] Preserve the existing home UI and refine only the randomized neural-point background, with phone-specific density and motion.
- [x] Replace the oversized mobile dropdown with a compact, polished navigation panel while preserving routes and page content.
- [x] Make the neural background visibly dynamic with organic drift, breathing links, and flowing signals while retaining mobile performance controls.
- [x] Make neural node placement, motion, connections, and signal flow smooth, stable, and logically consistent.
- [x] Replace the neural field's simple grid character with organic clusters, curved paths, and coordinated depth.