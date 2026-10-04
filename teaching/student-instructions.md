# Student instructions and submission checklist

Use your assigned account; never borrow another group's inventory credentials. Keep only fictional stationery data. Fork/copy the shared codebase as instructed; do not change the shared cloud schema. Read README startup and docs/architecture.md before class. Do not expose .env.local, passwords, cookies, tokens or signed image URLs in evidence.

## Session 1
1. Identify the prepared adapter inputs/outputs in photo-upload-starter.txt.
2. Complete only the SDK call and error handling in your exercise copy; keep validation/path generation intact.
3. Compare with reference endpoint; explain why an SDK Promise may resolve with an error field.
4. Execute TC-09–11 against the real configured service, clearly label simulated failure.
Submit: [ ] small source diff [ ] setup/SDK explanation [ ] three test rows [ ] real sanitized evidence [ ] remaining blockers.

## Session 2
1. Before execution, complete expected results for assigned manual scenarios.
2. Execute the 40-minute challenge with driver/observer/recorder roles. Preserve the 10→15→12 demo.
3. For one defect: reproduce, classify layer, capture payload/status, explain root cause, implement or propose correction, retest if implemented.
4. Never convert a blocked/unexecuted test into Passed. A screenshot of code is not workflow evidence.
Submit: [ ] application/feature and environment [ ] test IDs/procedures [ ] expected and actual [ ] Passed/Failed/Not run [ ] defect/corrective action [ ] retest [ ] sanitized screenshot/log files [ ] component interaction explanation.

## Session 3
1. Compare development and production, review env names and policies.
2. Deploy only with explicit authorization/account access; otherwise use the simulation worksheet and local production build.
3. Write architecture, setup, API, tests, deployment state, known limitations and smoke results.
Submit: [ ] source/lockfile/migration [ ] README and Mermaid architecture [ ] configuration instructions without secrets [ ] build/test output [ ] real deployment URL OR labeled simulation/blocker [ ] smoke report [ ] portfolio checklist.

Suggested evidence filenames: group-testID-step-date.png or .txt. Keep actual screenshots local to your submission; this delivery does not fabricate them. Include a short reflection: “Which boundary failed, what evidence located it, and what proves the fix?”
