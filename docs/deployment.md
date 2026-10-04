# Deployment — prepared, not performed

No hosted deployment is claimed. The user has not authorized publishing and no deployment account/project access was supplied. Do not invent a URL. Use templates/deployment-simulation.md if access is unavailable.

## Development versus production
Development uses .env.local, `next dev`, safe structured logs and optional server-guarded defects. Production uses managed environment variables, `next build` + `next start`/Vercel, blank teaching mode and no development logs. Public-prefixed variables may be embedded in browser bundles; only URL and publishable key belong there. Do not put test account credentials or privileged keys in Vercel. Use separate Supabase projects for disposable exercises and production when possible.

## Exact authorized Vercel procedure
1. Obtain explicit approval to publish the repository/deploy; verify ownership of Vercel and Supabase projects. Commit only reviewed source, lockfile, docs/migration/tests; .env.local and artifacts remain ignored.
2. In a fresh target Supabase project, apply 001_inventory.sql. Confirm constraints/functions/RLS and private bucket policies. Provision classroom users, disable public signups as appropriate. Do not copy disposable test records into production.
3. Import the approved repository into Vercel → Add New Project. Framework preset **Next.js**; root is repository root; install `npm ci`; build `npm run build`; use default Next.js output. Select Node **24.x** in project runtime settings.
4. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for the intended Preview/Production environments. Leave TEACHING_DEFECT absent. Never add service-role secrets. Use a separate backend for previews or clearly treat preview data as nonproduction.
5. Deploy. Read actual build logs. If successful, record the real URL, deployment identifier, source version and time in the worksheet. If failed, record error/blocker instead.
6. Configure Supabase Auth Site URL to the real HTTPS production origin. Email/password sign-in here does not use a callback route; future email links would need deliberate redirect allowlisting.
7. Execute smoke checks below on the actual URL using dedicated fictional test accounts. Only then call the deployment verified. Avoid exposing password fields or auth headers in recordings.

## Post-deployment smoke checks
- Sign in account A and sign out; invalid credentials produce helpful feedback.
- Create unique product; reload and sign in again; data persists.
- Opening 10 → IN 5 → OUT 3 → reload = 12 and exactly three history rows; overdraw rejected.
- Upload valid small PNG; reload; replace and remove; verify reference and cleanup order. Unsupported/oversized files rejected.
- Account B cannot list/read/adjust A product or obtain A private image from Storage. Verify ownership with authenticated calls, not an already-shared signed URL.
- Archive prevents movement; restore permits; history prevents deletion; zero-history deletion requires confirmation.
- Phone layout and keyboard interaction usable; light/dark contrast readable.
- Production config reports no teaching mode even if a flag was accidentally configured; remove that flag afterwards.

## Rollback and recovery
Record previous known-good deployment before releasing. If smoke checks fail, use Vercel's rollback to that actual deployment with authorized access, then diagnose against a disposable backend. A code rollback does not undo database changes. Current migration is initial-only; later schema changes should be forward-compatible numbered migrations with a separate backup/rollback plan. Never reset the production database as a deployment fix.

## Local production simulation
```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm start -- --port 3107
```
A local build without Supabase config proves compilation and setup-screen behavior only. For real service smoke checks add the project's configuration and accounts first. Mark absent credentials/hosting access explicitly.
