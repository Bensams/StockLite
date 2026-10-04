# StockLite — Inventory Tracker

A shared **codebase and curriculum**, not a shared inventory workspace. Each facilitator-provisioned email/password account owns its products, movements, and private photos. Fictional stationery only. No payments, carts, procurement, barcodes, AI, or roles.

## Requirements and start
- Node **24.x** (verified locally with 24.18.0), npm 11; Next.js 16.3.8, React 19, TypeScript, Tailwind 4, Supabase SSR 0.12.7 and JS 2.117.2. `package-lock.json` pins installed dependencies.
- A fresh Supabase project and two disposable classroom accounts for isolation checks. No service-role key is needed in the application.

```powershell
cd E:\StockLite
npm ci
Copy-Item .env.example .env.local
# Privately fill URL and publishable key. Do not paste credentials into chat.
# Apply supabase/migrations/001_inventory.sql in the project's SQL Editor.
# Provision confirmed classroom users in Supabase Authentication > Users.
npm run dev -- --port 3107
```
Open http://localhost:3107. Without configuration the app shows an honest setup screen; it does not substitute fake persistence. Port 3107 avoids another local application already using port 3000.

Optional fictional seed: configure TEST_EMAIL and TEST_PASSWORD for a classroom account, then `npm run seed`. Existing seed SKUs are retained, not overwritten. Never seed a production inventory.

## Checks
```powershell
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm start -- --port 3107
# Requires BOTH TEST accounts and migrated real Supabase:
npm run test:live
```
Stop a manually running development server before Playwright, which owns port 3107. See [verification](docs/verification.md) for actual results, not presumed outcomes. Browser tests deliberately substitute HTTP responses; they are not proof of live Supabase behavior.

## Demonstration
Sign in → Add `DEMO-10`, Blue ballpoint pens, Writing, ₱12.50, opening 10, threshold 3 → select a valid photo → save → Stock In 5, note `Received five` → Stock Out 3, note `Released three` → reload → open details: **12 units**, three movements (0→10, 10→15, 15→12). Set threshold 12 to demonstrate inclusive low-stock status. Archive, verify movements are disabled, then restore. Sign in as another account and verify isolation.

## Project map
| Location | Purpose |
|---|---|
| `app/page.tsx`, `app/globals.css` | Responsive light/dark interface and observable forms |
| `app/api/` | Auth, product, movement, photo, configuration Route Handlers |
| `lib/` | Server client, error mapping, validation |
| `supabase/migrations/001_inventory.sql` | Tables, constraints, indexes, RPCs, RLS, private bucket |
| `scripts/` | Fictional seed and credential-gated real service checks |
| `tests/` | Unit contracts and desktop/mobile browser checks |
| `docs/architecture.md`, `database.md`, `api.md` | Technical design and contracts |
| `docs/integration.md`, `debugging.md`, `testing.md`, `deployment.md` | Service setup, diagnosis, tests, release |
| `teaching/` | Facilitator guide, demonstration, exercises, student instructions |
| `templates/` | Editable test worksheet, report, deployment simulation, portfolio |

## Design decisions / limits
Money is integer centavos. Inventory counts are integers capped at one billion. Stock edits only use the atomic RPC. Initial positive balances create history. History prevents deletion; archive preserves an audit trail. Product creation is SKU-unique but not independently idempotent: after an uncertain create response, refresh and inspect the SKU before retrying. Movement retries retain a request ID while the form remains mounted; after reload inspect history before resubmitting. Concurrent metadata edits are last-write-wins; this small classroom app does not implement multi-editor conflict resolution. Lists rely on Supabase's configured API row limit (normally 1,000 products); histories show the latest 500 movements. Keep classroom datasets below those limits; pagination is future work. Signed image URLs expire after five minutes; refresh to renew. No realtime subscription: refresh to observe changes from another browser logged into the same account.

## Official references checked during implementation
- https://nextjs.org/docs/app/getting-started/installation — App Router setup, Node baseline, separate lint command.
- https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- https://supabase.com/docs/guides/auth/quickstarts/nextjs
- https://supabase.com/docs/guides/auth/server-side/creating-a-client — cookie-based SSR client and verified identity (this app uses server `getUser`, never trusts `getSession`).
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/database/functions — narrowly scoped definer functions with empty search path.
- https://vercel.com/docs/frameworks/full-stack/nextjs

No deployment was authorized or performed. Future attendance, feedback, photos, and achieved classroom outcomes remain blank in templates.
