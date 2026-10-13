# StockLite — Deployment Guide

This guide covers deploying StockLite to Vercel with Supabase as the backend service.

---

## Prerequisites

Before deploying:

- [ ] GitHub repository with StockLite source code
- [ ] Supabase project (production or dedicated classroom instance)
- [ ] Vercel account (free tier works)
- [ ] Node.js 18+ locally for testing the production build

---

## Pre-Deployment Checklist

### 1. Verify Local Production Build

Test the production build locally before deploying:

```bash
npm run build
npm start
```

Visit `http://localhost:3000` and verify:
- Sign in works
- Products display
- Stock movements save
- Photos upload and display
- No console errors

If the build fails, fix all TypeScript errors and linting issues before proceeding.

---

### 2. Prepare Supabase Production Database

**Run migrations**:

If you haven't already applied migrations to your production Supabase project:

1. Open Supabase Dashboard → SQL Editor
2. Run the migration file `supabase/migrations/001_inventory.sql` (it creates the tables, functions, policies and the `product-photos` bucket)

**Verify tables exist**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Expected: `products`, `stock_movements`

**Verify RLS is enabled**:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Expected: `rowsecurity = true` for both tables

**Verify policies exist**:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Expected: Policies for products (select, insert, update, delete) and stock_movements (select, insert)

---

### 3. Configure Supabase Storage

**Create bucket** (if not already created):

1. Supabase Dashboard → Storage
2. Create new bucket: `product-photos`
3. Set to **Private** (not public)

**Add policies**:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own photos
CREATE POLICY "Users can read own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### 4. Configure Supabase Auth

**Add production URL to allowed redirects**:

1. Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel deployment URL to **Site URL** and **Redirect URLs**
   - Example: `https://stocklite.vercel.app`
   - Or use wildcard: `https://*.vercel.app` (for preview deployments)

**Email templates** (optional):
- Customize sign-in, sign-up, and password reset email templates if needed
- Default templates work for classroom use

---

## Deploying to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended for First Deployment)

**Step 1: Connect Repository**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New...** → **Project**
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Select the repository containing StockLite

**Step 2: Configure Project**

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (unless StockLite is in a subdirectory)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

**Step 3: Add Environment Variables**

Click **Environment Variables** and add:

| Name | Value | Where to find |
|------|-------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Supabase Dashboard → Settings → API Keys → Publishable key |

**Important**:
- Use the **publishable key**, NOT the secret (service role) key
- The `NEXT_PUBLIC_` prefix makes these available to the browser (this is safe for the publishable key; RLS protects the data)
- Do NOT commit these values to Git

**Step 4: Deploy**

1. Click **Deploy**
2. Wait for the build to complete (2–5 minutes)
3. Vercel will display your deployment URL: `https://your-project.vercel.app`

---

### Option 2: Deploy via Vercel CLI

**Install Vercel CLI**:
```bash
npm install -g vercel
```

**Login**:
```bash
vercel login
```

**Deploy**:
```bash
# From the project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No (first time) or Yes (subsequent)
# - What's your project's name? stocklite
# - In which directory is your code located? ./
# - Want to override the settings? No
```

**Add environment variables**:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste the value when prompted

vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
# Paste the value when prompted
```

**Redeploy with environment variables**:
```bash
vercel --prod
```

---

### Option 3: Automatic Deployment via Git Push

Once the initial deployment is set up, Vercel automatically deploys:

- **Production**: Every push to `main` branch → `your-project.vercel.app`
- **Preview**: Every push to other branches or pull requests → unique preview URL

No manual action needed after the initial setup.

---

## Post-Deployment Verification

### Smoke Tests

Execute these tests against the deployed application.

#### 1. Authentication
- [ ] Visit the production URL
- [ ] Sign in with a test account
- [ ] Verify dashboard loads
- [ ] Sign out
- [ ] Verify redirect to sign-in page

#### 2. Product Persistence
- [ ] Add a new product with all fields
- [ ] Close browser completely
- [ ] Reopen production URL and sign in
- [ ] Verify product persists

#### 3. Stock Movements
- [ ] Open a product
- [ ] Stock In 10 units
- [ ] Verify balance updates immediately
- [ ] Reload page
- [ ] Verify movement appears in history

#### 4. Photo Upload
- [ ] Edit a product
- [ ] Upload a valid photo (< 2 MB, JPEG/PNG)
- [ ] Save and reload
- [ ] Verify photo displays (check Network tab for signed URL)

#### 5. Access Control
- [ ] Sign in as Account A, create a product, note the product ID
- [ ] Sign out, sign in as Account B
- [ ] Try to access Account A's product URL directly
- [ ] Verify it's not visible (403 or not in list)

#### 6. Error Handling
- [ ] Attempt Stock Out above available quantity
- [ ] Verify clear error message
- [ ] Attempt to upload a 5 MB file
- [ ] Verify rejection

**If any test fails**, see Troubleshooting below.

---

## Monitoring and Logs

### Vercel Logs

**View deployment logs**:
1. Vercel Dashboard → Your Project → Deployments
2. Click on a deployment
3. View **Build Logs** and **Function Logs**

**Function Logs** show:
- API route executions
- Errors and exceptions
- Performance metrics

**Real-time logs** (CLI):
```bash
vercel logs [deployment-url] --follow
```

### Supabase Logs

**Database queries**:
1. Supabase Dashboard → Logs → Database
2. Filter by query type, status, or search term

**API requests**:
1. Supabase Dashboard → Logs → API
2. View authentication, database, and storage requests

---

## Troubleshooting

### Build Fails

**Symptom**: Deployment fails during build step

**Check**:
1. Review build logs in Vercel dashboard
2. Look for TypeScript errors, missing dependencies, or syntax errors

**Fix**:
```bash
# Run build locally to reproduce
npm run build

# Fix reported errors
# Push fix to Git
# Vercel will auto-redeploy
```

---

### Environment Variables Missing

**Symptom**: App loads but shows "Unable to connect" or blank dashboard

**Check**:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set

**Fix**:
1. Add missing variables
2. Redeploy: Vercel Dashboard → Deployments → [...] → Redeploy

**Note**: Changing environment variables requires a redeploy; they're not hot-reloaded.

---

### Sign-In Redirect Fails

**Symptom**: After sign-in, redirected to `localhost` or error page

**Check**:
1. Supabase Dashboard → Authentication → URL Configuration
2. Verify **Site URL** matches your Vercel deployment URL

**Fix**:
1. Set Site URL to `https://your-project.vercel.app`
2. Add to Redirect URLs: `https://your-project.vercel.app/**`
3. Test sign-in again

---

### Database Connection Fails

**Symptom**: API requests return 500, logs show "connection refused" or "database unavailable"

**Check**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check Supabase project status (Dashboard → Settings)
3. Confirm free tier project isn't paused (inactive for 7 days)

**Fix**:
1. If paused, restore the project in Supabase dashboard
2. Verify the URL matches exactly (no trailing slash)
3. Redeploy

---

### Photos Don't Upload or Display

**Symptom**: Photo upload fails or displays broken image icon

**Check**:
1. Network tab: Look for 403 or 401 on storage requests
2. Supabase Dashboard → Storage → `product-photos` → Policies
3. Verify bucket policies exist and are correct

**Fix**:
1. Add missing policies (see Configuration section above)
2. Test upload again
3. If photos upload but don't display, check signed URL generation:
   - Open product details
   - Inspect image `src` attribute
   - Should be `https://.../storage/v1/object/sign/...`

---

### RLS Blocks Legitimate Access

**Symptom**: User can't see their own products or movements

**Check**:
1. Supabase Dashboard → Authentication → Users
2. Verify the user ID matches the `owner_id` in the database
3. Check policies allow `auth.uid()` access

**Fix**:
1. Verify policies are active: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
2. Test policy with SQL:
   ```sql
   -- Sign in as a test user in Supabase Dashboard
   SELECT * FROM products WHERE owner_id = auth.uid();
   ```
3. If empty when products exist, policies are too restrictive; review policy definitions

---

### Performance Issues

**Symptom**: Slow page loads, timeouts

**Check**:
1. Vercel → Project → Analytics (if enabled)
2. Supabase Dashboard → Database → Query Performance
3. Look for slow queries or connection pool exhaustion

**Fix**:
1. Add database indexes (see `supabase/migrations/004_indexes.sql` if provided)
2. Optimize queries (avoid N+1, use joins)
3. Enable Vercel caching for static assets
4. Upgrade Supabase plan if connection limits are reached

---

## Environment Variables Reference

### Required

| Variable | Purpose | Example | Where to get |
|----------|---------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public client key | `sb_publishable_...` | Supabase → Settings → API Keys → Publishable key |

### Optional

| Variable | Purpose | Default | Notes |
|----------|---------|---------|-------|
| `TEACHING_DEFECT` | Session 2 teaching defects: `preview`, `mismatch`, `storage` | blank | Ignored outside `npm run dev`; **never set in production** |

---

## Rollback Procedure

If a deployment introduces a critical bug:

**Via Vercel Dashboard**:
1. Go to Deployments
2. Find the last known good deployment
3. Click **[...]** → **Promote to Production**

**Via CLI**:
```bash
vercel rollback
```

This instantly reverts to the previous production deployment without rebuilding.

---

## CI/CD Integration (Advanced)

For automated testing before deployment:

**GitHub Actions example** (`.github/workflows/ci.yml`):
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
```

Vercel will still deploy, but CI failures notify you before pushing to production.

---

## Deployment Checklist Summary

**Pre-deployment**:
- [ ] Local production build succeeds
- [ ] Database migrations applied
- [ ] RLS policies active
- [ ] Storage bucket configured with policies
- [ ] Auth redirect URLs prepared

**Deployment**:
- [ ] Repository connected to Vercel
- [ ] Environment variables configured
- [ ] Build succeeds
- [ ] Production URL accessible

**Verification**:
- [ ] Sign-in works
- [ ] Products persist
- [ ] Stock movements save
- [ ] Photos upload and display
- [ ] Access control enforced
- [ ] Error handling clear

**Ongoing**:
- [ ] Monitor logs for errors
- [ ] Check Supabase usage (connection pool, storage quota)
- [ ] Update Supabase redirect URLs if domain changes
- [ ] Plan for database backups (Supabase automatic)

---

## Multiple Environments (Optional)

**Development**: Local with `.env.local` pointing to development Supabase project  
**Staging**: Vercel preview deployment with dedicated staging Supabase project  
**Production**: Vercel production deployment with production Supabase project  

**Environment-specific configuration**:
- Create separate Supabase projects for staging and production
- Use Vercel environment variable scopes: Development, Preview, Production
- Test migrations on staging before applying to production

---

## Cost Considerations

**Vercel Free Tier**:
- Unlimited deployments
- 100 GB bandwidth/month
- Suitable for classroom use and small projects

**Supabase Free Tier**:
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth/month
- 50,000 monthly active users
- Pauses after 1 week of inactivity

**Scaling**:
- Upgrade Vercel for custom domains, analytics, higher bandwidth
- Upgrade Supabase for more storage, no pausing, connection pooling

---

## Security Best Practices

- [ ] Never commit `.env.local` or secrets to Git
- [ ] Use `NEXT_PUBLIC_` prefix only for truly public values (URLs, publishable keys)
- [ ] Keep service role keys out of client code entirely
- [ ] Enable RLS on all tables
- [ ] Use private Storage buckets with signed URLs
- [ ] Validate all inputs on both client and server
- [ ] Keep dependencies updated: `npm audit fix`

---

## Further Reading

- [Vercel Next.js Deployment Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- `docs/architecture.md` — System architecture and data flow
- `teaching/session-3-facilitator-guide.md` — Classroom deployment instructions
