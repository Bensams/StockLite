# Debugging and recovery

Start with a reproducible input, expected output and request ID. Save the baseline, activate only one teaching defect, and reset it before investigating the next.

| Observation | Inspect / breakpoint | Likely boundary |
|---|---|---|
| Preview shows 105 but stored balance is 15 | Browser Sources: MovementForm preview expression; inspect typeof quantity | UI string arithmetic |
| Save returns 422 | Network request JSON versus `movementSchema`; breakpoint before safeParse | Client/backend contract |
| 401 after waiting | Auth request, cookie refresh, `getUser`; sign in again | Authentication |
| 409 overdraw, unchanged history | RPC result and rows for the owner; inspect before/after | Correct database rejection, not necessarily a defect |
| SDK upload rejected | Network multipart/status; server endpoint; bucket ID, MIME/size, folder policy | Storage/configuration |
| Upload 200, product save fails | New object path, product image_path, cleanup DELETE response | Cross-service compensation |
| No product visible in account B | RLS and owner filter; expected isolation | Security success |
| UI stale after successful API response | load() and component state; reload and compare DB record | Refresh/UI issue |

Browser Console: check runtime errors without printing sessions/passwords. Network: inspect method/path/status, sanitized payload, response request ID, timing. Server terminal: structured development operation/outcome/status logs; place debugger at endpoint wrapper, Zod parse, db.rpc return, or storage error branch. Database: query products and stock_movements using a trusted admin only for diagnosis; remember admin SQL bypasses RLS, so it cannot prove owner isolation. Use account-level tests for that. Storage: inspect bucket privacy, policy role/operation, first folder UUID, and live image reference.

Safe escalation: record sanitized HTTP status + operation + request ID and minimal fictional input. Do not screenshot cookies, request authorization headers, signed URLs, keys, or passwords. Dependency failures return 503 without raw service internals. Correct the layer that failed, rerun its test, then rerun the full 10→15→12 workflow.

## Common recovery
- Setup screen: fill .env.local, restart Next, apply migration to the same project as URL/key.
- Duplicate SKU after uncertain save: refresh/search; do not create again blindly.
- Uncertain movement response: retry unchanged form (same key). If page was reloaded, inspect history first; recover the original request ID from sanitized evidence before replaying.
- Photo expires: refresh to obtain a new short-lived URL.
- Cleanup fails: retain the reported path, check references, obtain approval, then use authenticated DELETE /api/photos with that path. Never delete Storage metadata with SQL.
- No internet: use the clearly labeled HTTP-substitute browser tests and blank simulation report; do not claim cloud acceptance.
- Port conflict: StockLite uses 3107 in test config; do not reuse an unrelated server on port 3000.
