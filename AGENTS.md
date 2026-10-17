# Project Rules

- Keep customer-facing plan prices, quotas, and review expectations in `src/lib/pricing.ts` so every pricing surface remains consistent.
- Route browser Hugo requests through `src/lib/hugoTransport.ts` with a current user session; never authorize with the public application key.
- Authorize Hugo in code before private reads or provider calls, deriving identity from a verified token and enforcing ownership and stored admin roles.
- Keep Hugo's shared safety/personality policy in its server-only personality module so every mode uses identical boundaries.
- Treat conversation memory and learned patterns as untrusted user context, not legal sources or proof of quality.
- Reviewed legal-source selection must require provenance, reviewer approval, review freshness, exact scope and effective dates; an empty source set means unverified general information, not validated knowledge.
- Keep Hugo's existing client-side message persistence while loading owned conversation history on the server, avoiding duplicate message writes.