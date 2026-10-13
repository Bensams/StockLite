# Session 2: Application Integration, Debugging, and Integration Testing

**Facilitator Guide**

**Duration**: 120 minutes  
**Day class**: October 14, 2026, 8:00–10:00 AM  
**Evening class**: October 13, 2026, 7:00–9:00 PM  

---

## Session Overview

Students trace interactions across StockLite's frontend, backend, database, and storage layers. They execute a structured integration test challenge, reproduce and diagnose controlled defects, capture evidence, and document corrective actions.

**Learning objectives**:
1. Trace requests through multiple integrated components
2. Use browser developer tools and server logs for diagnosis
3. Execute systematic integration tests with evidence capture
4. Distinguish UI defects from backend, database, and service failures
5. Document defects and propose or implement corrective actions

**Prerequisites**: Session 1 completed (third-party storage integration); students familiar with the running application.

---

## Preparation Checklist

### Required before class (1–2 days prior)

- [ ] Local StockLite instance running and verified with current migrations
- [ ] Supabase project configured: database, Auth, Storage bucket with policies
- [ ] At least 3 test accounts created with classroom-appropriate passwords
- [ ] Fictional seed data loaded (4–6 products per account)
- [ ] Teaching defects tested and reset procedure confirmed
- [ ] Backup `.env.local` stored securely
- [ ] Test worksheet and submission template printed or distributed digitally
- [ ] Screen-sharing or projector tested with terminal and browser side-by-side

### On session day (30 minutes before)

- [ ] Dev server running on known local network IP or localhost
- [ ] One test account signed in as demonstration baseline
- [ ] Browser developer tools (Console, Network) open in demo environment
- [ ] Server log visible (terminal running `npm run dev`)
- [ ] Teaching defect activation commands ready (do not activate yet)
- [ ] Student materials distributed: test worksheet, submission template, debugging guide
- [ ] Facilitator roles assigned (see Role Assignments below)

---

## Recommended Facilitator Roles

**Lead presenter / timekeeper** (1 person):
- Delivers the opening review, concept explanation, and defect analysis
- Watches the clock and announces transitions
- Fields conceptual questions during group work

**Live demonstrator** (1 person):
- Operates the shared screen during demonstrations
- Activates teaching defects and traces diagnostics
- Shows Network tab, Console, server logs, and database inspection

**Student support** (1–2 people):
- Circulates during hands-on execution phase
- Helps students access developer tools and interpret logs
- Answers environment and setup questions
- Does NOT solve test logic for students

**Test and defect reviewer** (1 person):
- Spot-checks student test execution during the challenge
- Validates that evidence capture is adequate (screenshots, logs)
- Reviews corrective-action proposals during analysis phase

**Evidence and documentation collector** (1 person):
- Monitors submission inbox or shared folder
- Confirms all students submitted reports before end of session
- Checks for missing evidence or incomplete sections (follow up later)

Adapt roles for smaller teams: Lead + Demonstrator can be combined; Support and Reviewer can be combined.

---

## Session Flow (120 minutes)

### 1. Review and Context (10 minutes)

**Objective**: Reconnect students with the shared application and integration points.

**Script**:
> "Welcome back. In Session 1, you connected StockLite to Supabase Storage and explored service configuration, SDK calls, and failure handling. Today we focus on the full integration: frontend, backend, database, and storage working together — and what to do when they don't.
>
> StockLite is a teaching project. We intentionally introduce defects in a controlled way so you can practice diagnosis and documentation. The baseline application is correct; you'll activate defects only during exercises.
>
> Your deliverable today is a completed Integration Test Report with evidence: screenshots, logs, and corrective actions for each test case."

**Activities**:
- Show the running application briefly
- Point out the four integrated layers: React UI, Next.js API routes, PostgreSQL database, Supabase Storage
- Display the architecture diagram from `docs/architecture.md`
- Mention that RLS policies, database functions, and storage policies enforce ownership isolation

**Transition**: "Let's talk about how data flows through these layers and where defects hide."

---

### 2. Component Interaction, Debugging, and Logs (20 minutes)

**Objective**: Explain how to trace requests and distinguish defect sources.

**Topics to cover**:

**A. Request flow (5 minutes)**
- User action → React state → `fetch()` to API route → backend validation → database function → response
- Separate storage upload flow: file → Storage API → bucket policy check → signed URL generation
- Movement submission: idempotency key, atomic function, serialized updates

**B. Debugging tools (7 minutes)**
- **Browser Console**: Uncaught JavaScript errors, plus a red line for every failed request (e.g. `POST …/api/movements 422 (Unprocessable Entity)`). StockLite prints nothing here on success.
- **Network tab**: Request payloads and response bodies. StockLite uses 200, 401, 403, 404, 409, 422, and 503 (see `docs/api-reference.md`).
- **Server logs** (terminal running `npm run dev`): one JSON line per API call, e.g. `{"operation":"movements.adjust","request_id":"…","outcome":"failure","status":422}`, followed by Next.js's own `POST /api/movements 422 in 31ms`
- **Database inspection** (Supabase dashboard → Table Editor): Verify actual stored data vs. displayed data
- **Storage policies**: Check bucket settings if photo access fails

Show each tool briefly. Point out that every API response body carries a `request_id`, and the same ID appears in the server log line. That is how one browser request is matched to one server event. Also explain partial failure: a photo can upload (200) and the product save can still fail (409/422/503). StockLite then deletes the orphaned photo and reports the save error.

**C. Common defect patterns (5 minutes)**
- **UI defect**: Display logic wrong, but database correct (e.g., string concatenation shows 105 instead of 15)
- **Validation defect**: Frontend accepts invalid input that backend rejects
- **Schema mismatch**: Client sends field name the backend doesn't expect
- **Service unavailable**: Storage or database temporarily unreachable; app should recover gracefully
- **Permission defect**: RLS policy or storage policy blocks legitimate access

**D. Evidence capture (3 minutes)**
- Screenshot before and after the defect
- Copy relevant Network request/response (JSON payload, status code)
- Copy server log lines with request ID
- Describe expected vs. actual in plain language

**Transition**: "Now I'll demonstrate a working workflow and one controlled defect. Watch what I check and in what order."

---

### 3. Live Demonstration (20 minutes)

**Objective**: Show tracing in action.

**Demo 1: Working workflow (10 minutes)**

Choose a product with balance 10.

1. Open product details
2. Select Stock In, enter quantity 5, note "Received five"
3. **Before saving**, show:
   - Browser Console (clear it first for visibility)
   - Network tab (open and ready to capture)
   - Server terminal (last few log lines visible)
4. Click Save movement
5. **Trace the request**:
   - Network: `POST /api/movements`, status 200. Payload has `"quantity": 5`; response is `{"data": {…"previous_balance":10,"resulting_balance":15…}, "request_id": "…"}`
   - Console: stays clean (no errors)
   - Server: find the line `{"operation":"movements.adjust","request_id":"…","outcome":"success","status":200}` and show that its `request_id` matches the Network response
   - UI: Balance updates to 15, new movement appears (the page then re-fetches `/api/products` and `/api/movements`; point out those GET lines)
6. Reload page: Balance persists at 15
7. Open Supabase dashboard → Table Editor → `stock_movements`: Show the row with `previous_balance: 10`, `resulting_balance: 15` (the project owner must be logged in on the demo laptop)

**Key points**:
- Request succeeded at every layer
- Database and UI agree
- Persistence confirmed

**Demo 2: Controlled defect — Request field mismatch (10 minutes)**

**Before class**: rehearse this once. To activate, stop the server, set `TEACHING_DEFECT=mismatch` in `.env.local`, run `npm run dev`, and refresh. A yellow banner "Development teaching defect active: mismatch" confirms it. Details: `teaching/defects.md`. Do not show `.env.local` on the projector; switch windows or describe the change.

1. Stock In 5 with note "Received five" → Save movement
2. **Observe**:
   - UI: red notice *"Send quantity as a positive whole number, a short note, product ID, type, and request ID."* Balance unchanged.
   - Network: `POST /api/movements` → **422 Unprocessable Entity**
   - Response body: `{"error":"Send quantity as a positive whole number, …","request_id":"…"}`
   - Console: red line `POST http://localhost:3000/api/movements 422 (Unprocessable Entity)`
   - Server log: `{"operation":"movements.adjust","request_id":"<same ID>","outcome":"failure","status":422}`
3. **Diagnose**:
   - Network → Payload: `{"product_id":"…","type":"IN","note":"Received five","request_id":"…","amount":5}`. There is **no `quantity`**.
   - Compare with the `POST /api/movements` contract in `docs/api-reference.md`: `quantity` is required, and unknown fields are rejected
   - Database: no new row in `stock_movements`. The request was stopped by validation in the API route and never reached the database.
   - Root cause: client sends `amount` instead of `quantity`. The code is in `app/page.tsx`, `MovementForm`: `if (defect === 'mismatch') { body.amount = body.quantity; delete body.quantity; }`
4. **Correct**:
   - Explain the fix: send the field name the contract defines; do **not** loosen the server to accept `amount`
   - Reset the defect (`TEACHING_DEFECT=`, restart, banner gone)
   - Retry the same movement: 200, history shows 10 → 15
5. **Document**:
   - Defect: "Movement form sent `amount` instead of `quantity` (API contract mismatch)"
   - Evidence: Network screenshot showing the 422 response and the payload
   - Corrective action: "Changed the frontend field name to match the API contract"
   - Retest: Pass

**Transition**: "You've seen the process. Now prepare your test plan."

---

### 4. Test Planning (15 minutes)

**Objective**: Students review test cases and prepare expected results.

**Activities**:
- Distribute the test worksheet (`teaching/test-worksheet.md`)
- Students work in pairs or small groups
- Review 3–4 selected test cases together (TC-04, TC-06, TC-09, TC-16)
- Each group writes expected results for those cases
- Facilitators circulate and clarify preconditions

**Output**: Students have a clear understanding of what success looks like before they execute.

**Transition**: "Now execute your tests. Capture evidence for every failure."

---

### 5. Integration Test Challenge (40 minutes)

**Objective**: Students execute test cases, reproduce defects, capture evidence.

**Instructions**:
> "Execute test cases TC-01 through TC-16 in order. For each test:
> 1. Set up the preconditions
> 2. Perform the steps exactly as written
> 3. Record the actual result
> 4. Mark Pass or Fail
> 5. If failed, take a screenshot and copy the relevant log or Network entry
> 6. Move to the next test
>
> You will analyze and fix defects in the next phase. Right now, focus on accurate execution and evidence."

**Controlled defects to activate** (facilitators do this at appropriate times, announced):
- **Minute 10**: Announce "Teaching defect A is now active" (incorrect quantity preview)
- **Minute 20**: Announce "Teaching defect B is now active" (field mismatch)
- **Minute 30**: Announce "Teaching defect C is now active" (storage failure simulation)

Each switch means stopping the server, changing `TEACHING_DEFECT` in `.env.local` (`preview`, then `mismatch`, then `storage`), and running `npm run dev` again. Announce before you restart; signed-in students stay signed in. Only the person running the server can switch or reset a defect. Students capture evidence and tell the demonstrator when they are done.

**Facilitator activity**:
- Support: Circulate, help students find Network tab or server logs
- Reviewer: Spot-check 2–3 students' evidence quality midway through
- Lead: Announce time remaining at 20 minutes, 10 minutes, 5 minutes

**Transition**: "Time is up. Let's analyze what you found."

---

### 6. Defect Analysis and Corrective Actions (10 minutes)

**Objective**: Collaborative diagnosis and solution proposals.

**Activities**:
- Ask for a show of hands: "Who found a defect in TC-XX?"
- Pick 2–3 common defects
- For each:
  - One student describes the symptom
  - Another proposes the root cause
  - Facilitator confirms and shows the corrective code or patch
  - Students update their worksheets with the corrective action

**Example dialogue**:
> **Student**: "TC-04 showed 105 instead of 15 in the preview."  
> **Facilitator**: "What did you check?"  
> **Student**: "I looked at the Console and saw no error. Then I checked the server log and the database — both showed 15. So it's a UI bug."  
> **Facilitator**: "Exactly. The preview used string concatenation. Here's the corrected code: `Number(quantity)` instead of `quantity`. Mark that as the corrective action and retest."

**Transition**: "Finish your reports and submit."

---

### 7. Submission (5 minutes)

**Objective**: Collect completed test reports.

**Checklist for students**:
- [ ] All 16 test cases executed or marked as blocked
- [ ] Pass/Fail status recorded
- [ ] Evidence attached for all failures
- [ ] Corrective actions documented
- [ ] Summary section completed

**Submission method**: Upload to shared folder or email to designated collector.

**Facilitator**: Confirm count of submissions received; follow up with missing students after class.

---

## Teaching Defects Reference

See `teaching/defects.md` for detailed activation, symptoms, diagnostic clues, root causes, corrective patches, and reset commands for:

| Defect | `.env.local` setting | What students see |
|---|---|---|
| A: preview adds text | `TEACHING_DEFECT=preview` | Stock In preview shows 105 instead of 15; saved data is correct |
| B: field mismatch | `TEACHING_DEFECT=mismatch` | Client sends `amount` instead of `quantity` → 422 |
| C: storage unavailable | `TEACHING_DEFECT=storage` | `POST /api/photos` → 503; product not saved unless "Save without selected photo" is ticked |

Defects work only under `npm run dev`. A yellow banner shows the active defect to signed-in users.

**Important**: Defects are inactive by default. Activate only during the test challenge window. Reset immediately after evidence capture so subsequent tests run correctly.

---

## Troubleshooting During Class

### Student cannot access developer tools
- Chrome/Edge: F12 or Ctrl+Shift+I
- Provide a printed quick-reference card

### Server log not visible
- If terminal is hidden, open a second terminal: `npm run dev` outputs live logs
- Alternatively, show students how to check the existing terminal scrollback

### "I can't reproduce the defect"
- Confirm the yellow "Development teaching defect active" banner is visible, or open `/api/config` and check `"defect"`
- If the banner is missing: the server was not restarted after editing `.env.local`, the variable name is wrong (it is `TEACHING_DEFECT`, not `NEXT_PUBLIC_…`), or the server was started with `npm start` instead of `npm run dev`
- Defect A only affects **Stock In**; Defect C only affects saves **with a new photo**
- Verify the student is using the correct test account

### "The database shows different data than the UI"
- This is expected for UI defects — guide the student to identify the discrepancy
- Use Supabase dashboard Table Editor to inspect actual rows

### Storage photos not loading
- Check bucket policies in Supabase dashboard
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set in `.env.local` (check privately; do not project the file)
- Signed photo URLs expire after 5 minutes: click **Refresh inventory** to get new ones
- Confirm the bucket is private and signed URLs are being requested

### Student finishes early
- Ask them to execute TC-14 (concurrency) in detail: open two tabs and race two Stock Out requests
- Review their evidence for completeness
- Have them help a peer

---

## Knowledge Check Questions (with answers)

Use these during the session or as a post-session quiz.

1. **Where would you look first if a product's balance displays incorrectly but the database shows the correct value?**  
   **Answer**: Browser Console and the component rendering logic (UI defect).

2. **A movement request returns HTTP 422. Where do you find the detailed error message?**  
   **Answer**: Network tab → Response body (`error` field). The UI shows the same message. Use the `request_id` in the response to find the matching server log line, which records the operation and status.

3. **What does it mean if a photo upload returns 200 but the product save then fails (409, 422, or 503)?**  
   **Answer**: Partial failure: the file reached storage but the product row was not saved. StockLite deletes the orphaned photo and shows the save error. If that cleanup also fails, it says so and names the file path. It never reports full success.

4. **How does StockLite prevent the same movement from being applied twice if you retry?**  
   **Answer**: Idempotency key: the client generates a request ID; the database function checks for an existing movement with that ID and reuses the result.

5. **Account B tries to archive Account A's product by its ID and gets 404 "Product not found." Is this a defect?**  
   **Answer**: No, this is correct behavior. Row Level Security hides other owners' rows, so to account B the product does not exist. Answering "not found" instead of "forbidden" also avoids confirming that the ID exists.

---

## Post-Session Follow-Up

- [ ] Collect all submitted test reports
- [ ] Review evidence quality: Are screenshots clear? Are logs relevant?
- [ ] Identify common misunderstandings (e.g., confusing 400 vs 500, missing request IDs)
- [ ] Prepare clarifications for Session 3 opening
- [ ] Archive the session's defect activation state (reset to baseline)
- [ ] Update facilitator notes with timing adjustments or missed topics

---

## Session 3 Preview

"Next session: Deployment and Documentation. You'll configure production environment variables, prepare or perform a Vercel deployment, verify the deployed application with smoke tests, and document the architecture, setup, and deployment steps. Bring your completed test reports as reference."

---

## Resources for Facilitators

- `docs/debugging-guide.md` — Detailed diagnostic procedures
- `docs/api-reference.md` — API contracts for reference
- `teaching/defects.md` — Controlled defect activation and reset
- `teaching/test-worksheet.md` — Student test template
- `teaching/submission-checklist.md` — What to verify in student submissions
