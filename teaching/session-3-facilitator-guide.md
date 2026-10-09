# Session 3: Deployment and Documentation

**Facilitator Guide**

**Duration**: 120 minutes  
**Day class**: TBD (after Session 2)  
**Deliverable**: Deployment documentation and architecture summary  

---

## Session Overview

Students configure production environment variables, prepare or perform a Vercel deployment, verify the deployed application with smoke tests, and document the architecture, setup, and deployment steps.

**Learning objectives**:
1. Distinguish development and production configurations
2. Prepare environment variables for secure deployment
3. Deploy a full-stack Next.js application to Vercel
4. Verify database, auth, and storage integration in production
5. Document architecture and setup for handoff or maintenance

**Prerequisites**: Completed Sessions 1 and 2; familiarity with the working application.

---

## Session Flow (120 minutes)

### 1. Introduction and Development vs. Production (10 minutes)

**Script**:
> "You've built and tested StockLite locally. Today we deploy it so it's accessible on the internet. Deployment introduces new considerations: environment variables must be configured securely, the database must accept connections from the deployed app, and you must verify every integration works in production — not just assume it.
>
> Your deliverable: deployment documentation showing the steps you followed, smoke test results, and an architecture diagram with deployment context."

**Topics**:
- **Local dev**: `.env.local`, localhost, hot reload, debug logs
- **Production**: Environment variables in Vercel dashboard, public URLs, optimized builds, no debug logs
- **What changes**: Base URLs, CORS settings, database connection pooling, signed URL expiration
- **What stays the same**: Application logic, database schema, RLS policies

---

### 2. Configuration and Environment Variables (20 minutes)

**Topics**:

**A. Required environment variables (7 minutes)**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Any additional backend-only secrets (if applicable)

**Demonstrate**:
- Show `.env.example` with placeholders
- Show Vercel dashboard → Settings → Environment Variables
- Explain why `NEXT_PUBLIC_*` is safe for browser exposure (anon key is rate-limited, RLS enforces security)

**B. Supabase production readiness (7 minutes)**
- Verify database migrations applied
- Confirm RLS policies active on all tables
- Check Storage bucket policies
- Review Auth settings: allowed redirect URLs, email templates

**C. Vercel project setup (6 minutes)**
- Connect GitHub repository (or manual deployment)
- Set build command: `npm run build`
- Set environment variables
- Choose deployment region (if applicable)

---

### 3. Deployment Demonstration or Simulation (20 minutes)

**If authorized deployment is available**:

1. **Show the Vercel dashboard**
2. **Create a new project** or open existing
3. **Configure environment variables** (mask secrets on screen)
4. **Trigger deployment**: Push to main or click "Deploy"
5. **Monitor build logs**: Show compilation, type checking, static generation
6. **Deployment succeeds**: Note the production URL
7. **Open the deployed app**: Demonstrate sign-in, add a product, upload a photo

**If authorized deployment is NOT available**:

Provide a **deployment simulation worksheet**:
- Walk through each Vercel dashboard screen (use screenshots or mockups)
- Students fill in what they would configure at each step
- Explain what the build log would show
- Describe the expected production URL format
- Provide a clearly labeled example of a deployed app (not claiming it's theirs)

---

### 4. Smoke Testing and Verification (45 minutes)

**Objective**: Verify all integration points work in production.

**Smoke test checklist** (students execute against deployed app or simulation):

#### ST-01: Authentication
- [ ] Sign in with a valid test account
- [ ] Verify dashboard loads
- [ ] Sign out
- [ ] Attempt to access the app while signed out (should redirect to sign-in)

#### ST-02: Product persistence
- [ ] Add a new product with all fields
- [ ] Close the browser
- [ ] Open the app again, sign in
- [ ] Verify the product persists

#### ST-03: Stock movements
- [ ] Stock In 10 units
- [ ] Verify balance updates
- [ ] Reload page
- [ ] Verify movement appears in history

#### ST-04: Photo upload
- [ ] Edit a product
- [ ] Upload a photo
- [ ] Save and reload
- [ ] Verify photo displays (signed URL works)

#### ST-05: Access control
- [ ] Sign in as Account A, create a product, note its ID
- [ ] Sign in as Account B
- [ ] Verify Account B cannot see Account A's products

#### ST-06: Validation and errors
- [ ] Attempt to Stock Out more than available
- [ ] Verify rejection with clear error message
- [ ] Attempt to upload an oversized file
- [ ] Verify rejection

**Activities**:
- Students work in pairs
- Execute tests against the deployed app (or describe expected results in simulation)
- Document any production-only issues (e.g., CORS, slow signed URL generation)
- Report results on the smoke test worksheet

**Facilitator roles**:
- **Support**: Help with login issues, URL access, environment troubleshooting
- **Reviewer**: Confirm test coverage, verify students distinguish real issues from expected behavior

---

### 5. Architecture and Documentation (20 minutes)

**Task**: Create deployment architecture documentation

**Components to document**:

**A. Architecture diagram (Mermaid or drawn)**
```
User Browser
    ↓
Vercel (Next.js App Router)
    ↓ ↓ ↓
Supabase PostgreSQL | Supabase Auth | Supabase Storage
```

Label each arrow:
- Browser → Vercel: HTTPS requests
- Vercel → Database: SQL via PostgREST
- Vercel → Auth: JWT verification
- Vercel → Storage: Signed URL generation
- Browser → Storage: Direct upload/download with signed URLs

**B. Deployment steps summary**
1. Prepared environment variables
2. Connected repository to Vercel
3. Configured build settings
4. Triggered deployment
5. Verified production URL

**C. Configuration checklist**
- [ ] Database migrations applied
- [ ] RLS policies active
- [ ] Storage bucket policies configured
- [ ] Auth redirect URLs updated
- [ ] Environment variables set in Vercel

**D. Smoke test results**
- Summary: X of 6 tests passed
- Any issues encountered and resolutions

**E. Known limitations**
- Teaching defects disabled in production
- Seed data not included (production starts empty)
- Single-user inventory (no shared workspaces)

---

### 6. Submission and Portfolio Preparation (5 minutes)

**Deliverable checklist**:
- [ ] Architecture diagram
- [ ] Deployment steps documentation
- [ ] Smoke test results (completed checklist)
- [ ] Production URL (if actual deployment) or simulation worksheet
- [ ] Configuration evidence (screenshot of Vercel env vars, masked)

**Portfolio integration**: Students add this project to their portfolio with:
- Project description and learning objectives
- Technology stack
- Screenshot of deployed app (or simulation)
- Link to GitHub repository
- Reflection: "What did you learn about integration and deployment?"

---

## Preparation Checklist

### If performing actual deployment:
- [ ] GitHub repository with StockLite source
- [ ] Vercel account with deployment permissions
- [ ] Supabase production project or dedicated classroom project
- [ ] Test accounts provisioned for production database
- [ ] Deployment credentials ready (do not share team owner credentials)

### If performing deployment simulation:
- [ ] Vercel dashboard screenshots or mockups
- [ ] Deployment simulation worksheet prepared
- [ ] Example build log (redacted)
- [ ] Clearly labeled example production app for reference

**Important**: If students deploy individually, each needs their own Vercel account and Supabase project. If deploying one shared classroom instance, one facilitator performs the deployment live and students document the process.

---

## Knowledge Check Questions

1. **Why are environment variables set in Vercel instead of committed to Git?**  
   **Answer**: To keep secrets secure; committed secrets are visible in repository history and to anyone with read access.

2. **What happens if you forget to set `NEXT_PUBLIC_SUPABASE_URL` in Vercel?**  
   **Answer**: The app cannot connect to the database; sign-in and data operations fail.

3. **How do you verify RLS policies are active in production?**  
   **Answer**: Attempt to access another account's data; should be blocked with 403 or empty result.

4. **What is the difference between a development build and a production build?**  
   **Answer**: Production builds are optimized (minified, tree-shaken), have debug logs disabled, and run static generation where possible.

5. **If a photo uploads locally but fails in production, where do you check first?**  
   **Answer**: Supabase Storage bucket policies, CORS settings, and environment variables in Vercel.

---

## Troubleshooting

### Deployment fails with build error
- Check `npm run build` locally first
- Review build logs for missing dependencies or type errors
- Verify Node.js version matches Vercel's runtime

### App loads but database connection fails
- Verify environment variables are set correctly in Vercel
- Check Supabase project URL (production vs. development)
- Confirm database is not paused (Supabase free tier)

### Photos upload locally but not in production
- Check bucket policies allow authenticated uploads
- Verify `NEXT_PUBLIC_SUPABASE_URL` matches the production project
- Test signed URL generation manually

### Sign-in redirect fails
- Update allowed redirect URLs in Supabase Auth settings
- Add production domain (e.g., `https://stocklite.vercel.app`)

---

## Post-Session Follow-Up

- [ ] Collect deployment documentation and smoke test results
- [ ] Review architecture diagrams for accuracy
- [ ] Identify common deployment issues for future sessions
- [ ] Archive the deployed version (if shared) or student URLs
- [ ] Prepare final portfolio checklist for students

---

## Series Completion

After Session 3, students have:
1. Integrated a third-party storage service
2. Traced and debugged interactions across frontend, backend, database, and storage
3. Executed systematic integration tests with evidence
4. Deployed a full-stack application to production
5. Documented architecture, setup, and deployment

**Next steps**:
- Add StockLite to portfolio with deployment link
- Reflect on integration challenges and solutions
- Apply these skills to capstone or personal projects
