## Goal
Upgrade Hugo's chat (bubble + Expert dashboard) with a turn-aware Consilium engine, a permanent UPL notice, a Consilium "deep analysis" stepper loader, and a richer message renderer for the Impact-on-the-Case bullets. Keep Blitz behavior untouched.

## 1. Backend — `supabase/functions/hugo-chat/index.ts`

- Add two new system prompts:
  - `CONSILIUM_INIT_PROMPT` (Prompt A: Established Facts / Implicit Assumptions / General Legal Framework, third-person only).
  - `CONSILIUM_FOLLOWUP_PROMPT` (Prompt B: no disclaimers, no repetition, incremental progression, Direct Analysis + Impact bullets with `+`/`-` prefixes).
- Turn-aware routing: when `mode === "consilium"`, count prior assistant messages in the passed history. First turn → INIT prompt. Turns 2+ → FOLLOWUP prompt.
- Keep the existing `[CONSILIUM_ACTIVE]` signal so the client can badge messages.
- Persist the first Consilium answer as a "case foundation" marker in `hugo_messages` metadata (`is_case_foundation: true`) so retrieval logic can recover it; if the metadata column is not available, fall back to detecting the first Consilium assistant message per chat client-side.
- Leave Blitz and auto-mode logic unchanged.

## 2. Frontend — new + updated components

- **New `src/components/HugoUPLNotice.tsx`**: sticky low-contrast footer strip with the exact required copy, glass style, small info icon, non-intrusive.
- **New `src/components/HugoConsiliumLoader.tsx`**: animated 3-step stepper — "Triage & Fact Mapping" → "Analyzing Legal Risks" → "Synthesizing Consilium Framework". CSS/Framer Motion only, respects `prefers-reduced-motion`. Shown while a Consilium request is streaming/pending.
- **New `src/components/HugoMessageMarkdown.tsx`**: lightweight markdown renderer (reuse existing `react-markdown` if present, otherwise a small parser for **bold**, headings, lists). Detects lines starting with `+` / `-` under an "Impact on the Case" section and renders them with green/red accent borders and icons.
- **Update `HugoModeBadge`** already exists — keep as the mode selector; ensure it visually reads as a segmented switch (small polish only).

## 3. Chat surfaces to wire up

- **`src/components/HugoDemoBubble.tsx`**:
  - Render `HugoUPLNotice` pinned at the bottom of the chat body (above composer).
  - While `status === "submitted"` and current mode is Consilium, show `HugoConsiliumLoader` instead of the plain typing dots.
  - Swap Hugo message body to `HugoMessageMarkdown`.
- **`src/pages/ExpertChat.tsx`**: same three integrations (notice, loader, markdown).
- Blitz mode keeps the existing typing animation and plain rendering path.

## 4. State / hooks — `src/hooks/useHugoChat.ts`

- Pass `mode` (already supported) plus `turn_index` derived from current messages so the backend can pick INIT vs FOLLOWUP deterministically even if history is trimmed.
- Track `isConsiliumProcessing` flag exposed to consumers for the stepper loader.
- On first Consilium reply of a chat, tag the message locally as `caseFoundation: true` for future UI use.

## 5. Safety / non-goals

- No schema migrations required; use existing `hugo_chats` / `hugo_messages` tables. If a `metadata jsonb` column is missing we skip the DB flag and rely on client detection.
- No changes to Blitz prompts, mode badge storage, auth, or other unrelated screens.
- Respect `prefers-reduced-motion` for the loader and any new animations.
- Keep everything client-light: no new heavy deps beyond `react-markdown` (already common in the stack; will check before adding).

## Files touched
- `supabase/functions/hugo-chat/index.ts` (prompts + turn routing)
- `src/hooks/useHugoChat.ts` (turn index + processing flag)
- `src/components/HugoDemoBubble.tsx`
- `src/pages/ExpertChat.tsx`
- New: `src/components/HugoUPLNotice.tsx`, `src/components/HugoConsiliumLoader.tsx`, `src/components/HugoMessageMarkdown.tsx`

## Verification
- Send a first Consilium message → see stepper loader, then a 3-section INIT response rendered with markdown.
- Send a follow-up → response has no disclaimers, no recap, and Impact bullets render with green/red accents.
- Toggle to Blitz → old fast path unchanged; UPL notice still visible.
- Confirm `prefers-reduced-motion` disables the stepper animation but keeps the steps readable.
