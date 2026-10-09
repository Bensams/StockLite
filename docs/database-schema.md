# Database Schema — StockLite

This document describes the database tables, constraints, indexes, and functions used in StockLite.

---

## Tables

### `products`

Core inventory items owned by authenticated users.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique product identifier |
| `owner_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) | User who owns this product |
| `sku` | TEXT | NOT NULL | Stock Keeping Unit (uppercase) |
| `name` | TEXT | NOT NULL, CHECK (length(name) > 0) | Product name |
| `category` | TEXT | NOT NULL, CHECK (length(category) > 0) | Product category |
| `unit_price` | NUMERIC(10,2) | NOT NULL, CHECK (unit_price >= 0) | Price per unit in PHP |
| `quantity` | INTEGER | NOT NULL, DEFAULT 0, CHECK (quantity >= 0) | Current stock quantity |
| `low_stock_threshold` | INTEGER | NOT NULL, DEFAULT 0, CHECK (low_stock_threshold >= 0) | Alert threshold |
| `image_path` | TEXT | NULL | Supabase Storage path to product photo |
| `archived_at` | TIMESTAMPTZ | NULL | Soft delete timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update time |

**Unique Constraints**:
```sql
UNIQUE (owner_id, sku)
```
SKU must be unique within each owner's inventory, but different owners can use the same SKU.

**Indexes**:
```sql
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_products_owner_archived ON products(owner_id, archived_at);
CREATE INDEX idx_products_sku ON products(owner_id, sku);
```

**Triggers**:
```sql
CREATE TRIGGER set_updated_at 
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### `stock_movements`

Immutable audit trail of all stock changes.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique movement identifier |
| `product_id` | UUID | NOT NULL, FOREIGN KEY → products(id) ON DELETE CASCADE | Product this movement affects |
| `owner_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) | Owner (denormalized for RLS) |
| `type` | TEXT | NOT NULL, CHECK (type IN ('IN', 'OUT')) | Movement direction |
| `quantity` | INTEGER | NOT NULL, CHECK (quantity > 0) | Quantity moved (always positive) |
| `previous_balance` | INTEGER | NOT NULL, CHECK (previous_balance >= 0) | Balance before movement |
| `resulting_balance` | INTEGER | NOT NULL, CHECK (resulting_balance >= 0) | Balance after movement |
| `note` | TEXT | NULL | User-provided description |
| `request_id` | UUID | NOT NULL, UNIQUE | Client idempotency key |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Movement timestamp |

**Unique Constraints**:
```sql
UNIQUE (request_id)
```
Ensures idempotency: retrying with the same `request_id` does not create duplicate movements.

**Indexes**:
```sql
CREATE INDEX idx_movements_product ON stock_movements(product_id, created_at DESC);
CREATE INDEX idx_movements_owner ON stock_movements(owner_id);
CREATE INDEX idx_movements_request ON stock_movements(request_id);
```

**Foreign Key Cascade**:
```sql
ON DELETE CASCADE
```
If a product is hard-deleted, all its movements are also deleted (preserving referential integrity). However, products with movements should be archived, not deleted.

---

## Row-Level Security (RLS) Policies

RLS ensures users can only access their own data.

### Products Policies

**Enable RLS**:
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

**SELECT Policy**:
```sql
CREATE POLICY "Users can view own products"
ON products FOR SELECT
TO authenticated
USING (owner_id = auth.uid());
```

**INSERT Policy**:
```sql
CREATE POLICY "Users can insert own products"
ON products FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());
```

**UPDATE Policy**:
```sql
CREATE POLICY "Users can update own products"
ON products FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());
```

**DELETE Policy**:
```sql
CREATE POLICY "Users can delete own products"
ON products FOR DELETE
TO authenticated
USING (owner_id = auth.uid());
```

---

### Stock Movements Policies

**Enable RLS**:
```sql
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
```

**SELECT Policy**:
```sql
CREATE POLICY "Users can view own movements"
ON stock_movements FOR SELECT
TO authenticated
USING (owner_id = auth.uid());
```

**INSERT Policy**:
```sql
CREATE POLICY "Users can insert own movements"
ON stock_movements FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());
```

**No UPDATE or DELETE**:
Movements are immutable. No UPDATE or DELETE policies exist.

---

## Database Functions

### `adjust_stock`

Atomically update product quantity and create movement record.

**Signature**:
```sql
CREATE OR REPLACE FUNCTION adjust_stock(
  p_product_id UUID,
  p_type TEXT,
  p_quantity INTEGER,
  p_note TEXT,
  p_request_id UUID
)
RETURNS TABLE (
  movement_id UUID,
  product_id UUID,
  type TEXT,
  quantity INTEGER,
  previous_balance INTEGER,
  resulting_balance INTEGER,
  note TEXT,
  request_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_archived_at TIMESTAMPTZ;
  v_existing_movement RECORD;
BEGIN
  -- Check idempotency: return existing movement if request_id already processed
  SELECT * INTO v_existing_movement
  FROM stock_movements
  WHERE stock_movements.request_id = p_request_id;
  
  IF FOUND THEN
    RETURN QUERY
    SELECT 
      v_existing_movement.id,
      v_existing_movement.product_id,
      v_existing_movement.type,
      v_existing_movement.quantity,
      v_existing_movement.previous_balance,
      v_existing_movement.resulting_balance,
      v_existing_movement.note,
      v_existing_movement.request_id,
      v_existing_movement.created_at;
    RETURN;
  END IF;

  -- Lock the product row and fetch current state
  SELECT owner_id, quantity, archived_at
  INTO v_owner_id, v_current_quantity, v_archived_at
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  -- Validate product exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Validate product is not archived
  IF v_archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot create movement for archived product';
  END IF;

  -- Validate ownership (defense in depth; RLS also enforces this)
  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Validate type
  IF p_type NOT IN ('IN', 'OUT') THEN
    RAISE EXCEPTION 'Invalid movement type';
  END IF;

  -- Validate quantity
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  -- Calculate new quantity
  IF p_type = 'IN' THEN
    v_new_quantity := v_current_quantity + p_quantity;
  ELSE
    v_new_quantity := v_current_quantity - p_quantity;
  END IF;

  -- Validate sufficient stock for OUT
  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'Stock out quantity (%) exceeds available stock (%)', p_quantity, v_current_quantity;
  END IF;

  -- Update product quantity
  UPDATE products
  SET quantity = v_new_quantity, updated_at = now()
  WHERE id = p_product_id;

  -- Insert movement record
  INSERT INTO stock_movements (
    product_id,
    owner_id,
    type,
    quantity,
    previous_balance,
    resulting_balance,
    note,
    request_id
  ) VALUES (
    p_product_id,
    v_owner_id,
    p_type,
    p_quantity,
    v_current_quantity,
    v_new_quantity,
    p_note,
    p_request_id
  );

  -- Return the created movement
  RETURN QUERY
  SELECT 
    stock_movements.id,
    stock_movements.product_id,
    stock_movements.type,
    stock_movements.quantity,
    stock_movements.previous_balance,
    stock_movements.resulting_balance,
    stock_movements.note,
    stock_movements.request_id,
    stock_movements.created_at
  FROM stock_movements
  WHERE stock_movements.request_id = p_request_id;
END;
$$;
```

**Security**: `SECURITY DEFINER` runs with the function owner's privileges, bypassing RLS temporarily. However, the function explicitly checks `auth.uid()` to enforce ownership.

**Concurrency**: `FOR UPDATE` locks the product row, serializing competing updates.

**Idempotency**: Checks `request_id` first; returns existing movement if already processed.

---

### `update_updated_at_column`

Trigger function to automatically update `updated_at` timestamp.

**Signature**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

**Usage**:
```sql
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## Data Integrity Rules

### Enforced by Database

1. **Non-negative quantities**: `CHECK (quantity >= 0)` on products, movements
2. **Non-negative prices**: `CHECK (unit_price >= 0)`
3. **Positive movement quantities**: `CHECK (quantity > 0)` in movements
4. **Valid movement types**: `CHECK (type IN ('IN', 'OUT'))`
5. **Unique SKUs per owner**: `UNIQUE (owner_id, sku)`
6. **Idempotent requests**: `UNIQUE (request_id)`
7. **Referential integrity**: Foreign keys with CASCADE

### Enforced by Application Logic

1. **Movements only via function**: Direct `INSERT` to movements without function is possible but bypasses atomic update
2. **Archive vs. delete**: Application checks movement count before allowing hard delete
3. **Opening stock**: When `opening_quantity > 0`, create an initial IN movement
4. **SKU normalization**: Application converts to uppercase before insert

### Enforced by RLS

1. **Ownership isolation**: Users cannot see or modify other users' data
2. **Authentication required**: Anonymous users have no access

---

## Sample Queries

### List all active products with low stock
```sql
SELECT id, sku, name, quantity, low_stock_threshold
FROM products
WHERE owner_id = auth.uid()
  AND archived_at IS NULL
  AND quantity <= low_stock_threshold
ORDER BY name;
```

### Movement history for a product
```sql
SELECT type, quantity, previous_balance, resulting_balance, note, created_at
FROM stock_movements
WHERE product_id = '[product-id]'
  AND owner_id = auth.uid()
ORDER BY created_at DESC;
```

### Dashboard statistics
```sql
SELECT
  COUNT(*) FILTER (WHERE archived_at IS NULL) AS active_products,
  COALESCE(SUM(quantity) FILTER (WHERE archived_at IS NULL), 0) AS total_units,
  COUNT(*) FILTER (WHERE archived_at IS NULL AND quantity <= low_stock_threshold) AS low_stock_items
FROM products
WHERE owner_id = auth.uid();
```

### Verify stock consistency (audit query)
```sql
-- For each product, sum movements and compare to current quantity
SELECT
  p.id,
  p.sku,
  p.quantity AS current_quantity,
  COALESCE(SUM(CASE WHEN m.type = 'IN' THEN m.quantity ELSE -m.quantity END), 0) AS calculated_quantity
FROM products p
LEFT JOIN stock_movements m ON p.id = m.product_id
WHERE p.owner_id = auth.uid()
GROUP BY p.id, p.sku, p.quantity
HAVING p.quantity != COALESCE(SUM(CASE WHEN m.type = 'IN' THEN m.quantity ELSE -m.quantity END), 0);
```
Should return zero rows if all stock balances are consistent.

---

## Migration Strategy

Migrations are applied in order:

1. **001_initial_schema.sql**: Create tables, constraints, indexes
2. **002_stock_functions.sql**: Create `adjust_stock` and trigger functions
3. **003_policies.sql**: Enable RLS and create policies
4. **004_storage_policies.sql**: Create Supabase Storage bucket policies (applied via dashboard)

**Rollback**: Not implemented. For development, drop tables and re-apply migrations. For production, write explicit rollback migrations.

---

## Performance Considerations

### Indexes
- `products(owner_id)`: Fast user-scoped product list
- `products(owner_id, archived_at)`: Fast active/archived filter
- `stock_movements(product_id, created_at DESC)`: Fast movement history
- `stock_movements(request_id)`: Fast idempotency checks

### Query Optimization
- Use `LIMIT` on movement history (pagination)
- Filter by `archived_at IS NULL` to reduce scanned rows
- Denormalized `owner_id` in movements allows direct RLS without JOIN

### Connection Pooling
- Supabase manages connection pooling automatically
- Free tier: limited concurrent connections
- Upgrade tier if connection pool exhaustion occurs

---

## Backup and Recovery

**Supabase Automatic Backups**:
- Daily backups (free tier: 7-day retention)
- Point-in-time recovery (paid tiers)

**Manual Backup**:
```bash
# Export via Supabase dashboard or pg_dump
pg_dump -h [host] -U postgres -d [database] > backup.sql
```

**Restore**:
```bash
psql -h [host] -U postgres -d [database] < backup.sql
```

---

## Future Schema Enhancements (Out of Scope)

- **Multi-user workspaces**: Add `workspaces` table, `workspace_members`, permissions
- **Audit logs**: Separate table for who changed what and when
- **Product variants**: Size, color, or other attributes
- **Suppliers**: Track where stock comes from
- **Locations**: Multiple storage locations per product
- **Scheduled reports**: Aggregated stats, trends

---

## Related Documentation

- `docs/architecture.md` — System design and data flow
- `docs/api-reference.md` — API endpoints and contracts
- `supabase/migrations/` — Actual SQL migration files
- `teaching/test-worksheet.md` — Test cases that verify data integrity
