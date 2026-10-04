# Supabase service integration

1. Create a dedicated teaching Supabase project. Copy its Project URL and **publishable** key into `.env.local`. Never use a service-role/secret key in this repository, browser, screenshots, logs, or Vercel public variables.
2. Apply the migration. In Storage confirm `product-photos` is private, 2,097,152-byte limit, MIME allowlist JPEG/PNG/WebP. Confirm the three owner-folder policies on storage.objects; never fix an error by making the bucket public.
3. Provision confirmed classroom accounts in Authentication > Users. Distribute credentials privately; no public signup UI is provided. Configure Auth Site URL for the eventual app origin; local work uses http://localhost:3107. If the project allows public signups, the facilitator should disable them in the dashboard before class.
4. Sign in manually, upload an allowed photo, reload and inspect the signed URL image. Repeat with another account and verify denial. These steps require live credentials and are not replaced by UI mocks.

## SDK calls and responses
`createServerClient` binds the caller's cookie session. `storage.from('product-photos').upload(path,bytes,{contentType,upsert:false})` returns data/error; a fresh owner UUID/random UUID filename prevents collisions. `createSignedUrl(path,300)` returns a signedUrl or error. `remove([path])` returns data/error. Treat SDK errors as errors, not success just because the Promise resolved.

Browser and server validate type/size; server checks content signatures. Bucket settings enforce size and allowed MIME again. Never trust the original filename. The image path in PostgreSQL is stable; the URL is temporary and generated on reads.

## Separate-write compensation
New upload → product save → old-photo cleanup. The old reference is retained until the new reference is successfully saved. If save fails, attempt removal of the new unused upload. If cleanup also fails, the UI reports its path for reconciliation. If upload fails, no product save is attempted: retry Save, or check **Save without selected photo**. That explicit choice retains an old photo unless Remove was selected. Removing a photo saves a null reference first, then deletes the old object. Partial cleanup failure is reported as partial success, never as complete success.

An interrupted/uncertain network response can still leave an orphan. Reconcile only after examining current product references and Storage objects with the owner account. Ask approval before removing objects. There is no cross-service distributed transaction; this limitation is part of the teaching objective. Avoid concurrent photo edits to one product during class. A URL already issued remains usable until expiry even after sign-out.

## Session 1 narrow coding exercise
Use `teaching/photo-upload-starter.txt`, not an unfinished production endpoint. Students fill only the SDK upload/error handling block in an isolated branch/copy, compare it with the completed `app/api/photos/route.ts`, and run TC-09–11. Bucket and Auth setup must already be prepared by mentors. Simulated `TEACHING_DEFECT=storage` is explicitly development-only and is not evidence of a real provider outage.
