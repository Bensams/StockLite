# API Reference — StockLite Backend Contracts

This document describes the HTTP API exposed by StockLite's Next.js Route Handlers. Use these contracts for frontend integration, testing, and debugging.

---

## Authentication

All API routes require authentication via Supabase Auth. The client must include a valid session token in the `Authorization` header or cookies.

**Unauthenticated requests return**:
```json
{
  "error": "Unauthorized"
}
```
Status: `401 Unauthorized`

---

## Base URL

**Development**: `http://localhost:3000` (or your dev port)  
**Production**: `https://[your-vercel-deployment].vercel.app`

---

## Products API

### GET /api/products

Fetch all products owned by the authenticated user.

**Query parameters**:
- `search` (optional): Filter by SKU or name (case-insensitive)
- `category` (optional): Filter by exact category match
- `status` (optional): `active`, `low-stock`, or `archived`

**Request example**:
```
GET /api/products?search=pen&status=active
```

**Response (200 OK)**:
```json
{
  "products": [
    {
      "id": "uuid",
      "sku": "DEMO-10",
      "name": "Blue ballpoint pens",
      "category": "Writing",
      "unit_price": "12.50",
      "quantity": 12,
      "low_stock_threshold": 3,
      "image_path": "user-id/photo.jpg",
      "archived_at": null,
      "created_at": "2026-10-07T10:00:00Z",
      "updated_at": "2026-10-07T10:00:00Z"
    }
  ]
}
```

**Response (500 Internal Server Error)**:
```json
{
  "error": "Failed to fetch products",
  "details": "Database unavailable"
}
```

---

### GET /api/products/[id]

Fetch a single product by ID.

**Request example**:
```
GET /api/products/abc-123
```

**Response (200 OK)**:
```json
{
  "product": {
    "id": "abc-123",
    "sku": "DEMO-10",
    "name": "Blue ballpoint pens",
    "category": "Writing",
    "unit_price": "12.50",
    "quantity": 12,
    "low_stock_threshold": 3,
    "image_path": "user-id/photo.jpg",
    "archived_at": null,
    "created_at": "2026-10-07T10:00:00Z",
    "updated_at": "2026-10-07T10:00:00Z"
  }
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Product not found"
}
```

**Response (403 Forbidden)**:
Product exists but belongs to another user (RLS enforcement).

---

### POST /api/products

Create a new product.

**Request body**:
```json
{
  "sku": "DEMO-10",
  "name": "Blue ballpoint pens",
  "category": "Writing",
  "unit_price": 12.50,
  "opening_quantity": 10,
  "low_stock_threshold": 3,
  "image_path": "user-id/photo.jpg"
}
```

**Required fields**:
- `sku` (string, uppercase, unique per owner)
- `name` (string, non-empty)
- `category` (string, non-empty)
- `unit_price` (number, >= 0)
- `opening_quantity` (integer, >= 0)
- `low_stock_threshold` (integer, >= 0)

**Optional fields**:
- `image_path` (string, storage path)

**Response (201 Created)**:
```json
{
  "success": true,
  "product": {
    "id": "new-uuid",
    "sku": "DEMO-10",
    "name": "Blue ballpoint pens",
    "quantity": 10,
    ...
  }
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "Validation failed",
  "details": "SKU already exists"
}
```

**Response (409 Conflict)**:
```json
{
  "error": "Duplicate SKU",
  "details": "SKU 'DEMO-10' already exists in your inventory"
}
```

---

### PATCH /api/products/[id]

Update an existing product. Does NOT directly modify `quantity`; use stock movements instead.

**Request body** (all fields optional except at least one must be present):
```json
{
  "sku": "DEMO-10A",
  "name": "Blue ballpoint pens (updated)",
  "category": "Office supplies",
  "unit_price": 15.00,
  "low_stock_threshold": 5,
  "image_path": "user-id/new-photo.jpg"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "product": {
    "id": "abc-123",
    "sku": "DEMO-10A",
    "name": "Blue ballpoint pens (updated)",
    ...
  }
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "Validation failed",
  "details": "unit_price must be a non-negative number"
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Product not found"
}
```

---

### DELETE /api/products/[id]

Delete a product. Only allowed if the product has no movement history.

**Request example**:
```
DELETE /api/products/abc-123
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product deleted"
}
```

**Response (409 Conflict)**:
```json
{
  "error": "Cannot delete product with movement history",
  "details": "Archive the product instead to preserve audit trail"
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Product not found"
}
```

---

### POST /api/products/[id]/archive

Archive a product. Sets `archived_at` to the current timestamp. Movement history is retained.

**Request example**:
```
POST /api/products/abc-123/archive
```

**Response (200 OK)**:
```json
{
  "success": true,
  "product": {
    "id": "abc-123",
    "archived_at": "2026-10-07T12:00:00Z",
    ...
  }
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Product not found"
}
```

---

### POST /api/products/[id]/restore

Restore an archived product. Sets `archived_at` to `null`.

**Request example**:
```
POST /api/products/abc-123/restore
```

**Response (200 OK)**:
```json
{
  "success": true,
  "product": {
    "id": "abc-123",
    "archived_at": null,
    ...
  }
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "Product is not archived"
}
```

---

## Stock Movements API

### GET /api/products/[id]/movements

Fetch movement history for a product.

**Request example**:
```
GET /api/products/abc-123/movements
```

**Response (200 OK)**:
```json
{
  "movements": [
    {
      "id": "movement-uuid",
      "product_id": "abc-123",
      "type": "OUT",
      "quantity": 3,
      "previous_balance": 15,
      "resulting_balance": 12,
      "note": "Released three",
      "request_id": "req-xyz",
      "created_at": "2026-10-07T11:00:00Z"
    },
    {
      "id": "movement-uuid-2",
      "product_id": "abc-123",
      "type": "IN",
      "quantity": 5,
      "previous_balance": 10,
      "resulting_balance": 15,
      "note": "Received five",
      "request_id": "req-abc",
      "created_at": "2026-10-07T10:30:00Z"
    }
  ]
}
```

Movements are ordered by `created_at DESC` (most recent first).

**Response (404 Not Found)**:
```json
{
  "error": "Product not found"
}
```

---

### POST /api/movements

Create a stock movement (Stock In or Stock Out). This is an atomic operation that updates the product quantity and inserts a movement record.

**Request body**:
```json
{
  "product_id": "abc-123",
  "type": "IN",
  "quantity": 5,
  "note": "Received five units",
  "request_id": "client-generated-uuid"
}
```

**Required fields**:
- `product_id` (UUID)
- `type` (string, `"IN"` or `"OUT"`)
- `quantity` (positive integer)
- `request_id` (UUID, client-generated for idempotency)

**Optional fields**:
- `note` (string, description)

**Response (201 Created)**:
```json
{
  "success": true,
  "movement": {
    "id": "movement-uuid",
    "product_id": "abc-123",
    "type": "IN",
    "quantity": 5,
    "previous_balance": 10,
    "resulting_balance": 15,
    "note": "Received five units",
    "request_id": "client-generated-uuid",
    "created_at": "2026-10-07T11:00:00Z"
  }
}
```

**Response (400 Bad Request — Validation)**:
```json
{
  "error": "Validation failed",
  "details": "quantity must be a positive integer"
}
```

**Response (400 Bad Request — Insufficient Stock)**:
```json
{
  "error": "Stock out quantity exceeds available stock",
  "details": "Requested 20, available 12"
}
```

**Response (409 Conflict — Idempotency)**:
If the same `request_id` is submitted again, the existing movement is returned without creating a duplicate:
```json
{
  "success": true,
  "movement": {
    "id": "existing-movement-uuid",
    ...
  },
  "message": "Movement already processed (idempotent)"
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Product not found"
}
```

**Response (409 Conflict — Archived Product)**:
```json
{
  "error": "Cannot create movement for archived product",
  "details": "Restore the product first"
}
```

---

## Dashboard API

### GET /api/dashboard

Fetch summary statistics for the authenticated user's inventory.

**Request example**:
```
GET /api/dashboard
```

**Response (200 OK)**:
```json
{
  "active_products": 5,
  "total_units": 120,
  "low_stock_items": 2,
  "recent_movements": [
    {
      "id": "movement-uuid",
      "product_name": "Blue ballpoint pens",
      "type": "OUT",
      "quantity": 3,
      "resulting_balance": 12,
      "created_at": "2026-10-07T11:00:00Z"
    }
  ]
}
```

**Fields**:
- `active_products`: Count of non-archived products
- `total_units`: Sum of `quantity` across all active products
- `low_stock_items`: Count of products where `quantity <= low_stock_threshold`
- `recent_movements`: Last 5 movements across all products

**Response (500 Internal Server Error)**:
```json
{
  "error": "Failed to fetch dashboard data"
}
```

---

## Storage Integration

Photo uploads go directly to Supabase Storage via the client SDK, not through these API routes. However, the product API accepts `image_path` references.

**Expected `image_path` format**:
```
{user_id}/{uuid}.{ext}
```

Example: `a1b2c3d4-user-uuid/photo-uuid.jpg`

**Client-side upload flow**:
1. Validate file type and size on the client
2. Generate a unique filename
3. Call `supabase.storage.from('product-photos').upload(path, file)`
4. On success, send `image_path` in the product create/update request
5. On failure, handle error and offer retry or save-without-photo

**Storage access**:
- Private bucket with RLS-style policies
- Images accessed via signed URLs (client SDK handles this automatically)
- Policies enforce that users can only upload/read files in their own path

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "Brief error message",
  "details": "Optional detailed explanation"
}
```

**Common HTTP status codes**:
- `400 Bad Request`: Invalid input, validation failure
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Authenticated but not allowed (RLS)
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Duplicate resource or business rule violation
- `500 Internal Server Error`: Server or database issue

---

## Request ID Correlation

All requests should include a `request_id` (for movements) or can be traced via server-generated IDs in logs.

**Client-generated request ID** (movements only):
```typescript
const request_id = crypto.randomUUID();
```

**Server logs** will include:
```
[movements] POST received | Request ID: abc-123
```

Use this ID to trace a request through Console → Network → Server logs → Database.

---

## Rate Limiting

No explicit rate limiting is implemented in this version. Supabase enforces connection pooling and query limits based on your plan tier.

**Production considerations**:
- Implement rate limiting middleware for public-facing deployments
- Monitor Supabase dashboard for query performance and connection usage

---

## Testing the API

### Using curl

**Fetch products**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/products
```

**Create a movement**:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "abc-123",
    "type": "IN",
    "quantity": 5,
    "note": "Test movement",
    "request_id": "test-uuid"
  }' \
  http://localhost:3000/api/movements
```

### Using Browser DevTools

1. Sign in to StockLite
2. Open DevTools → Console
3. Run:
```javascript
const response = await fetch('/api/products');
const data = await response.json();
console.log(data);
```

### Using Postman or Insomnia

Import the endpoints above as a collection. Use Supabase Auth to get a JWT token, then include it in the `Authorization` header as `Bearer <token>`.

---

## Summary of Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/products` | List all products with optional filters |
| GET | `/api/products/[id]` | Fetch single product |
| POST | `/api/products` | Create new product |
| PATCH | `/api/products/[id]` | Update product (not quantity) |
| DELETE | `/api/products/[id]` | Delete product (if no movements) |
| POST | `/api/products/[id]/archive` | Archive product |
| POST | `/api/products/[id]/restore` | Restore archived product |
| GET | `/api/products/[id]/movements` | Fetch movement history |
| POST | `/api/movements` | Create stock movement (atomic) |
| GET | `/api/dashboard` | Fetch dashboard summary |

---

## Further Reading

- `docs/database-schema.md` — Table structures and constraints
- `docs/debugging-guide.md` — How to trace requests and diagnose issues
- `teaching/defects.md` — Controlled API failures for testing
