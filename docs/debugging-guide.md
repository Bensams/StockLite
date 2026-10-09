# Debugging Guide — StockLite Integration Testing

This guide helps you diagnose issues in StockLite by showing where to look, what to check, and how to distinguish different types of defects.

---

## Quick Diagnosis Flow

```
Issue observed in UI
    ↓
Is there an error message? → Check Browser Console
    ↓
Does the page load? → Check Network tab for failed requests
    ↓
Did the request succeed (200)? → Check what the response contained
    ↓
Does the database show different data? → UI defect, not backend
    ↓
Does the database match what was sent? → Backend correctly processed it
    ↓
Still unclear? → Check server logs for request ID and operation details
```

---

## Tool 1: Browser Console

**How to open**: Press F12 or Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac), then click the **Console** tab.

### What to look for

**Client-side errors**:
```
Uncaught TypeError: Cannot read property 'quantity' of undefined
```
→ Indicates a frontend logic error; the backend was never called.

**Validation feedback**:
```
[ProductForm] Validation failed: Name is required
```
→ Confirms validation ran; the form should display an error message.

**Successful operations**:
```
[ProductForm] Product saved successfully
```
→ The client believes the operation succeeded; verify the database agrees.

### When to check
- First step for any UI misbehavior
- After submitting a form that doesn't respond
- When error messages display unexpectedly

### Common patterns

| Console message | Likely cause |
|----------------|--------------|
| `Failed to fetch` | Network issue, server down, or CORS problem |
| `401 Unauthorized` | Not signed in or session expired |
| `400 Bad Request` | Form data doesn't match API contract |
| `500 Internal Server Error` | Backend or database issue |
| No errors but wrong display | Check component state and database |

---

## Tool 2: Network Tab

**How to open**: F12 → **Network** tab.

### What to look for

**Request details**:
1. Click on a request (e.g., `POST /api/movements`)
2. Check **Headers** → Request Method, Status Code
3. Check **Payload** → What the client sent
4. Check **Preview** or **Response** → What the server returned

**Example: Successful movement**
```
Request:
POST /api/movements
Status: 200 OK

Payload:
{
  "product_id": "abc-123",
  "type": "IN",
  "quantity": 5,
  "note": "Received five",
  "request_id": "xyz-789"
}

Response:
{
  "success": true,
  "movement": {
    "id": "movement-456",
    "resulting_balance": 15
  }
}
```

**Example: Validation failure**
```
Request:
POST /api/movements
Status: 400 Bad Request

Payload:
{
  "product_id": "abc-123",
  "type": "IN",
  "qty": 5,  ← Wrong field name
  "note": "Test"
}

Response:
{
  "error": "Validation failed: Field 'qty' not recognized; expected 'quantity'"
}
```

### When to check
- Form submission doesn't update the UI
- Error message appears but you don't know why
- Data displays incorrectly after reload
- To verify what the client actually sent vs. what you think it sent

### Common patterns

| Status Code | Meaning | Next step |
|-------------|---------|-----------|
| 200 | Success | Check response body; verify UI updated correctly |
| 400 | Bad request | Check payload for missing/incorrect fields |
| 401 | Unauthorized | Sign in again; session may have expired |
| 403 | Forbidden | Trying to access another user's data (RLS working) |
| 404 | Not found | Check product ID or endpoint URL |
| 500 | Server error | Check server logs for details |

---

## Tool 3: Server Logs

**How to view**: Look at the terminal where `npm run dev` is running.

### What to look for

**Request received**:
```
[movements] POST received | Request ID: abc-123
```

**Validation**:
```
[movements] Validation passed | Product: xyz-789 | Type: IN | Quantity: 5
```

**Database operation**:
```
[movements] Calling adjust_stock | Product: xyz-789
```

**Success**:
```
[movements] Movement saved | ID: movement-456 | Resulting balance: 15
```

**Failure**:
```
[movements] Validation failed: Stock out quantity (20) exceeds available stock (12)
Request ID: abc-123
```

### When to check
- Network tab shows 500 error
- Request succeeded (200) but data is unexpected
- Need to trace exactly what the backend received and did

### Request ID correlation

Every request gets a unique ID. Use it to match:
- Client logs (Console): `Request ID: abc-123`
- Network tab: Look for `X-Request-ID` in response headers
- Server logs: `Request ID: abc-123`

This lets you trace one operation end-to-end.

---

## Tool 4: Database Inspection

**How to access**: Supabase dashboard → Table Editor or SQL Editor.

### What to check

**Products table**:
```sql
SELECT id, sku, name, quantity, archived_at
FROM products
WHERE owner_id = '[your-user-id]';
```
→ Verify `quantity` matches what the UI displays.

**Stock movements table**:
```sql
SELECT type, quantity, previous_balance, resulting_balance, note, created_at
FROM stock_movements
WHERE product_id = '[product-id]'
ORDER BY created_at DESC;
```
→ Verify movement history is complete and balances are correct.

**Photo references**:
```sql
SELECT id, name, image_path
FROM products
WHERE image_path IS NOT NULL;
```
→ Check that `image_path` contains a valid storage path.

### When to check
- UI shows incorrect balance but Network shows 200 response
- Need to verify data persistence after reload
- Suspect a race condition (two requests, one lost)
- Testing RLS: confirm other users' data is not visible

### Common patterns

| Observation | Diagnosis |
|-------------|-----------|
| Database shows 15, UI shows 105 | UI defect (rendering or state) |
| Database shows 12, history has three movements | Correct; verify UI reflects this |
| Database empty after save | Request failed or RLS blocked it |
| Balance doesn't match sum of movements | Critical integrity issue; check transaction logic |

---

## Tool 5: Storage Bucket Inspection

**How to access**: Supabase dashboard → Storage → `product-photos` bucket.

### What to check

**Uploaded files**:
- Navigate to `{user-id}/` folder
- Verify file exists with correct name (UUID + extension)
- Check file size and type

**Public vs. Private**:
- Private bucket: files require signed URLs to access
- If you can't access a file directly, that's correct behavior

**Policies**:
- Storage → Policies tab
- Verify authenticated users can upload to their own path
- Verify they cannot upload to another user's path

### When to check
- Photo upload succeeds but doesn't display
- Upload fails with 403 or 401
- Photo displays locally but not in production

### Common patterns

| Symptom | Likely cause |
|---------|--------------|
| Upload succeeds, photo doesn't display | `image_path` not saved to database |
| 403 on upload | Bucket policy missing or incorrect path |
| Photo visible in bucket but broken in UI | Signed URL not generated or expired |
| Upload works locally, fails in production | CORS or bucket policy environment mismatch |

---

## Distinguishing Defect Types

### UI Defect (Frontend Logic)
**Symptoms**:
- Display shows wrong value, but database is correct
- No error in Console or Network
- Reload fixes the display

**Example**: Preview shows "105" instead of 15 (string concatenation).

**Where to fix**: React component state or rendering logic.

---

### Validation Defect
**Symptoms**:
- Form submits invalid data
- Backend returns 400 with validation error
- Client-side validation missing or incorrect

**Example**: Negative quantity accepted by frontend, rejected by backend.

**Where to fix**: Add or correct client-side validation to match backend rules.

---

### API Contract Mismatch
**Symptoms**:
- Network shows 400 Bad Request
- Response says field is missing or unrecognized
- Client sends different field names than backend expects

**Example**: Client sends `{ qty: 5 }`, backend expects `{ quantity: 5 }`.

**Where to fix**: Align client payload with API documentation.

---

### Database Logic Error
**Symptoms**:
- Request succeeds (200)
- Database shows incorrect data
- Movement balances don't add up

**Example**: Stock In 5 units results in balance increasing by 50.

**Where to fix**: Database function or backend calculation logic.

---

### Storage / Service Failure
**Symptoms**:
- Upload request fails (500 or timeout)
- Intermittent; works sometimes, fails others
- Error message mentions service unavailable

**Example**: Supabase Storage returns 500.

**Where to fix**: Check service status, bucket configuration, rate limits, quotas. Implement retry logic.

---

### Permission / RLS Defect
**Symptoms**:
- Request returns 403 Forbidden
- User cannot access their own data, or CAN access another user's data
- Database query returns empty result unexpectedly

**Example**: Product fetch returns empty array even though products exist.

**Where to fix**: RLS policies on database tables or Storage bucket policies.

---

## Step-by-Step Diagnostic Procedure

### Scenario: "Stock In doesn't update the balance"

1. **Check Console**: Any errors?
   - No errors → Continue
   - Error present → Read the message, fix the client code

2. **Check Network**: Did the request send?
   - Request sent, status 200 → Backend succeeded, check database
   - Request sent, status 400/500 → Read response error, check payload vs. API contract
   - No request sent → Client validation blocked it or button didn't trigger

3. **Check Server logs**: What did the backend do?
   - "Movement saved" → Operation succeeded, verify database
   - "Validation failed" → Payload didn't meet requirements
   - No log entry → Request never reached the backend (routing issue)

4. **Check Database**: What's the actual balance?
   - Balance correct → UI not refreshing, force reload or check state update
   - Balance incorrect → Database function error
   - No new movement row → Transaction rolled back, check logs for why

5. **Reload and verify**: Does the correct data appear after reload?
   - Yes → UI state issue, not persistence
   - No → Data never saved correctly

---

## Common Defects and Fixes

### Defect: Preview shows "105" instead of 15
**Diagnosis**: String concatenation instead of arithmetic  
**Check**: Console (no error), Database (15 is correct)  
**Fix**: `Number(a) + Number(b)` instead of `a + b`

### Defect: Movement rejected with "Field 'qty' not recognized"
**Diagnosis**: API contract mismatch  
**Check**: Network → Payload shows `{ qty: 5 }`  
**Fix**: Change client to send `{ quantity: 5 }`

### Defect: Photo upload fails with 403
**Diagnosis**: Storage bucket policy missing  
**Check**: Supabase Storage → Policies  
**Fix**: Add policy allowing authenticated users to upload to `{user-id}/*`

### Defect: Stock Out above balance succeeds
**Diagnosis**: Backend validation missing  
**Check**: Database shows negative balance  
**Fix**: Add server-side check: `IF new_balance < 0 THEN RAISE EXCEPTION`

### Defect: Balance doesn't update after movement
**Diagnosis**: UI state not refreshing  
**Check**: Database shows correct balance, reload fixes it  
**Fix**: Call `router.refresh()` or state update after successful movement

---

## When to Use Which Tool

| Symptom | Start here |
|---------|------------|
| Error message visible | Browser Console |
| Form doesn't respond | Network tab (check if request sent) |
| Wrong data displays | Database inspection (verify what's stored) |
| Operation partially succeeds | Network + Server logs (trace the flow) |
| Photo won't upload | Network + Storage bucket inspection |
| Works locally, fails in production | Environment variables + Storage policies |

---

## Debugging Checklist Template

Use this when investigating a defect:

```
Issue: [Brief description]

1. Console errors: [Yes/No, message]
2. Network request: [Sent/Not sent, Status code, Payload]
3. Server log: [Request ID, Operation, Outcome]
4. Database state: [Expected vs. Actual]
5. Storage state (if applicable): [File present/missing, Path correct]

Diagnosis: [UI / Validation / Contract / Database / Service / Permission]
Root cause: [Specific explanation]
Corrective action: [What code to change]
Verification: [How to confirm the fix worked]
```

---

## Tips for Effective Debugging

1. **Start with the symptom, not assumptions**: Don't guess; check what actually happened.
2. **Clear Console and Network before testing**: Old logs are confusing.
3. **Use request IDs to trace end-to-end**: Match Console → Network → Server log.
4. **Reload to test persistence**: If it disappears on reload, it wasn't saved.
5. **Check the database directly**: The database is the source of truth.
6. **Compare working vs. broken**: If one operation works and another doesn't, diff the payloads.
7. **Isolate the layer**: Is it frontend, backend, database, or external service?
8. **Document what you tried**: Helps avoid repeating failed attempts.

---

## Further Reading

- `docs/api-reference.md` — Expected request and response formats
- `teaching/defects.md` — Controlled teaching defect activation and symptoms
- `teaching/test-worksheet.md` — Systematic test cases to execute
- Supabase documentation — Storage policies and RLS examples
