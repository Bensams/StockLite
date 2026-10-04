# Controlled defects — isolated development only

Default `TEACHING_DEFECT` is blank. In `.env.local` set one value, stop/restart `npm run dev -- --port 3107`, and confirm the visible teaching banner. The server `defect()` returns a mode **only when NODE_ENV=development**. `npm run build` / `npm start` ignore these modes even if the variable is present. Do not set NODE_ENV manually to circumvent this guard. Reset: clear the variable, restart, confirm banner is gone, run regression tests. Keep test records; archive prior demo SKUs instead of erasing evidence.

## 1. Incorrect preview (`preview`)
- Preconditions: active product balance 10, type IN.
- Activate: `TEACHING_DEFECT=preview`; enter quantity 5.
- Symptom: preview 105; authoritative save yields 15, not 105.
- Clue: input event values are strings. Break at preview expression and inspect typeof.
- Root cause: `String(p.quantity) + quantity` concatenates.
- Correct branch already in production: `p.quantity + Number(quantity)` (OUT subtracts). Never fix this by changing DB arithmetic.
- Regression: validation test numeric preview + TC-04 + inspect movement resulting_balance 15. Reset before next exercise.

## 2. Request-field mismatch (`mismatch`)
- Enter 5 and note `Restock`; submit.
- Symptom: HTTP 422, no stock/history change.
- Clue: Network contains `amount`, not `quantity`; strict Zod schema rejects unknown/missing fields.
- Root cause: client contract drift. Correct payload uses `quantity: Number(quantity)` and removes amount. Correct branch is the default.
- Regression: unit mismatch case plus TC-04 after reset; balance changes exactly once. Do not weaken server validation to accommodate arbitrary names.

## 3. Storage unavailable (`storage`)
- Select valid PNG <2 MB, save.
- Symptom: visible 503 explicitly labeled Teaching simulation; form values remain; no false save success.
- Clue: failure originates at server before SDK upload. This is **not a real Supabase outage**.
- Root cause: deliberate development guard throws ApiError. Reset to reach real upload SDK call.
- Recovery: reset then retry, or explicitly choose Save without selected photo. Do not silently discard the file.
- Regression: TC-09 and TC-11; verify object/reference and failure recovery. Unit file tests do not substitute for service tests.

## Optional permissions exercise (separate disposable project only)
Facilitator obtains authorization and saves baseline migration/policy SQL. In a new isolated project only, remove the `photo_insert` policy through its SQL Editor:
```sql
-- EXERCISE ONLY; never run on classroom shared or production project.
drop policy photo_insert on storage.objects;
```
Attempt a valid upload: real service failure should be visible. Inspect authenticated role, INSERT operation, owner folder, and policy absence. Do not use service-role keys or public buckets as a workaround. Restore:
```sql
create policy photo_insert on storage.objects for insert to authenticated
with check(bucket_id='product-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
```
Retest with own account and another account; own succeeds, other-owner path fails. Record actual output; no expected failure should be labeled a passed implementation. This policy experiment is not enabled by application teaching mode and requires an isolated service setup.
