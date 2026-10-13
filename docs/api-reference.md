# API Reference — StockLite Backend Contracts

This is the contract between StockLite's browser UI (`app/page.tsx`) and its Next.js Route Handlers (`app/api/*/route.ts`). Each entry was checked against the source code. When a request "doesn't work", compare what the Network tab shows with this page.

---

## Conventions

**Base URL**: the address of the running app, e.g. `http://localhost:3000`. All endpoints are under `/api`.

**Authentication**: a session cookie set by `POST /api/auth`. The browser sends it automatically on same-site requests. There is no `Authorization` header to manage.

**Body format**: JSON (`Content-Type: application/json`), except photo upload (`multipart/form-data`).

**Strict bodies**: request bodies are validated with Zod schemas (`lib/validation.ts`). Missing required fields **and unknown extra fields** are rejected.

**Response envelope** (all endpoints except `/api/auth` and `/api/config`):

```json
// Success: HTTP 200
{ "data": { … }, "request_id": "4f0c…-uuid" }

// Failure: HTTP 4xx/5xx
{ "error": "Human-readable message shown in the UI", "request_id": "4f0c…-uuid" }
```

The same `request_id` is printed in the server log (development only), one JSON line per API call:

```
{"operation":"movements.adjust","request_id":"4f0c…-uuid","outcome":"failure","status":422}
 POST /api/movements 422 in 31ms
```

Responses include `Cache-Control: no-store`.

**Cross-site protection**: a write request (`POST`, `PUT`, `PATCH`, `DELETE`) whose `Origin` header is a different site is rejected with **403** *"Cross-site request blocked. Open StockLite directly."*

### Status codes used by StockLite

| Code | Meaning in StockLite | Typical message |
|---|---|---|
| **200** | Success | — |
| **400** | Request body could not be read (e.g. not valid JSON) | "Check your request and try again." |
| **401** | Not signed in / session ended | "Your session has ended. Sign in again." |
| **403** | Write request came from another site | "Cross-site request blocked. Open StockLite directly." |
| **404** | Product does not exist **or belongs to another account** | "Product not found. Refresh your inventory." |
| **409** | Request conflicts with current data (stock, archive state, duplicates) | "Not enough stock. Reduce the quantity and retry." |
| **422** | Values break the rules (validation) | "Send quantity as a positive whole number, …" |
| **503** | A service (database, storage, configuration) could not complete the request | "Photo upload failed. Retry, or choose Save without selected photo." |

StockLite never returns 500 on purpose. Errors are caught and translated into one of the codes above.

---

## Endpoint Summary

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth` | Sign in or sign out |
| GET | `/api/config` | Is the app configured? Who is signed in? Is a teaching defect on? |
| GET | `/api/products` | List your products |
| POST | `/api/products` | Create a product |
| PUT | `/api/products?id=<uuid>` | Update a product's details |
| PATCH | `/api/products` | Archive, restore, or delete a product |
| GET | `/api/movements` | List stock movements (optionally for one product) |
| POST | `/api/movements` | Stock In / Stock Out |
| POST | `/api/photos` | Upload a product photo |
| DELETE | `/api/photos` | Remove an unused photo |

---

## Auth

### POST /api/auth — sign in

```json
{ "email": "group@example.edu", "password": "••••••••" }
```

| Result | Status | Body |
|---|---|---|
| Signed in (session cookies set) | 200 | `{ "data": { "ok": true } }` |
| Email or password missing | 422 | `{ "error": "Enter your classroom email and password." }` |
| Wrong credentials | 401 | `{ "error": "Sign in failed. Check your classroom credentials and connection, then retry." }` |
| Supabase Auth unavailable / app not configured | 503 | error message |

Accounts are created by the facilitator in the Supabase dashboard. There is no sign-up endpoint.

### POST /api/auth — sign out

```json
{ "action": "logout" }
```
→ 200 `{ "data": { "ok": true } }`

### GET /api/config

Public. Used by the page on load.

```json
{ "data": { "configured": true, "email": "group@example.edu", "defect": "" } }
```
`email` is `null` when signed out. `defect` is the active teaching defect (`preview`, `mismatch`, `storage`) or `""`. It is always `""` outside `npm run dev`.

---

## Products

### GET /api/products

Returns **only the signed-in account's** products, newest first (Row Level Security).

```json
{
  "data": [
    {
      "id": "uuid", "owner_id": "uuid",
      "sku": "PEN-BLUE", "name": "Blue ballpoint pens", "category": "Writing",
      "price_centavos": 1250, "quantity": 10, "low_stock_threshold": 3,
      "image_path": "owner-uuid/photo-uuid.png", "archived_at": null,
      "created_at": "…", "updated_at": "…",
      "image_url": "https://…signed…", "photo_error": false
    }
  ],
  "request_id": "…"
}
```
`image_url` is a signed URL valid for **5 minutes**; it is present only when the product has a photo. Prices are stored in **centavos** (₱12.50 → `1250`).

### POST /api/products — create

| Field | Type | Rule |
|---|---|---|
| `sku` | string | 1–40 characters, trimmed, stored uppercase, unique per account |
| `name` | string | 1–120 characters |
| `category` | string | 1–60 characters |
| `price_centavos` | integer | 0 – 1,000,000,000 |
| `opening_quantity` | integer | ≥ 0 (default 0) |
| `low_stock_threshold` | integer | 0 – 1,000,000,000 |
| `image_path` | string or null | A path returned by `POST /api/photos` (default null) |

```json
{ "sku": "PEN-BLUE", "name": "Blue ballpoint pens", "category": "Writing",
  "price_centavos": 1250, "opening_quantity": 10, "low_stock_threshold": 3, "image_path": null }
```

→ 200, `data` is the saved product. If `opening_quantity` > 0, an **"Opening stock"** IN movement is recorded at the same time.

| Error | Status | Message |
|---|---|---|
| Field rules broken | 422 | Field list, e.g. `sku: Too small: expected string to have >=1 characters; price_centavos: Too small: expected number to be >=0` |
| Unknown field sent | 422 | e.g. `: Unrecognized key: "colour"` |
| SKU already used in this account | 409 | "This SKU already exists in your inventory. Choose another SKU." |
| `image_path` is not your uploaded file | 422 | "Photo was not found in your storage. Upload it again." |

### PUT /api/products?id=&lt;uuid&gt; — update

Same body as create, but `opening_quantity` must be `0`. Balances change **only** through stock movements.

| Error | Status | Message |
|---|---|---|
| `id` is not a valid UUID | 422 | "Select a valid product." |
| Product not found / not yours | 404 | "Product not found. Refresh your inventory." |
| `opening_quantity` not 0, or other invalid values | 422 | "Invalid values. Check the fields and retry." |
| Duplicate SKU | 409 | "This SKU already exists in your inventory. Choose another SKU." |

### PATCH /api/products — archive / restore / delete

```json
{ "id": "product-uuid", "action": "archive" }
```
`action` is `archive`, `restore`, or `delete` → 200 `{ "data": { "ok": true } }`

| Error | Status | Message |
|---|---|---|
| Bad `id` or `action` | 422 | "Choose a product and valid action." |
| Product not found / not yours | 404 | "Product not found. Refresh your inventory." |
| Delete a product that has movements | 409 | "This product has movement history. Archive it instead." |

---

## Stock Movements

### GET /api/movements

Optional query: `?product_id=<uuid>`. Returns the account's movements, newest first, at most 500.

```json
{
  "data": [
    { "id": "uuid", "product_id": "uuid", "owner_id": "uuid", "type": "IN", "quantity": 5,
      "previous_balance": 10, "resulting_balance": 15, "note": "Received five",
      "request_id": "uuid", "created_at": "…" }
  ],
  "request_id": "…"
}
```
Another account's `product_id` returns an empty list, not an error.

### POST /api/movements — Stock In / Stock Out

| Field | Type | Rule |
|---|---|---|
| `product_id` | UUID | Required |
| `type` | string | `"IN"` or `"OUT"` |
| `quantity` | integer | **Required.** 1 – 1,000,000,000 |
| `note` | string | **Required.** 1–200 characters |
| `request_id` | UUID | **Required.** Generated by the browser for each new movement |

```json
{ "product_id": "uuid", "type": "IN", "quantity": 5, "note": "Received five", "request_id": "uuid" }
```

→ 200, `data` is the saved movement (`previous_balance`, `resulting_balance`, …).

The database function `adjust_stock` locks the product row, checks the new balance, updates the product, and writes the movement **in one transaction**. Either both change or neither does.

**Idempotency (safe retries)**: sending the **same `request_id` with the same values** again returns the original movement with 200 and does **not** apply it twice. The form reuses the ID when you retry unchanged values after a failed or uncertain attempt.

| Error | Status | Message |
|---|---|---|
| Missing/extra/invalid fields (e.g. `amount` instead of `quantity`, 0, −1, 1.5) | 422 | "Send quantity as a positive whole number, a short note, product ID, type, and request ID." |
| Stock Out more than the balance | 409 | "Not enough stock. Reduce the quantity and retry." |
| Product is archived | 409 | "Restore this product before adjusting stock." |
| Balance would exceed 1,000,000,000 | 409 | "This movement exceeds the stock limit." |
| Same `request_id`, different values | 409 | "This request ID was already used for different values. Start a new movement." |
| Product not found / not yours | 404 | "Product not found. Refresh your inventory." |

---

## Photos (Supabase Storage)

### POST /api/photos — upload

`multipart/form-data` with one field, `file`: JPEG, PNG, or WebP, at most 2 MB. The file's first bytes must match its declared type.

→ 200 `{ "data": { "path": "<your-user-id>/<random-uuid>.png" }, "request_id": "…" }`

Then send that `path` as `image_path` in the product create/update. Files go to the **private** bucket `product-photos`, inside a folder named after your user ID.

| Error | Status | Message |
|---|---|---|
| No file | 422 | "Select a photo first." |
| Wrong type | 422 | "Choose a JPEG, PNG, or WebP image." |
| Empty or over 2 MB | 422 | "Choose a nonempty image no larger than 2 MB." |
| Contents don't match the type (e.g. a renamed .txt) | 422 | "The image contents do not match its type. Choose a valid JPEG, PNG, or WebP." |
| Storage rejected or unreachable | 503 | "Photo upload failed. Retry, or choose Save without selected photo." |
| Teaching defect `storage` active | 503 | "Teaching simulation: storage unavailable. …" |

### DELETE /api/photos — remove an unused photo

```json
{ "path": "<your-user-id>/<uuid>.png" }
```
→ 200 `{ "data": { "ok": true } }`. The UI calls this to clean up after a failed save or a photo replacement.

| Error | Status | Message |
|---|---|---|
| Path not in your folder | 404 | "Photo not found." |
| A product still uses it | 409 | "Photo is still in use. Save the new product reference first." |
| Storage unavailable | 503 | "The unused photo could not be removed. …" |

---

## Database Layer (called by the API, not by the browser)

| Function | Called by | Does |
|---|---|---|
| `save_product(p_id, p_data)` | POST/PUT `/api/products` | Insert or update a product; records the opening movement |
| `adjust_stock(p_product_id, p_type, p_quantity, p_note, p_request_id)` | POST `/api/movements` | Atomic, idempotent balance change + movement record |
| `manage_product(p_id, p_action)` | PATCH `/api/products` | Archive, restore, or delete (delete only without history) |

Signed-in users may only **read** the `products` and `stock_movements` tables, and only their own rows (RLS). All writes go through these functions. Direct inserts or updates are refused. See `supabase/migrations/001_inventory.sql`.

---

## Trying the API Yourself

Requests need your session cookie, so the easiest place is the **DevTools Console of a signed-in StockLite tab**:

```js
// List products
await fetch('/api/products').then(r => r.json())

// Send an invalid movement and read the status
const r = await fetch('/api/movements', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ product_id: 'PASTE_ID', type: 'IN', quantity: 1.5, note: 'test', request_id: crypto.randomUUID() })
});
r.status;          // 422
await r.json();    // { error: "Send quantity as …", request_id: "…" }
```

Tip: in the Network tab, right-click a request → **Copy → Copy as fetch**, paste it into the Console, change one value, and run it. That is a quick way to test server-side validation that the form normally blocks.
