# Database and permissions

Apply `supabase/migrations/001_inventory.sql` once to a **fresh** Supabase project using SQL Editor (trusted project administrator). Do not rerun it over an existing installation; maintain later changes as new numbered migrations. The migration also creates the private Storage bucket and policies. Inspect successful SQL output before provisioning the class.

## Schema
- `products`: UUID id, owner FK to Auth, normalized SKU, name/category, exact `price_centavos bigint`, quantity, low-stock threshold, nullable image path and archive timestamp, timestamps. Unique `(owner_id,sku)` allows the same SKU in different accounts, including after archive. Opening stock is not an editable column: it is an input to creation.
- `stock_movements`: UUID, compound product/owner FK, IN/OUT, positive quantity, previous/resulting balances, note, owner-scoped unique request UUID, timestamp. Balance arithmetic is constrained. No cascading product deletion: history must remain.
- Owner/archive and owner/product/time indexes support inventory and history reads. Primary and unique constraints create supporting indexes.

## Plain-language security
Authenticated users may SELECT only their own rows through RLS. Anonymous users have no table privileges. Authenticated users have **no INSERT/UPDATE/DELETE table grants**, so they cannot bypass stock arithmetic by directly changing quantity or fabricating history. All application writes enter three tightly scoped functions. Each checks `auth.uid()` and owner predicates. Functions are SECURITY DEFINER because callers intentionally lack table write privileges; they use an empty search path and schema-qualified objects to prevent name-shadowing attacks. Execute is revoked from PUBLIC/anon and granted only to authenticated. Do not grant these roles direct writes later.

`save_product` trims and uppercases SKU. It validates integers before SQL casts, verifies that the referenced photo exists in the caller's folder, creates the opening movement when needed, and refuses opening quantities on edits. Database NOT NULL/check constraints remain a second line of validation.

`adjust_stock` serializes identical owner/request IDs with a transaction-scoped advisory lock. A replay returns its original movement only if the payload matches. A new request locks its product row (`FOR UPDATE`) before checking archive status and computing the balance. Update and insert share one transaction: an exception rolls back both. Different request keys competing for one product queue on the row lock. No negative balance or lost update is allowed.

`manage_product` uses the same row lock, so archive/deletion cannot race past a stock update. Delete requires no history; otherwise use archive. Archive excludes the item from dashboard totals but keeps history.

## Seed/reset
`npm run seed` uses the normal authenticated API/RPC and adds four fictional products only when missing. For repeated demonstrations create a new SKU such as DEMO-10-02; archive prior demonstrations. This **non-destructive reset** preserves audit evidence. For a truly empty exercise use a newly provisioned disposable account and rerun seed. Do not wipe the shared project or disable RLS. Removing old objects/accounts is an administrator action requiring explicit approval and an evidence backup; no automatic destructive reset is supplied.

## Photo access caveats
Storage read/insert/delete policies require the first path component to equal the caller's UUID. No overwrite/update policy is granted. Delete also checks for live product references. A signed URL is a temporary bearer capability: anyone it is deliberately shared with can use it until expiry; don't place signed URLs in public evidence. Cross-account requests to generate URLs or read private objects must fail. Bucket rules validate size/MIME; server upload additionally validates magic bytes. This is format screening, not malware scanning. Clients using Supabase directly still encounter bucket limits and ownership policies.
