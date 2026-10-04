# Testing strategy and Integration Test Challenge

## Layers and commands
- `npm test`: 19 tests in Vitest (15 validation cases and 4 server safety/error-mapping cases) for shared server/browser contracts, SKU normalization, exact price parsing, numeric bounds, request mismatch, file validation, and corrected preview. No network or database.
- `npm run test:e2e`: Playwright desktop (1280×800) and mobile (390×844), create/photo/in/out/reload plus setup and keyboard/theme checks. Uses controlled HTTP substitutes in `tests/browser/workflow.spec.ts`; proves UI wiring and layout only, not real persistence, image decoding, Auth, RLS, or SQL arithmetic.
- `npm run test:live`: real authenticated Supabase RPC/read/storage checks. Configure URL/publishable key and TEST_EMAIL/PASSWORD plus TEST_OTHER_EMAIL/PASSWORD in ignored .env.local. Accounts must be different, confirmed, disposable, and authorized for test writes. Tests retain an archived fictional test product and unused uploaded PNG for evidence; review/obtain approval before cleanup. Covers opening movement, 10→15→12 persistence, idempotency/payload conflict, negative/fraction rejection, overdraw rollback, competing OUTs, forbidden direct writes, cross-owner reads/writes/image access, archive/history protection, and real private upload/signing.
- `npm run lint`, `npm run typecheck`, `npm run build`: static checks and production compilation, not live integration tests.

No live check may be marked passed from source review or mocks. The real-service runner fails early if configuration is missing. Record command, commit/file version, environment, date, exact test count, and sanitized output. See verification.md for this delivery's actual runs.

## Manual worksheet
Use `templates/manual-tests.csv` and `templates/test-report.csv`. Rows specify exact inputs, prerequisites, steps, expected results; actual results/status/evidence are blank. TC-04/05 intentionally form one sequence after TC-01 (opening 10). Use fresh SKUs/account for other scenarios so concurrency/threshold tests do not contaminate this demonstration. Screenshots must be captured by students after execution, never fabricated.

## Forty-minute challenge
1. 0–5: confirm account and baseline; assign driver, observer, recorder within each group.
2. 5–20: run TC-01–08 and the 10→15→12 demonstration; record expected/actual separately.
3. 20–30: run TC-09–12 and assigned defect; capture sanitized response and recovery.
4. 30–37: mentor-assisted TC-13–15 (two sessions/accounts and concurrent calls), then TC-16. If unfinished, mark Not run and explain; do not manufacture evidence.
5. 37–40: consolidate defects, propose/implement one fix, attach retest evidence.

## Request replay and concurrency procedure
Use DevTools Network on a successful movement. Preserve a sanitized body with its original request_id; replay through same-origin fetch in the browser Console while signed in (never copy cookie/authorization headers). For concurrency use `Promise.all` with two fetch calls, distinct UUID keys, each OUT 8 against a fresh balance 12. Expect one HTTP 200, one 409, final balance 4, exactly one new movement. For isolation sign in account B in a separate browser profile; GET products should exclude A's records; try A's UUID in a movement and expect 404. Use authenticated Supabase client in the live runner to verify Storage access, not a previously issued signed URL (a signed URL is deliberately a temporary bearer capability).

## Transaction-failure interpretation
An overdraw or constraint failure must preserve both balance and history count. Capture before and after. The real runner asserts this for rejected movements; it does not inject a database crash or prove all distributed storage failure interleavings. Additional admin fault injection belongs in a disposable database, not the shared class project.

## Additional acceptance checks
- Archive then attempt movement: 409; restore then succeeds. History unchanged by archive/restore.
- Zero-opening product: delete succeeds after explicit UI confirmation. Positive-opening product: delete RPC returns 409; archive offered.
- Replace photo: new path saved before old removal; remove photo: null reference before removal. Simulate failure of product POST after upload, and failure of cleanup DELETE, using DevTools request blocking or a disposable test proxy; UI must report incomplete cleanup.
- Search SKU/name, category and archived/low filters; empty results explain recovery.
- Dark/light at phone width; Tab through all controls, Enter to submit, visible focus; inspect expired signed-photo refresh.
