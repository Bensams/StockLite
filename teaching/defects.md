# Teaching Defects — Controlled Failures for Integration Testing

**Purpose**: These defects are intentionally introduced in a development-only teaching mode to help students practice diagnosis, evidence capture, and corrective action. The baseline application is correct by default. Never activate teaching defects in production.

---

## Defect Activation Control

Teaching defects are controlled via environment variable:

```env
NEXT_PUBLIC_TEACHING_DEFECT=
```

**Values**:
- `` (empty or omitted): All defects inactive, application works correctly
- `preview-concat`: Activates Defect A (incorrect quantity preview)
- `field-mismatch`: Activates Defect B (request field name error)
- `storage-fail`: Activates Defect C (simulated storage failure)

Set the value in `.env.local` and restart the dev server, or use the runtime config endpoint (if implemented).

**Reset command**: Clear the variable and restart:
```bash
# Remove or comment out the line in .env.local
# NEXT_PUBLIC_TEACHING_DEFECT=
npm run dev
```

---

## Defect A: Incorrect Quantity Preview (String Concatenation)

### Activation
```env
NEXT_PUBLIC_TEACHING_DEFECT=preview-concat
```

### Symptom
On the Stock In/Out form, the balance preview displays string concatenation instead of arithmetic:
- Current balance: 10
- Stock In quantity: 5
- Preview shows: **"Balance preview: 105 units"** (should be 15)

### Where it appears
- Movement form preview calculation (client-side only)
- Does NOT affect the actual database operation

### Diagnostic clues
1. **Browser Console**: No error messages
2. **Network tab**: Movement saves correctly, response shows correct resulting balance
3. **Database**: `resulting_balance` is correct (15)
4. **UI**: Only the *preview* is wrong; after saving, the balance displays correctly

### Root cause
The preview calculation uses string concatenation instead of numeric addition:
```typescript
// Buggy code (when defect is active)
const preview = product.quantity + quantity; // "10" + "5" = "105"
```

### Corrective action
Ensure numeric coercion before arithmetic:
```typescript
// Corrected code
const preview = Number(product.quantity) + (type === 'IN' ? Number(quantity) : -Number(quantity));
```

### Learning objective
Students distinguish a UI rendering defect from a backend logic error by checking multiple sources.

### Regression test
**TC-04** (Stock In 10 + 5):
- Activate defect
- Enter quantity 5
- Observe incorrect preview
- Save movement
- Verify database shows 15 (correct)
- Deactivate defect
- Verify preview now shows 15 correctly

---

## Defect B: Request Field Mismatch

### Activation
```env
NEXT_PUBLIC_TEACHING_DEFECT=field-mismatch
```

### Symptom
Movement form submission fails with HTTP 400:
```json
{
  "error": "Validation failed: Field 'qty' not recognized; expected 'quantity'"
}
```

### Where it appears
- POST `/api/movements` request
- Frontend sends payload with incorrect field name

### Diagnostic clues
1. **Browser Console**: Error message displayed to user
2. **Network tab**: 
   - Request payload contains `{ "qty": 5 }` instead of `{ "quantity": 5 }`
   - Response status: 400 Bad Request
3. **Server log**: 
   ```
   [movements] Validation failed: Field 'qty' not recognized
   Request ID: abc-123
   ```
4. **Database**: No new movement record (transaction rolled back)

### Root cause
When the teaching defect is active, the client intentionally sends a misnamed field to simulate a schema mismatch between frontend and backend.

### Corrective action
Verify the API contract in `docs/api-reference.md` and correct the client payload to match:
```typescript
// Buggy (when defect active)
const payload = { product_id, type, qty: quantity, note, request_id };

// Corrected
const payload = { product_id, type, quantity, note, request_id };
```

### Learning objective
Students learn to:
- Inspect request payloads in the Network tab
- Compare actual requests against API documentation
- Recognize 400 as a client error (bad request format)

### Regression test
**TC-04 or TC-05**:
- Activate defect
- Attempt Stock In/Out
- Capture 400 response and payload screenshot
- Deactivate defect
- Retry with corrected code
- Movement saves successfully

---

## Defect C: Storage Upload Failure

### Activation
```env
NEXT_PUBLIC_TEACHING_DEFECT=storage-fail
```

### Symptom
Photo upload fails with a simulated storage error:
```
Upload failed: Storage service temporarily unavailable. Retry or save without a photo.
```

The product form remains usable; user can retry upload or choose to save without the photo.

### Where it appears
- Product form photo upload (both Add and Edit)
- Upload request to Supabase Storage returns 500 or times out

### Diagnostic clues
1. **Browser Console**: 
   ```
   [ProductForm] Photo upload failed: Storage service unavailable
   ```
2. **Network tab**: 
   - Request to `https://<project>.supabase.co/storage/v1/object/product-photos/...`
   - Status: 500 Internal Server Error (simulated)
3. **Server log**: No backend involvement (direct client-to-storage call)
4. **Database**: Product not saved (if user chose to retry upload)

### Root cause
When this defect is active, the client intercepts the storage upload and returns a simulated failure before calling the actual Storage API. This teaches graceful failure handling without requiring actual storage misconfiguration.

### Corrective action (conceptual)
No code fix needed — this is a simulated external service failure. Students learn to:
- Retry the upload
- Save the product without a photo if the issue persists
- Distinguish between transient service failures and application bugs

**Operational response**:
- Check Supabase service status
- Verify bucket configuration and policies
- Review storage quota and rate limits

### Learning objective
- Recognize external service failures
- Understand retry strategies and fallback options
- Avoid reporting success when part of an operation failed

### Regression test
**TC-09 and TC-11**:
- Activate defect
- Attempt to upload a valid photo
- Observe failure message
- Choose "Retry" → still fails (defect active)
- Choose "Save without photo" → product saves, no photo
- Deactivate defect
- Edit product, upload photo → succeeds

---

## Optional: Database Permission Troubleshooting Exercise

**Not a teaching defect, but a guided exploration in an isolated development database.**

### Scenario
Create a second test account. Attempt to access the first account's products via direct SQL or API. Observe RLS policy enforcement.

### Setup
1. Create two test accounts: `alice@example.com`, `bob@example.com`
2. Sign in as Alice, create a product
3. Sign in as Bob, attempt to view Alice's product list

### Expected result
Bob sees only his own products (empty list). Attempting to fetch Alice's product by ID returns 403 or an empty result.

### Database inspection
In Supabase SQL Editor:
```sql
-- Signed in as Bob's session
SELECT * FROM products WHERE owner_id != auth.uid();
-- Returns zero rows due to RLS
```

### Learning objective
- Understand row-level security
- Verify that ownership isolation works at the database layer, not just the UI

---

## Defect Deactivation and Reset Procedure

After each teaching defect exercise:

1. **Stop the dev server** (Ctrl+C)
2. **Edit `.env.local`**:
   ```env
   # Comment out or delete the defect variable
   # NEXT_PUBLIC_TEACHING_DEFECT=preview-concat
   ```
3. **Restart the dev server**:
   ```bash
   npm run dev
   ```
4. **Verify reset**: Execute the same test case; it should now pass
5. **Update student worksheet**: Mark "Retest result: Pass"

---

## Facilitator Safety Checklist

Before activating any defect:
- [ ] Confirmed this is a development environment, not production
- [ ] Students have been briefed that this is a controlled teaching failure
- [ ] Reset procedure is documented and ready
- [ ] Students know how to capture evidence before deactivating

After the session:
- [ ] All defects deactivated
- [ ] `.env.local` restored to baseline (no `NEXT_PUBLIC_TEACHING_DEFECT`)
- [ ] Application tested to confirm normal operation

---

## Extending This System

To add a new teaching defect:

1. **Choose a realistic failure mode**: Field validation, network timeout, permission denied, data format mismatch
2. **Implement conditional logic**: Check `process.env.NEXT_PUBLIC_TEACHING_DEFECT` or a feature flag
3. **Add diagnostic clues**: Ensure error messages, logs, and Network responses provide learning value
4. **Write the exercise**:
   - Activation steps
   - Expected symptom
   - Where to look (Console, Network, server log, database)
   - Root cause explanation
   - Corrective action or operational response
   - Regression test
5. **Test the reset**: Confirm the defect is fully reversible
6. **Document in this file**

---

## Summary

Teaching defects are a pedagogical tool, not production features. They help students:
- Practice systematic diagnosis
- Distinguish UI, backend, database, and service failures
- Capture evidence and document corrective actions
- Build confidence in integration testing

Always reset to baseline after each exercise. Never activate defects outside a supervised learning environment.
