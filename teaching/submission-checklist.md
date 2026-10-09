# StockLite — Student Submission Checklist

Use this checklist to verify your work is complete before submitting. Each session has specific deliverables.

---

## Session 1: Third-Party Integration (Supabase Storage)

**Due**: End of Session 1  
**Submission method**: [Upload to shared folder / Email to instructor]

### Required deliverables

- [ ] Completed `ProductForm.tsx` or starter file with working photo upload
- [ ] Screenshot showing successful photo upload and display after reload
- [ ] Screenshot of one error scenario (oversized file, unsupported type, or simulated failure)
- [ ] Brief reflection (3–5 sentences): "What was the hardest part of integrating Supabase Storage?"

### Quality checklist

- [ ] File validation runs before upload (type and size checked)
- [ ] Error messages are clear and user-friendly
- [ ] Upload function handles success and failure cases
- [ ] Code is commented where integration logic is complex
- [ ] Screenshots clearly show the upload interface and result

---

## Session 2: Application Integration, Debugging, and Integration Testing

**Due**: End of Session 2  
**Submission method**: [Upload to shared folder / Email to instructor]

### Required deliverables

- [ ] Completed Integration Test Worksheet with all 16 test cases
- [ ] Pass/Fail status recorded for each test
- [ ] Evidence attached for all failed tests (screenshots, log excerpts, or Network tab captures)
- [ ] Corrective actions documented for each defect found
- [ ] Summary section completed (tests executed, passed, failed, critical defects)

### Quality checklist

- [ ] Actual results describe what you observed, not what was expected
- [ ] Evidence is clear and relevant (cropped screenshots, readable logs)
- [ ] Corrective actions explain the root cause and proposed fix
- [ ] Retest results are marked after defect correction
- [ ] Summary identifies critical defects and recommended actions

### Evidence examples

**Good evidence**:
- Screenshot showing incorrect preview ("105" instead of "15")
- Network tab capture showing 400 response with payload mismatch
- Server log excerpt with request ID and validation error message

**Insufficient evidence**:
- "It didn't work" without screenshot
- Blurry or unclear screenshot
- Screenshot of unrelated page or application

---

## Session 3: Deployment and Documentation

**Due**: End of Session 3  
**Submission method**: [Upload to shared folder / Email to instructor]

### Required deliverables

- [ ] Architecture diagram (Mermaid, drawn, or screenshot of digital version)
- [ ] Deployment steps documentation (summary of what you configured)
- [ ] Completed smoke test checklist (ST-01 through ST-06)
- [ ] Production URL (if actual deployment) OR completed deployment simulation worksheet
- [ ] Configuration evidence (screenshot of Vercel environment variables, masked secrets)
- [ ] Reflection (5–7 sentences): "What did you learn about deploying integrated applications?"

### Quality checklist

- [ ] Architecture diagram shows all components: browser, Next.js, database, auth, storage
- [ ] Arrows are labeled with interaction types (HTTPS, SQL, signed URLs)
- [ ] Deployment steps are clear enough for another student to follow
- [ ] Smoke test results distinguish pass/fail and document any issues
- [ ] Secrets are masked in screenshots (no exposed keys)
- [ ] Reflection explains what was challenging and what you learned

---

## Final Portfolio Integration (Optional but Recommended)

Add StockLite to your professional portfolio or GitHub profile.

### Portfolio components

- [ ] Project title and one-sentence description
- [ ] Technology stack: Next.js, TypeScript, Tailwind, Supabase (PostgreSQL, Auth, Storage), Vercel
- [ ] Learning objectives (what skills this project demonstrates)
- [ ] Screenshot of the deployed application (or local if deployment was simulated)
- [ ] Link to GitHub repository (ensure README is clear)
- [ ] Reflection: "What integration and testing skills did I develop?"

### GitHub repository checklist

- [ ] Clear README with setup instructions
- [ ] `.env.example` with placeholders (no real secrets)
- [ ] All dependencies listed in `package.json` with lockfile
- [ ] Migrations and policies documented
- [ ] No committed secrets or tokens
- [ ] License file (if applicable)

---

## Common Mistakes to Avoid

### Session 1
- ❌ Hardcoding file paths instead of using generated filenames
- ❌ Not validating file size before upload
- ❌ Uploading to public bucket without understanding security implications
- ✅ Use generated UUIDs, validate client-side, use private bucket with policies

### Session 2
- ❌ Recording expected result in "Actual result" column
- ❌ Marking tests as passed without actually executing them
- ❌ Missing evidence for failed tests
- ✅ Execute every test, capture real results, attach clear evidence

### Session 3
- ❌ Committing secrets to Git
- ❌ Skipping smoke tests and assuming deployment worked
- ❌ Missing or unclear architecture diagram
- ✅ Use environment variables, verify every integration, label diagram clearly

---

## Grading Rubric (if applicable)

### Session 1: Third-Party Integration (25 points)
- Working photo upload (10 points)
- Proper validation and error handling (7 points)
- Evidence screenshots (5 points)
- Reflection quality (3 points)

### Session 2: Integration Testing (40 points)
- Test execution completeness (15 points)
- Evidence quality and relevance (12 points)
- Defect documentation and corrective actions (10 points)
- Summary and analysis (3 points)

### Session 3: Deployment and Documentation (35 points)
- Architecture diagram (8 points)
- Deployment documentation (10 points)
- Smoke test results (10 points)
- Configuration evidence (4 points)
- Reflection quality (3 points)

**Total**: 100 points

---

## Submission Deadlines

| Session | Topic | Deadline | Late penalty |
|---------|-------|----------|--------------|
| Session 1 | Storage integration | End of Session 1 | [TBD by instructor] |
| Session 2 | Integration testing | End of Session 2 | [TBD by instructor] |
| Session 3 | Deployment & docs | End of Session 3 | [TBD by instructor] |

---

## Questions or Issues?

- **Technical help during session**: Raise your hand or ask a circulating facilitator
- **Clarification on requirements**: Ask the lead presenter
- **Submission issues**: Contact [designated collector]
- **Post-session questions**: [Instructor email or forum]

---

## Final Checklist Before Submission

- [ ] All required files included
- [ ] Files named according to instructions (if specified)
- [ ] Screenshots are clear and relevant
- [ ] No secrets or passwords visible in any submission
- [ ] Reflection addresses the specific question asked
- [ ] Submission uploaded to correct location or emailed to correct address

**Good luck, and thank you for your careful work on StockLite!**
