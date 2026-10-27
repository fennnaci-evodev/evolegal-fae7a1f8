# Edge Function Rules

- Centralize server request bounds, verified-session throttles and provider failure handling in `supabase/functions/_shared/safety.ts`; only transient 429/5xx receive one delayed retry and permanent provider blocks persist until access is restored and an operator clears the pause.
- Fetch monitored legal text only from allowlisted HTTPS publishers with no redirects and bounded time/bytes; source rows are untrusted and cannot authorize network destinations.
- Curation needs opt-in consent, `_shared/anonymize.ts` redaction before staging, and expert approval before JSONL export, so raw user text never enters datasets.
