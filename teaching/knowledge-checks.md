# Knowledge checks and answer keys

## Session 1
1. Does a publishable key alone authorize reading another group's photos?
2. Why generate filenames under an owner UUID rather than trust the original filename?
3. Why inspect both data and error after an SDK call?
4. What happens when upload succeeds but product save fails?
5. Why use a private bucket with short-lived signed URLs?

**Key:** 1 No: verified user + RLS/storage policies control access. 2 Prevent collisions and enforce owner-folder isolation; user filenames are untrusted. 3 SDK failures can be returned as an error field rather than thrown exceptions. 4 Attempt new-object cleanup; report cleanup failure; do not silently claim success. 5 Prevent anonymous permanent reads; URLs permit temporary display but are bearer capabilities until expiry.

## Session 2
1. Why can 10 + input value 5 display 105?
2. Where should you first inspect a 422 after clicking Save movement?
3. Why is a read-then-write quantity calculation in the browser unsafe?
4. What must a replayed movement request preserve?
5. What distinguishes a mock browser test from a real integration test?

**Key:** 1 Input value is a string; + concatenates unless converted. 2 Network JSON field names/types versus backend schema; then validation code. 3 Competing clients can both read an old balance and overwrite each other; DB row lock/transaction serializes updates. 4 Same request UUID and same product/type/quantity/note; it returns the original movement without repeating stock. 5 A mock proves UI contracts under controlled responses; it does not exercise real PostgreSQL/Auth/Storage or prove RLS.

## Session 3
1. Does a successful local production build prove Vercel deployment worked?
2. Which two environment variable names does the application require?
3. Why must service-role keys never appear in browser code?
4. How are teaching defects prevented in production?
5. Name three post-deployment smoke checks and evidence you would retain.

**Key:** 1 No; hosted deployment and complete workflows require separate actual verification. 2 NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. 3 They are privileged and can bypass protection; browser bundles are public. 4 Server defect() returns blank unless NODE_ENV is development; do not override the production runtime. 5 Examples: sign-in/out, product reload persistence, 10→15→12 history, photo upload/reload, account isolation. Retain sanitized actual logs/screenshots and statuses, never tokens/keys.
