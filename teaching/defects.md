# Teaching Defects — Controlled Failures for Integration Testing

**Purpose**: StockLite can switch on one intentional defect at a time so students can practice tracing a failure across the UI, API, database, and storage, then document the corrective action. The baseline application is correct. Defects run only on the development server (`npm run dev`).

Everything below was checked against `app/page.tsx`, `app/api/*/route.ts`, and `lib/server.ts`.

---

## The Switch

| Setting | Value |
|---|---|
| Variable (in `.env.local`) | `TEACHING_DEFECT` — no `NEXT_PUBLIC_` prefix |
| Allowed values | `preview`, `mismatch`, `storage` |
| Off | Blank (`TEACHING_DEFECT=`) or line removed |
| Where it is read | `defect()` in `lib/server.ts` |
| Production guard | `defect()` returns a value only when `NODE_ENV=development`. `npm run build` / `npm start` ignore the variable (covered by `tests/security.test.ts`). |

When a defect is on, every signed-in user sees a yellow banner:

> Development teaching defect active: mismatch. Authoritative stock calculations remain in PostgreSQL.

The banner is how you confirm the switch worked. You can also open `http://localhost:3000/api/config` and check that `"defect"` shows the value.

### Activate

1. Stop the dev server (Ctrl+C in its terminal).
2. In `.env.local`, add or edit the line, for example:
   ```env
   TEACHING_DEFECT=mismatch
   ```
3. Start the server again: `npm run dev`
4. Refresh the browser and confirm the banner. Signed-in users stay signed in across the restart.

### Reset

1. Stop the dev server.
2. Set `TEACHING_DEFECT=` (blank) or delete the line.
3. `npm run dev`, refresh, confirm the banner is gone (`/api/config` shows `"defect":""`).

Only one defect can be active at a time. Reset before switching to the next one.

---

## Defect A — `preview`: Balance preview adds text instead of numbers

### Activation
```env
TEACHING_DEFECT=preview
```

### Where it appears
The **Balance preview** line on the Adjust stock form, **Stock In only**. Stock Out previews and all saved data are unaffected.

### Reproduce
1. Open a product with balance **10**.
2. Movement type **Stock In**, quantity **5**.
3. Preview reads **"Balance preview: 105 units"** (should be 15).
4. Enter a note and click **Save movement**.
5. The saved history shows **10 → 15** and the balance is **15**.

### Evidence to capture
| Tool | What it shows |
|---|---|
| UI | Preview 105, but saved balance 15 |
| Console | No errors |
| Network | `POST /api/movements` → **200**; payload `"quantity": 5` (a number); response `data.resulting_balance: 15` |
| Server log | `{"operation":"movements.adjust","request_id":"…","outcome":"success","status":200}` |
| Database | `stock_movements` row: `previous_balance 10`, `resulting_balance 15` |

### Classification
**UI defect.** Only the on-screen calculation is wrong; API and database are correct.

### Root cause
A form input's value is always a **string**. In teaching mode the preview joins the two values as text (`app/page.tsx`, `MovementForm`):
```ts
// Defective branch (teaching mode only)
String(p.quantity) + quantity        // "10" + "5" → "105"
```

### Corrective action
Convert the input to a number before doing arithmetic. This is the code that runs when the defect is off:
```ts
p.quantity + (type === 'IN' ? Number(quantity) : -Number(quantity))   // 10 + 5 → 15
```
Do not change the database arithmetic; it was never wrong.

### Retest
Reset, open the same product, enter Stock In 5 → preview shows the correct sum.

---

## Defect B — `mismatch`: Client sends the wrong field name

### Activation
```env
TEACHING_DEFECT=mismatch
```

### Where it appears
Every **Save movement** (Stock In and Stock Out). In teaching mode the form renames `quantity` to `amount` before sending.

### Reproduce
1. Open a product with balance **10**.
2. Stock In, quantity **5**, note **Received five**, click **Save movement**.
3. A red notice appears:
   > Send quantity as a positive whole number, a short note, product ID, type, and request ID.
4. The balance stays **10**.

### Evidence to capture
| Tool | What it shows |
|---|---|
| Network → Payload | `{"product_id":"…","type":"IN","note":"Received five","request_id":"…","amount":5}` — **no `quantity`** |
| Network → Status | **422 Unprocessable Entity** |
| Network → Response | `{"error":"Send quantity as a positive whole number, a short note, product ID, type, and request ID.","request_id":"…"}` |
| Console | Red line: `POST http://localhost:3000/api/movements 422 (Unprocessable Entity)` |
| Server log | `{"operation":"movements.adjust","request_id":"<same ID as the response>","outcome":"failure","status":422}` |
| Database | No new `stock_movements` row; `products.quantity` unchanged |

Point out that the `request_id` in the Network response matches the server log line exactly. That is how you connect one browser request to one server event.

### Diagnosis
Compare the payload with the contract for `POST /api/movements` in `docs/api-reference.md`: the field must be named `quantity`. The API route validates the body with a **strict** schema (`movementSchema` in `lib/validation.ts`), so the unknown field `amount` and the missing `quantity` are both rejected **before** the database is called.

### Classification
**API contract mismatch** between frontend and backend.

### Root cause
```ts
// Defective branch (teaching mode only) — app/page.tsx, MovementForm
if (defect === 'mismatch') { body.amount = body.quantity; delete body.quantity; }
```

### Corrective action
Send the field name the contract defines (`quantity`); remove the rename. Do **not** loosen the server schema to accept `amount`. The contract is the agreement both sides must follow.

### Retest
Reset, submit the same values → **200**, history shows 10 → 15.

---

## Defect C — `storage`: Photo storage is unavailable

### Activation
```env
TEACHING_DEFECT=storage
```

### Where it appears
Any product save that includes a **new photo** (Add or Edit). Saves without a photo are unaffected.

### Reproduce
1. Open a product → **Edit product / photo**.
2. Choose a valid PNG or JPEG under 2 MB → **Save product**.
3. A red notice appears:
   > Teaching simulation: storage unavailable. Retry after the facilitator resets the exercise, or explicitly save without a photo.
4. The form stays open with all values kept. A checkbox appears: **Save without selected photo (explicit recovery choice)**.

### Evidence to capture
| Tool | What it shows |
|---|---|
| Network | `POST /api/photos` → **503 Service Unavailable**; no product save request follows it |
| Network → Response | `{"error":"Teaching simulation: storage unavailable. …","request_id":"…"}` |
| Console | Red line: `POST http://localhost:3000/api/photos 503 (Service Unavailable)` |
| Server log | `{"operation":"photos.upload","request_id":"…","outcome":"failure","status":503}` |
| Storage / Database | No new file in `product-photos`; product unchanged |

### How it works
The `/api/photos` route returns 503 **before** contacting Supabase Storage. It imitates a provider outage without misconfiguring anything.

### Expected recovery (what the app should do)
1. **Retry**: still fails while the defect is active (correct behavior).
2. **Tick "Save without selected photo"** → Save → notice: *"Product saved without the selected photo; any existing photo was retained unless Remove was selected."*
3. **Reset the defect**, edit the product, upload again → succeeds.

### Classification
**External service failure.** No code fix. The corrective action is operational (check the provider's status, retry later) plus confirming the app handled it well: clear message, no false success, user can continue.

### Real-world counterpart
If a real upload fails (for example, a missing bucket policy), the same route returns **503** *"Photo upload failed. Retry, or choose Save without selected photo."* Check Supabase → Storage → `product-photos` → Policies.

---

## Using the Defects in Session 2

- **Demo 2** (live demonstration) uses `mismatch`.
- If students test StockLite on the facilitator's server during the Integration Test Challenge, switch defects at about minutes 10 (`preview`), 20 (`mismatch`), and 30 (`storage`). Each switch needs a server restart (a few seconds). **Announce before restarting.**
- Students cannot switch defects themselves unless they run their own copy of StockLite.

---

## Optional Exploration: Ownership Isolation (not a defect)

Two accounts, A and B, each see only their own inventory. Row Level Security (RLS) hides other owners' rows, so the app answers **"not found"**, not 403.

1. Signed in as **A**: Network tab → `GET /api/products` → copy a product `id` from the response.
2. Sign out, sign in as **B**, open DevTools → Console, and run:
   ```js
   await fetch('/api/movements?product_id=PASTE_A_ID').then(r => r.json())
   // → { data: [], request_id: "…" }   (B cannot see A's history)

   await fetch('/api/products', {
     method: 'PATCH',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ id: 'PASTE_A_ID', action: 'archive' })
   }).then(r => r.status)
   // → 404  ("Product not found. Refresh your inventory.")
   ```

**Photos**: a product photo URL is a *signed URL* that works for 5 minutes for anyone who has the link. That is how temporary links work. B cannot list or download A's files through the Storage API; `npm run test:live` checks this.

**Database inspection caution**: the Supabase SQL Editor runs as an administrator and **bypasses RLS**, so it cannot demonstrate isolation. Use the app or the API as account B.

---

## Facilitator Safety Checklist

Before activating:
- [ ] Running `npm run dev` on a development project (never production)
- [ ] Students told this is a controlled failure
- [ ] Reset steps ready
- [ ] Students know to capture evidence before you reset

After the session:
- [ ] `TEACHING_DEFECT=` is blank and the server restarted
- [ ] Banner gone; `/api/config` shows `"defect":""`
- [ ] Stock In 10 + 5 works normally (TC-04)
- [ ] `.env.local` was never shown on the projector or committed

---

## Adding a New Teaching Defect

1. On the server, branch on `defect()` from `lib/server.ts`. In the page, branch on `config.defect` (delivered by `/api/config`).
2. Never use a `NEXT_PUBLIC_` variable. It is baked into the browser bundle at build time and would bypass the development-only guard.
3. Make the failure leave clues in the Network response, the server log, and the UI message.
4. Add a unit test next to the existing ones in `tests/security.test.ts`.
5. Document it here: activation, reproduce steps, evidence table, root cause, corrective action, retest.
