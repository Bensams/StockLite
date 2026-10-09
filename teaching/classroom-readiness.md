# StockLite — Classroom Readiness Checklist

Use this checklist to verify StockLite is ready for classroom use across all three sessions.

---

## Pre-Session Setup (Complete 1–2 Days Before Session 1)

### Code and Environment

- [ ] Repository cloned or downloaded to facilitator machine
- [ ] `npm install` completed successfully
- [ ] `.env.local` configured with development Supabase credentials
- [ ] `npm run dev` starts without errors
- [ ] Application loads at `http://localhost:3000`
- [ ] No TypeScript or lint errors: `npm run lint && npm run type-check`

### Supabase Configuration

- [ ] Supabase project created (development or classroom-dedicated)
- [ ] Database migrations applied in order (001, 002, 003)
- [ ] Tables verified: `products`, `stock_movements` exist
- [ ] RLS enabled on both tables
- [ ] Policies verified: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
- [ ] Storage bucket `product-photos` created and set to Private
- [ ] Storage policies applied (upload, read, delete for authenticated users)

### Test Accounts

- [ ] At least 3 test accounts created via Supabase Auth dashboard
- [ ] Credentials documented securely (not committed to Git)
- [ ] Each account tested: sign in, add product, stock movement, photo upload
- [ ] Access isolation verified: Account A cannot see Account B's products

### Seed Data

- [ ] Fictional products added to 2–3 test accounts
- [ ] Example products: varied categories (Writing, Office supplies, Storage)
- [ ] Example movements: opening stock, Stock In, Stock Out
- [ ] Low-stock examples prepared (quantity <= threshold)
- [ ] Photos uploaded for 2–3 products

### Documentation and Materials

- [ ] Session 1 facilitator guide printed or distributed digitally
- [ ] Session 2 facilitator guide and test worksheet prepared
- [ ] Session 3 facilitator guide and deployment checklist ready
- [ ] Debugging guide accessible to students
- [ ] Submission templates prepared and tested

---

## Session 1: Third-Party Integration

### Before Class (30 Minutes)

- [ ] Dev server running on known IP or localhost
- [ ] One test account signed in as baseline demonstration
- [ ] Photo upload working in the complete version
- [ ] Storage starter file prepared for students (if using starter exercise)
- [ ] Sample images provided (valid JPEG/PNG under 2 MB, oversized, unsupported type)
- [ ] Screen sharing tested (show browser, terminal, Supabase dashboard side by side)

### During Class Checkpoints

- [ ] (T+10) Introduction completed, students understand storage integration goal
- [ ] (T+30) Concepts covered: SDK usage, validation, error handling
- [ ] (T+50) Demonstration completed, diagnostics shown
- [ ] (T+60) Students have starter code open and understand TODOs
- [ ] (T+105) Most students have working upload
- [ ] (T+115) Testing completed, evidence captured
- [ ] (T+120) Submissions collected

### Post-Session

- [ ] All student submissions received
- [ ] Sample student work reviewed for completeness
- [ ] Common issues documented for Session 2 clarification
- [ ] Teaching notes updated based on timing and questions

---

## Session 2: Integration Testing and Debugging

### Before Class (30 Minutes)

- [ ] Dev server running with current migrations
- [ ] Test data refreshed (if students modified it in Session 1)
- [ ] Browser DevTools (Console, Network) open in demo environment
- [ ] Server terminal visible for log demonstration
- [ ] Teaching defects tested and reset procedure confirmed
- [ ] Test worksheet distributed (digital or printed)
- [ ] Submission template accessible

### Teaching Defects Ready

- [ ] Defect A (incorrect preview) activation tested
- [ ] Defect B (field mismatch) activation tested
- [ ] Defect C (storage failure) activation tested
- [ ] Reset commands documented and tested
- [ ] Teaching defects NOT active at session start (baseline correct)

### During Class Checkpoints

- [ ] (T+10) Review completed, students reconnected with the application
- [ ] (T+30) Component interaction and debugging tools explained
- [ ] (T+50) Two demonstrations completed (working workflow + one defect)
- [ ] (T+65) Students have test cases planned with expected results
- [ ] (T+85) Defect A activated and announced
- [ ] (T+95) Defect B activated and announced
- [ ] (T+105) Defect C activated and announced, students executing tests
- [ ] (T+115) Defect analysis discussion completed
- [ ] (T+120) Reports submitted with evidence

### Post-Session

- [ ] All teaching defects deactivated and reset
- [ ] Application verified to work correctly (baseline restored)
- [ ] Test reports collected and reviewed
- [ ] Evidence quality checked (screenshots clear, logs relevant)
- [ ] Common defect patterns noted for Session 3 discussion

---

## Session 3: Deployment and Documentation

### Before Class (30 Minutes)

**If performing actual deployment**:
- [ ] Vercel account access verified
- [ ] Production Supabase project configured (or classroom staging project)
- [ ] GitHub repository ready for connection
- [ ] Deployment credentials secured (not shared in screen recording)

**If performing deployment simulation**:
- [ ] Deployment simulation worksheet prepared
- [ ] Vercel dashboard screenshots or mockups ready
- [ ] Example build logs prepared (redacted)
- [ ] Smoke test worksheet adapted for simulation

**All scenarios**:
- [ ] Local production build tested: `npm run build && npm start`
- [ ] Smoke test checklist printed or distributed
- [ ] Architecture diagram template provided
- [ ] Documentation examples shared

### During Class Checkpoints

- [ ] (T+10) Introduction completed, dev vs. production concepts covered
- [ ] (T+30) Environment configuration explained, security emphasized
- [ ] (T+50) Deployment demonstration or simulation completed
- [ ] (T+95) Smoke tests executed, results documented
- [ ] (T+115) Architecture and deployment documentation completed
- [ ] (T+120) Final submissions collected

### Post-Session

- [ ] Deployment URL recorded (if actual deployment)
- [ ] Production environment restored (if classroom shared instance)
- [ ] Student documentation reviewed
- [ ] Portfolio integration guidance provided
- [ ] Series completion confirmed

---

## General Facilitator Readiness

### Technical Skills

- [ ] Comfortable navigating Browser DevTools (Console, Network)
- [ ] Familiar with reading server logs in terminal
- [ ] Can inspect Supabase database tables and policies
- [ ] Understands the request flow: UI → API → Database → Storage

### Teaching Skills

- [ ] Can explain component integration without overwhelming students
- [ ] Able to demonstrate tracing a request end-to-end
- [ ] Comfortable activating and resetting teaching defects
- [ ] Can diagnose common student environment issues (credentials, localhost)

### Materials

- [ ] All session guides accessible (printed or on second monitor)
- [ ] Student materials distributed (test worksheet, submission checklist)
- [ ] Backup plan prepared (local copy of repository, offline docs)
- [ ] Timer or clock visible for session pacing

---

## Student Readiness

Communicate these requirements to students before Session 1:

- [ ] Laptop with Node.js 18+ installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Browser with DevTools (Chrome, Edge, or Firefox)
- [ ] Supabase account (if students provision individually)
- [ ] Test credentials received (if facilitator provisions)
- [ ] GitHub account (if deploying individually in Session 3)

---

## Emergency Backup Plan

### If dev server won't start:
- Have a second machine with working StockLite as live backup
- Share screen from backup machine
- Troubleshoot primary machine offline

### If Supabase is unreachable:
- Pause integration exercises
- Focus on code review, architecture discussion, test planning
- Resume integration when service returns

### If network issues prevent cloud services:
- Switch to local-only exercises (forms, validation, UI)
- Demonstrate pre-recorded video of integration workflows
- Schedule makeup session for hands-on integration

### If students finish early:
- Advanced exercises: concurrency testing, RLS policy exploration
- Peer review: students check each other's test evidence
- Documentation: start Session 3 architecture diagram early

### If students are blocked:
- Pair students: struggling student works with completed peer
- Provide working code: students trace and document instead of implementing
- Extend session: negotiate 15-minute extension if facility allows

---

## Post-Series Completion

- [ ] All student submissions collected and graded
- [ ] Teaching notes updated based on three sessions' experience
- [ ] Common student errors documented for future iterations
- [ ] Sample student reports archived (with permission)
- [ ] Facilitator retrospective completed: what worked, what to improve
- [ ] StockLite codebase tagged as "Session Oct 2026" for version control
- [ ] Next session dates tentatively scheduled

---

## Success Criteria

By the end of the three-session series, students should be able to:

- ✅ Integrate a third-party service (Supabase Storage) into an existing application
- ✅ Trace requests through multiple integrated components
- ✅ Use browser DevTools and server logs for diagnosis
- ✅ Execute systematic integration tests and capture evidence
- ✅ Distinguish UI, backend, database, and service defects
- ✅ Document corrective actions for identified defects
- ✅ Configure and deploy a full-stack application to production
- ✅ Verify production deployment with smoke tests
- ✅ Document system architecture and deployment steps

---

## Facilitator Self-Check

Before each session, ask yourself:

- [ ] Do I understand what students will learn in this session?
- [ ] Can I demonstrate the key concepts without reading the guide?
- [ ] Have I tested the teaching defects and reset procedure?
- [ ] Do I have a backup plan if technology fails?
- [ ] Are student materials clear and complete?
- [ ] Do I know how to answer the top 5 expected questions?
- [ ] Is my demo environment working correctly right now?
- [ ] Have I communicated expectations and deliverables to students?

---

**Ready to teach?** If all critical checkboxes above are marked, you're prepared. Good luck!

**Questions or missing materials?** Review the session-specific facilitator guides for detailed setup and troubleshooting.
