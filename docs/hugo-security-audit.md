# EvoLegal / Hugo security audit — 25 October 2026

## Administrator boundary hardening — 26 October 2026

- Applied caller-bound `is_admin()` role verification with a fixed empty search path and no anonymous execution. Authority remains protected `user_roles`, never profile/auth metadata.
- Administrative source/history/metrics/role/safety tables and private notes enforce RLS; removed inherited anonymous table privileges and dangerous authenticated TRUNCATE/TRIGGER/REFERENCES grants. Metrics and immutable review history are read-only to authenticated callers, with administrator-only reads.
- Moved private request notes out of user-readable request rows into an administrator-only store, backfilled existing notes and cleared/deprecated the old field. Workdesk uses the new store. A database trigger rejects user changes to status, assignment, responses and audit fields; initial submission audit entries are created by the database before automatic assignment.
- Owner message inserts require `sender_role=user`, preventing expert impersonation. Explicit resulting-row owner checks were added for requests, chats, profiles and feedback. The existing chat/profile UPDATE policies implicitly inherited USING as WITH CHECK; these additions make that boundary explicit, not a newly discovered ownership exploit.
- Deployed hugo-chat, hugo-clarify, generate-document and McCloder. Missing/invalid sessions now return 403; privileged scopes/metrics require the caller-JWT database predicate. Regular own-user clarification, chat and document generation remain permitted. Foreign request document generation requires stored admin authorization; foreign chat continuation remains forbidden for administrators too.
- Live standard-user API tests: no rows exposed from sources, changes, reviews, metrics or private notes; role/metric/note writes returned 403; protected request-field mutations and expert impersonation returned 403; owner request edits and user messages succeeded. All three requested functions denied privileged standard-user, missing-session and invalid-session calls with 403.
- Live administrator checks: database predicate true; metrics 200; cross-owner request status update succeeded; private notes saved through Workdesk and read back, with zero page errors. Standard owner could not read the private note through either store. Administrator clarification and cross-owner request document generation returned 200. Temporary test request/messages/notes were removed afterward.
- 90 client/regression tests passed, all four affected functions passed Deno checks, and preview build OK. RLS SELECT denials deliberately return filtered empty rows; PostgreSQL permission failures use SQLSTATE 42501 (mapped to 403 for signed-in writes), not an HTTP status embedded in a policy. No contract-audit storage table exists: the local viewer remains unscored and local, so it cannot be protected by database RLS. No claim of exhaustive penetration testing or immediate revocation of previously issued document bearer URLs.

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

## Stabilization verification — 26 October 2026

This section supersedes the earlier dependency and document-generation limitations where explicitly verified below.

- Authenticated stored-role administrator opened a 180,021-character local text contract. Literal content matched the file, remained unscored, and sample report export was disabled. A standard account was redirected from the administrator viewer to its dashboard.
- Administrator read 21 document metadata records and downloaded an owned stored PDF (14,540 bytes). Standard account read zero document metadata records and was denied download of an administrator-owned PDF. The bucket is private with owner-path SELECT/INSERT/UPDATE/DELETE policies. Local viewing does not transmit files; its 20 MiB text limit remains separate from Hugo's 30,000-character message limit.
- There is no stored-document history management UI to verify. Administrator metadata visibility does not confer cross-owner storage access; storage remains owner-only. No permissions were broadened. Existing seven-day signed URLs are bearer links until expiry; this phase did not change their lifetime or revoke existing links.
- Updated Router 7.18.4, Vite 7.3.7, Vitest 4.1.12 and Zod 4.6.7, refreshed compatible dependencies, and constrained esbuild/selector-parser to patched releases for legacy tooling. The synchronized npm lockfile's public-registry audit reports zero known vulnerabilities at verification time (not proof of overall security). The sandbox registry's audit endpoint returned 404; the successful audit used the public registry. Its lockfile was regenerated in clean temporary staging using legacy peer resolution after npm's default peer resolver crashed; runtime/tests separately verified compatibility. Bun remains the install manager.
- All 84 frontend tests and seven provider/request tests pass. Deno checks all four changed functions; patched validation deployed to hugo-chat, hugo-clarify, generate-document and mccloder. Zod record schemas use explicit string keys. The development preview reports build OK.
- Live authenticated Hugo statutory-reference request returned 200 in 9.2 seconds with no 429, timeout or page errors. The Companies Act 2006 s. 172 chip opened “Not yet verified”; reply and chip survived reload. Both administrator and standard-user citation RPCs returned zero eligible reviewed sources without permission errors. Verified-source popover success and substantive legal accuracy remain blocked by actual legal review; no source was approved for this test.
- Patched clarification returned 200 and a valid clarification result; long-context document generation returned 200 with seven sections. McCloder was compiled/deployed but no paid assessment was exercised. No Anthropic key or Claude calls were introduced.
