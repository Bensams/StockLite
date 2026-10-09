# StockLite — README

**Inventory Tracker for Small Stores and Supply Rooms**

A full-stack Next.js application for managing products, stock movements, and low-stock alerts. Built for BSIT classroom use across three integration-focused sessions.

---

## Features

- ✅ Sign in and sign out (Supabase Auth)
- ✅ Dashboard with active products, total units, and low-stock count
- ✅ Product list with search, category filter, and stock-status filter
- ✅ Add and edit products with photo upload (Supabase Storage)
- ✅ Stock In and Stock Out with movement history
- ✅ Low-stock indicators and alerts
- ✅ Archive and restore products (history retained)
- ✅ Ownership isolation (each account owns its inventory)
- ✅ Mobile-responsive design with dark theme

---

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js Route Handlers (API routes)
- **Database**: Supabase PostgreSQL with Row-Level Security
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (private bucket, signed URLs)
- **Deployment**: Vercel

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

### 1. Clone the repository

```bash
git clone <repository-url>
cd StockLite
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project:
- Dashboard → Settings → API → Project URL
- Dashboard → Settings → API → `anon` `public` key

### 4. Set up the database

Run migrations in Supabase SQL Editor (Dashboard → SQL Editor):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_stock_functions.sql`
3. `supabase/migrations/003_policies.sql`

### 5. Configure Supabase Storage

1. Dashboard → Storage → Create new bucket: `product-photos`
2. Set to **Private**
3. Run the storage policies from `supabase/migrations/004_storage_policies.sql`

### 6. Create a test account

1. Dashboard → Authentication → Add user
2. Enter email and password
3. Note the credentials for sign-in

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your test account.

---

## Project Structure

```
StockLite/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-protected routes
│   │   ├── dashboard/            # Dashboard page
│   │   ├── products/             # Product list and details
│   │   └── layout.tsx            # Auth check wrapper
│   ├── api/                      # API Route Handlers
│   │   ├── products/             # Product CRUD
│   │   ├── movements/            # Stock movements
│   │   └── dashboard/            # Summary stats
│   ├── components/               # React components
│   ├── lib/                      # Utilities, types, Supabase client
│   ├── sign-in/                  # Sign-in page
│   └── layout.tsx                # Root layout
├── docs/                         # Technical documentation
│   ├── architecture.md           # System architecture
│   ├── api-reference.md          # API contracts
│   ├── database-schema.md        # Tables and constraints
│   ├── debugging-guide.md        # Troubleshooting
│   └── deployment.md             # Production deployment
├── teaching/                     # Classroom materials
│   ├── session-1-facilitator-guide.md
│   ├── session-2-facilitator-guide.md
│   ├── session-3-facilitator-guide.md
│   ├── test-worksheet.md         # Integration test cases
│   ├── defects.md                # Teaching defect exercises
│   └── submission-checklist.md   # Student deliverables
├── supabase/
│   └── migrations/               # SQL migrations
├── .env.example                  # Environment variable template
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

---

## Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler checks

# Testing
npm run test         # Run automated tests (if configured)
```

---

## Usage

### Adding a Product

1. Sign in
2. Click **+ Add product**
3. Fill in:
   - SKU (e.g., `DEMO-10`)
   - Name (e.g., `Blue ballpoint pens`)
   - Category (e.g., `Writing`)
   - Unit price (PHP)
   - Opening quantity
   - Low-stock threshold
   - Optional photo
4. Click **Save product**

### Stock Movements

1. Open a product from the list
2. Select **Stock In** or **Stock Out**
3. Enter quantity and note (e.g., "Received five units")
4. Click **Save movement**
5. Balance updates immediately; movement appears in history

### Archiving Products

- **Archive**: Hides the product from active list, retains history
- **Restore**: Brings archived product back to active list
- **Delete**: Only allowed if no movement history exists

---

## Teaching Context

StockLite is designed for three 120-minute classroom sessions:

### Session 1: Third-Party Integration
Students integrate Supabase Storage for photo uploads. They learn SDK usage, service configuration, validation, and error handling.

### Session 2: Integration Testing and Debugging
Students execute 16 systematic integration tests, reproduce controlled defects, trace requests through frontend/backend/database/storage, and document corrective actions.

### Session 3: Deployment and Documentation
Students deploy to Vercel, configure production environment variables, verify the deployed application with smoke tests, and document architecture and setup.

**See**: `teaching/` directory for complete facilitator guides, student worksheets, and submission checklists.

---

## Database Schema

### `products`
- Core inventory items
- Unique SKU per owner
- Stock quantity updated only via movements
- Optional photo reference (Supabase Storage path)
- Soft delete via `archived_at`

### `stock_movements`
- Audit trail of all quantity changes
- Immutable (no updates/deletes)
- Atomic with product update (database function)
- Idempotent via `request_id`

**See**: `docs/database-schema.md` for detailed schema, constraints, and indexes.

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/products` | List all products (filtered) |
| GET | `/api/products/[id]` | Fetch single product |
| POST | `/api/products` | Create product |
| PATCH | `/api/products/[id]` | Update product |
| DELETE | `/api/products/[id]` | Delete product (if no movements) |
| POST | `/api/products/[id]/archive` | Archive product |
| POST | `/api/products/[id]/restore` | Restore product |
| GET | `/api/products/[id]/movements` | Movement history |
| POST | `/api/movements` | Create stock movement |
| GET | `/api/dashboard` | Summary statistics |

**See**: `docs/api-reference.md` for request/response formats and error codes.

---

## Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row-Level Security (RLS) policies enforce ownership
- **Storage**: Private bucket with signed URLs
- **Validation**: Client-side (UX) and server-side (security)
- **Idempotency**: Movement requests use client-generated UUIDs
- **No secrets in code**: Environment variables only

---

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy
5. Update Supabase Auth redirect URLs to match Vercel domain

**See**: `docs/deployment.md` for complete deployment instructions, troubleshooting, and smoke test checklist.

---

## Testing

### Manual Testing

Use the integration test worksheet:
- `teaching/test-worksheet.md` — 16 test cases covering CRUD, movements, concurrency, validation, and access control

### Automated Testing (Future)

Placeholder for automated test suite. Recommended:
- Unit tests: Validation logic, utility functions
- Integration tests: API routes with test database
- E2E tests: Playwright or Cypress

---

## Troubleshooting

### "Unable to connect to database"
- Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- Verify Supabase project is active (not paused)

### Photos don't upload
- Check Storage bucket exists: `product-photos`
- Verify bucket policies are applied
- Check file size (< 2 MB) and type (JPEG/PNG/WebP)

### Sign-in redirect fails
- Check Supabase Auth → URL Configuration
- Add `http://localhost:3000` to allowed redirect URLs

### Products don't appear after adding
- Check browser Console for errors
- Verify RLS policies are active on `products` table
- Check Network tab for 403 or 500 responses

**See**: `docs/debugging-guide.md` for systematic diagnostic procedures.

---

## Contributing

This project is designed for classroom use. Contributions are welcome for:

- Bug fixes
- Documentation improvements
- Additional test cases
- Teaching exercises

**Guidelines**:
1. Keep scope focused on inventory management
2. Maintain teaching value (clear examples, observable interactions)
3. Document changes in relevant docs
4. Test locally before submitting

---

## License

MIT License — Free for educational and commercial use.

---

## Support

**For classroom facilitators**:
- See `teaching/` directory for session guides and materials
- Check `docs/debugging-guide.md` for common student issues

**For developers**:
- Open an issue for bugs or questions
- Consult `docs/architecture.md` for system design
- Review `docs/api-reference.md` for integration details

---

## Acknowledgments

Built for BSIT peer-mentoring instruction. Designed to teach:
- Third-party service integration
- Full-stack debugging and tracing
- Systematic integration testing
- Production deployment

**Sample data**: Fictional stationery and office supply inventory.

---

## Version

**Current**: 1.0.0  
**Node.js**: 18+  
**Next.js**: 14.x  
**Last updated**: October 2026

---

## Quick Links

- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [Debugging Guide](docs/debugging-guide.md)
- [Session 1 Guide](teaching/session-1-facilitator-guide.md)
- [Session 2 Guide](teaching/session-2-facilitator-guide.md)
- [Session 3 Guide](teaching/session-3-facilitator-guide.md)
- [Integration Test Worksheet](teaching/test-worksheet.md)

---

**Ready to teach?** Start with `teaching/session-1-facilitator-guide.md`.

**Ready to deploy?** See `docs/deployment.md`.

**Ready to code?** Run `npm run dev` and open `http://localhost:3000`.
