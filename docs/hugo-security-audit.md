# EvoLegal / Hugo security audit — 25 October 2026

## Implemented
- Verified sessions for clarification and document generation; stored administrator roles for McCloder. Private document history requires chat/request ownership.
- Server-owned, shared request throttle (15 requests per minute per user), explicit grants and RLS-protected safety state.
- Provider circuit persists account/access/credit blocks; no automatic recovery probes. Clear the server-held pause only after access is restored and an operator explicitly resumes work.
- One delayed retry for 429/transient 5xx only, respecting Retry-After. Browser requests never replay provider calls. Terminal refusals stop their request without revoking access.
- Bounded request bytes, provider connection time, idle SSE time, stream output and official-source downloads. Truncated responses never enter stored assistant context or learning.
- All shared client SSE readers surface explicit safe errors and cancel readers. Full Hugo routes have a render fallback with reload.
- UTF-8/plain-text contract validation, MIME/extension/size/empty/binary checks; normalized newlines and removed invisible directional controls. Literal legal wording remains unchanged: HTML-like input is rendered as text, not executed. Prompt-injection resistance remains a defense in depth, not a guarantee.
- PDF preview checks signature and type; uploads remain local and unscored. No claim of a complete PDF malware scanner or parser.
- Persistent requested disclaimer. Exact reviewed citation matching, allowlisted HTTPS publisher links, fail-closed missing sources and minute-level freshness refresh.
- Source monitoring rejects arbitrary hosts, credentials, ports and redirects; five-megabyte and 15-second download bounds.
- No private provider/service credentials found in client source. Browser environment variables remain public configuration only. Server credentials stay in protected environment storage.

## Verification
- 76 frontend/regression tests and seven server request/provider tests passed.
- All five changed functions deployed.
- Signed-in real Hugo reply returned 200 and rendered. Mocked terminal 403 surfaced safely and restored usable input; no fabricated assistant answer survived reload. Binary upload rejection visible.
- Unauthenticated Hugo, clarification, McCloder, document generation and source monitoring returned 401.
- New safety tables confirmed present. No active provider pause encountered in verification.
- Preview build reports success. Existing development-only ref warnings and ineffective X-Frame-Options metadata remain; production header enforcement was not established.

## Remaining limitations
- Not a complete penetration test or proof of security. Hosted auth configuration, exhaustive RLS/storage coverage, production security headers, malware scanning and all administrator operations require further verification.
- Supply-chain scan reported advisories involving ws, DOMPurify/fflate (jsPDF), router, lodash (charts), and Zod. The compatible client SDK was updated; the other packages' compatible versions remained unchanged. Do not interpret this as a clean dependency scan. Major-version migrations and a fresh advisory assessment remain necessary.
- Claude live access remains deferred; no key requested or paid Claude calls made. Verified-source legal accuracy and real-laptop/iPhone performance are not established.
- Document and impact-analysis model calls were not exercised in full; verification covered authorization denial paths, code compilation and deployment. No source was automatically approved.
