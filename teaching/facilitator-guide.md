# Facilitator package — one project, three sessions

Audience: junior BSIT students with HTML/JS basics; student mentors prepare a working baseline before class. Students integrate one prepared adapter, trace component interactions, execute tests, and document a deployable system—not build the whole app during class. Each group uses its own account; facilitators share the same source/curriculum. No shared multi-user inventory workspaces.

## Proposed responsibilities (not confirmed assignments)
- Lead presenter/timekeeper: objectives, concept discussion, strict transitions.
- Live demonstrator: clean baseline account, controlled defect, narrated Network/DB trace.
- Student support: configuration triage, keyboard/accessibility help, focused hints.
- Test-and-defect reviewer: expected-versus-actual rigor, root-cause/fix/retest validation.
- Evidence/documentation collector: sanitized reports, filenames, completeness; no credential collection.
Facilitator names/actual assignments: __________________.

## Mentor preparation checklist
- [ ] Node 24 and locked dependencies available; baseline lint/type/build/unit/browser checks rerun.
- [ ] Dedicated Supabase project migrated; bucket private and policies inspected.
- [ ] Two or more confirmed test accounts provisioned; credentials distributed privately.
- [ ] Seed fictional stationery; run live checks; never claim pending tests passed.
- [ ] Rehearse 10→15→12 and photo replace/remove/failure recovery.
- [ ] Rehearse non-destructive reset: clear teaching mode/restart, fresh SKU or disposable account, archive old demo.
- [ ] Confirm production ignores teaching flags.
- [ ] Test projector, phone-width layout, keyboard focus, local port 3107.
- [ ] Local backup: source archive, lockfile, cached dependencies/browser, printed CSV/templates and sanitized sample requests.
- [ ] Internet-loss plan: labeled mock browser tests/simulation, not invented cloud success.
- [ ] Obtain permission before any deployment, account deletion, policy changes, or destructive cleanup.

## Session 1 — Third-Party Integration (120 minutes)
Outcome target: explain setup → SDK call → response/failure and integrate the prepared photo adapter.
| Minutes | Activity |
|---:|---|
|10|Introduction: StockLite purpose, account ownership, third-party dependency|
|20|Concepts: bucket, MIME/size, generated paths, sessions, SDK data/error, separate-write compensation|
|20|Demonstration: successful upload, Network trace, controlled storage failure, recovery|
|10|Planning: identify contract, allowed file, expected evidence, group roles|
|45|Integration: only the prepared photo-upload exercise; keep baseline validation/security intact|
|10|Testing: TC-09–11; record actual result and retry/no-photo choice|
|5|Submission: small diff, integration explanation, report/evidence|
Coding scope is `photo-upload-starter.txt`; mentors configure Auth/SQL/bucket beforehand. See integration.md and demonstration.md.

## Session 2 — Application Integration, Debugging, and Integration Testing
**Day:** October 14, 2026, 8:00–10:00 AM. **Evening:** October 13, 2026, 7:00–9:00 PM.

| Minutes | Activity |
|---:|---|
|10|Review the shared application and integration points|
|20|Explain component interaction, debugging, logs, and test cases|
|20|Demonstrate a working workflow and one controlled defect|
|15|Students prepare test cases and expected results|
|40|Students execute the Integration Test Challenge and capture evidence|
|10|Analyze defects and implement or propose corrective actions|
|5|Submit the integration testing report and evidence|

Elapsed blocks: 0–10, 10–30, 30–50, 50–65, 65–105, 105–115, 115–120. Preserve this exact schedule in both classes. Pick **one** controlled defect for the live demonstration; other defects are extension stations. During planning fill expected results before executing; during challenge see docs/testing.md. Review a backend rejection as a potential correct behavior, not automatically a bug.

## Session 3 — Deployment and Documentation (120 minutes)
| Minutes | Activity |
|---:|---|
|10|Introduction: what deployment evidence does and does not prove|
|20|Development versus production: environments, secrets, logs, caching, teaching-mode guard|
|20|Configuration: Vercel/Supabase variables, Node, migration, Auth origin; no credentials on projector|
|45|Authorized deployment OR clearly labeled deployment simulation and local production build|
|20|Documentation: architecture, API, setup, testing limits, smoke-check results|
|5|Progress submission: URL only if real; otherwise blockers and simulation worksheet|
Use docs/deployment.md. Production deployment is not mandatory when access/authorization is unavailable; accurate limitations are mandatory.

## Recovery checklist during class
- [ ] Pause new changes; save current evidence and exact input.
- [ ] Check whether UI, contract, Auth, DB or Storage failed.
- [ ] Clear teaching mode, restart, confirm banner gone.
- [ ] Refresh/search before retrying uncertain creates; unchanged movement retry retains request ID.
- [ ] Switch to working local baseline copy if an exercise patch breaks startup.
- [ ] Use a new SKU/account rather than deleting history.
- [ ] If internet unavailable, use simulation worksheet and label blocked real tests.
- [ ] End with one regression run and an honest Passed/Failed/Not run report.

## Assessment guide
Evaluate functional integration (30%), trace/debug reasoning (25%), valid tests and evidence (25%), documentation/reproducibility (20%). A proposed correction may receive reasoning credit without being called an implemented fix. Future attendance, actual feedback, classroom photos and achieved outcomes are blank placeholders, not predictions.
