# Debugging Guide — StockLite Integration Testing

How to find out **which layer** failed (UI, API, database, or storage), what evidence to capture, and what each StockLite error means. Examples are real output from the app.

---

## The Layers and Where to Look

```
Browser UI (app/page.tsx) ──fetch──▶ API routes (app/api/*) ──RPC──▶ PostgreSQL functions + RLS (Supabase)
        │                                   │
   DevTools Console                    Server terminal                  Supabase Table Editor
   DevTools Network                    (npm run dev)
                                            └──upload──▶ Supabase Storage (bucket: product-photos)
```

| Layer | Tool | What it tells you |
|---|---|---|
| UI | What the screen shows; DevTools **Console** | Displayed values, JavaScript errors |
| UI ↔ API | DevTools **Network** | Exactly what was sent (payload) and returned (status + body) |
| API | **Server terminal** | Which operation ran, its `request_id`, success or failure, status |
| Database | Supabase **Table Editor** | What is actually stored (the source of truth) |
| Storage | Supabase **Storage → product-photos** | Whether the file exists, and the bucket policies |

---

## Quick Diagnosis Flow

1. **Reproduce** the problem once with known inputs. Clear the Console and Network tab first.
2. **Network**: did a request go out?
   - No request → the browser blocked it (form validation such as `required` or `min`) or the button never fired. **UI layer.**
   - Request went out → note the **status** and read the response `error` message.
3. **Status 200 but the screen is wrong?** Compare the response body with what is displayed. Response correct, display wrong → **UI defect**.
4. **Status 4xx/5xx?** Read the message (table below), check the **payload** against `docs/api-reference.md`, then find the server log line with the same `request_id`.
5. **Database**: confirm what was stored. If the UI and the database disagree, the database is right.
6. **Classify** the defect (UI / validation / contract / database / service / permission / configuration), write the corrective action, **retest**.

---

## Tool 1: Browser Console

**Open**: F12 or Ctrl+Shift+I → **Console**.

StockLite does not print messages on success, so a clean Console is normal. What you may see:

| Console line | Meaning |
|---|---|
| `POST http://localhost:3000/api/movements 422 (Unprocessable Entity)` | A request failed; open the Network tab for details |
| `Uncaught TypeError: …` | A JavaScript bug in the page itself |
| `Failed to fetch` / `net::ERR_CONNECTION_REFUSED` | The dev server is not running or not reachable |
| Nothing, but the display is wrong | Check the Network response and the database: likely a UI calculation defect |

You can also run requests here (see "Trying the API Yourself" in `docs/api-reference.md`).

---

## Tool 2: Network Tab

**Open**: F12 → **Network** → filter **Fetch/XHR**. Click a request, then use:
- **Headers**: method, URL, status code
- **Payload**: what the browser sent
- **Response**: what the server returned

**Successful movement** (`POST /api/movements`, 200):
```json
// Payload
{ "product_id": "…", "type": "IN", "quantity": 5, "note": "Received five", "request_id": "…" }

// Response
{ "data": { "type": "IN", "quantity": 5, "previous_balance": 10, "resulting_balance": 15, … },
  "request_id": "4f0c…" }
```

**Contract mismatch** (`POST /api/movements`, 422):
```json
// Payload: "amount" instead of "quantity"
{ "product_id": "…", "type": "IN", "note": "Received five", "request_id": "…", "amount": 5 }

// Response
{ "error": "Send quantity as a positive whole number, a short note, product ID, type, and request ID.",
  "request_id": "a7cb…" }
```

Right-click a request → **Copy → Copy as fetch** to replay it from the Console with one value changed.

---

## Tool 3: Server Terminal

**Where**: the terminal running `npm run dev`. Each API call prints one JSON line from StockLite, followed by Next.js's own request line:

```
{"operation":"products.list","request_id":"19c2f0cc-…","outcome":"failure","status":401}
 GET /api/products 401 in 150ms (next.js: 117ms, application-code: 33ms)
{"operation":"movements.adjust","request_id":"7ae1919b-…","outcome":"failure","status":403}
 POST /api/movements 403 in 63ms (next.js: 52ms, application-code: 10ms)
```

| Field | Values |
|---|---|
| `operation` | `products.list`, `products.save`, `products.manage`, `movements.list`, `movements.adjust`, `photos.upload`, `photos.cleanup` |
| `request_id` | Same value as in the Network response body. Use it to match the two. |
| `outcome` / `status` | `success` / 200, or `failure` / the error code |

The log deliberately contains **no** emails, passwords, keys, or product data. Good logging records *what happened* without leaking secrets. These lines appear only in development; `/api/auth` and `/api/config` do not log.

**No line at all?** The request never reached the API: check the URL, whether the server is running, or whether the browser blocked the form.

---

## Tool 4: Database (Supabase Dashboard)

**Where**: Supabase dashboard → **Table Editor** → `products` or `stock_movements`.

| Check | Where to look |
|---|---|
| Current balance | `products.quantity` |
| Movement history | `stock_movements`: `type`, `quantity`, `previous_balance`, `resulting_balance`, `note`, `created_at` |
| Photo reference | `products.image_path` (`<user-id>/<uuid>.<ext>`) |

Healthy data always satisfies `resulting_balance = previous_balance ± quantity`. The database enforces this with a CHECK constraint.

**Caution**: the dashboard and SQL Editor run as an administrator and **bypass Row Level Security**. You will see every account's rows there. To test isolation, use the app or the API while signed in as the other account.

---

## Tool 5: Storage (Supabase Dashboard)

**Where**: Supabase dashboard → **Storage** → `product-photos`.

- Files live in a folder named after the owner's user ID: `<user-id>/<uuid>.png`
- The bucket is **private**; images are shown through signed URLs that expire after 5 minutes
- **Policies** tab: authenticated users may read, upload, and delete only inside their own folder

| Symptom | Likely cause |
|---|---|
| Photo shows "Photo unavailable. Use Refresh inventory…" | Signed URL expired or could not be created; click **Refresh inventory** |
| Upload → 503 "Photo upload failed…" | Bucket missing, policy missing, or Storage unreachable |
| Save → 422 "Photo was not found in your storage…" | `image_path` points to a file that is not in your folder |

---

## Defect Types

| Type | Symptom | Example in StockLite | Where to fix |
|---|---|---|---|
| **UI defect** | Screen wrong, Network response and database right | Stock In preview shows 105 instead of 15 (teaching defect `preview`) | Page/component logic |
| **Validation gap** | The browser lets bad input through, and the server rejects it with 422 | Quantity 1.5 sent via Console → 422 | Add matching client-side checks; keep server checks |
| **Contract mismatch** | 422; payload field names differ from the API contract | `amount` sent instead of `quantity` (teaching defect `mismatch`) | Make the client follow `docs/api-reference.md` |
| **Business-rule rejection** (not a defect) | 409 with a clear message | Stock Out 13 when 12 are on hand | Nothing; this is correct behavior |
| **Database logic error** | 200, but stored numbers are wrong | (Would be: Stock In 5 adds 50) | Database function |
| **External service failure** | 503; no false success | Photo storage down (teaching defect `storage`) | Operational: retry, check provider status |
| **Permission / isolation** | Own data missing, **or** another account's data visible | Another account's product returns 404 (correct) | RLS / storage policies |
| **Configuration** | 503 "Service is not configured…" or a "Setup required" banner | Missing `.env.local` values | Environment variables, then restart |

---

## Troubleshooting Table: Every StockLite Error Message

| Message | Status | Layer | What to do |
|---|---|---|---|
| Your session has ended. Sign in again. | 401 | Auth | Sign in again |
| Sign in failed. Check your classroom credentials and connection, then retry. | 401 | Auth | Check email/password; the account must exist in Supabase Auth |
| Enter your classroom email and password. | 422 | Auth | Fill both fields |
| Cross-site request blocked. Open StockLite directly. | 403 | API | Use the app's own address; don't post from another site |
| Check your request and try again. | 400 | API | Body is not valid JSON; inspect the payload |
| Send quantity as a positive whole number, a short note, product ID, type, and request ID. | 422 | API validation | Compare payload with the movement contract |
| *field*: *problem*; … (e.g. `sku: Too small…`) | 422 | API validation | Fix the named product fields |
| Invalid values. Check the fields and retry. | 422 | Database rule | A database CHECK rejected a value |
| Select a valid product. / Choose a product and valid action. | 422 | API validation | ID or action malformed |
| Product not found. Refresh your inventory. | 404 | Database (RLS) | Product deleted, or it belongs to another account |
| Not enough stock. Reduce the quantity and retry. | 409 | Database rule | Expected for overdraws |
| Restore this product before adjusting stock. | 409 | Database rule | Product is archived |
| This product has movement history. Archive it instead. | 409 | Database rule | History is kept for auditing |
| This SKU already exists in your inventory. Choose another SKU. | 409 | Database unique rule | Use a different SKU |
| This request ID was already used for different values. Start a new movement. | 409 | Database idempotency | Change something and submit as a new movement |
| This movement exceeds the stock limit. | 409 | Database rule | Balance limit is 1,000,000,000 |
| Choose a JPEG, PNG, or WebP image. / Choose a nonempty image no larger than 2 MB. | 422 | API validation | Pick a valid file |
| The image contents do not match its type. … | 422 | API validation | The file is not really an image of that type |
| Photo was not found in your storage. Upload it again. | 422 | Database ↔ Storage | Re-upload the photo |
| Photo upload failed. Retry, or choose Save without selected photo. | 503 | Storage | Retry; check bucket and policies; or save without the photo |
| Teaching simulation: storage unavailable. … | 503 | Teaching defect | Facilitator resets `TEACHING_DEFECT` |
| The inventory service could not complete this request. Retry with the same values. | 503 | Database / network | Retry; safe for movements thanks to the request ID |
| Service is not configured. Ask your facilitator to complete .env.local. | 503 | Configuration | Set Supabase URL and publishable key, restart |

---

## Worked Procedure: "Stock In doesn't update the balance"

1. **Network**: is there a `POST /api/movements`?
   - None → the form blocked it (empty note? quantity < 1?)
   - 422 → payload problem: compare with the contract
   - 409 → business rule: read the message (archived? not enough stock?)
   - 401 → signed out
   - 503 → service problem: retry with the same values
   - 200 → continue
2. **Server log**: find the `movements.adjust` line with the same `request_id`. Is the outcome `success`?
3. **Database**: does `stock_movements` have the new row with the right balances?
4. **UI**: after a 200, the page re-fetches `/api/products` and `/api/movements`. Did those succeed? Does a reload show the right balance?
   - Reload fixes it → UI state defect
   - Reload still wrong but the database is right → display/calculation defect

---

## Evidence Checklist (per failed test)

```
Test ID / scenario:
1. UI: what appeared (screenshot)
2. Network: method, URL, status, payload, response (screenshot)
3. Server log: the line with the matching request_id (copy text)
4. Database / Storage: actual stored state (screenshot)
Classification: UI / Validation / Contract / Database / Service / Permission / Configuration
Root cause:
Corrective action:
Retest result: Pass / Fail
```

---

## Tips

1. **Change one thing at a time** and retest.
2. **Clear Console and Network** before reproducing.
3. **Use the `request_id`** to connect the browser to the server log.
4. **Reload to test persistence**: if it disappears, it was never saved.
5. **Trust the database** over the screen.
6. **Compare a working request with a failing one**: diff the payloads.
7. **Never paste keys or passwords** into screenshots, logs, or reports.

---

## Further Reading

- `docs/api-reference.md`: request/response contracts and status codes
- `teaching/defects.md`: controlled teaching defects (activation, symptoms, fixes)
- `teaching/test-worksheet.md`: test cases to execute
- Supabase docs: Row Level Security, Storage access control
