-- Run once in a fresh Supabase project. All writes go through narrow RPCs.
create table public.products (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 sku text not null check(sku=upper(trim(sku)) and length(sku) between 1 and 40),
 name text not null check(length(trim(name)) between 1 and 120), category text not null check(length(trim(category)) between 1 and 60),
 price_centavos bigint not null check(price_centavos between 0 and 1000000000),
 quantity bigint not null default 0 check(quantity between 0 and 1000000000),
 low_stock_threshold bigint not null check(low_stock_threshold between 0 and 1000000000),
 image_path text, archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(owner_id,sku), unique(id,owner_id),
 check(image_path is null or (split_part(image_path,'/',1)=owner_id::text and length(image_path)<=240))
);
create table public.stock_movements (
 id uuid primary key default gen_random_uuid(), product_id uuid not null, owner_id uuid not null references auth.users(id),
 type text not null check(type in ('IN','OUT')), quantity bigint not null check(quantity between 1 and 1000000000),
 previous_balance bigint not null check(previous_balance>=0), resulting_balance bigint not null check(resulting_balance between 0 and 1000000000),
 note text not null check(length(trim(note)) between 1 and 200), request_id uuid not null,
 created_at timestamptz not null default now(), unique(owner_id,request_id),
 foreign key(product_id,owner_id) references public.products(id,owner_id),
 check(resulting_balance=previous_balance+case when type='IN' then quantity else -quantity end)
);
create index products_owner_active on public.products(owner_id,archived_at);
create index movements_product_time on public.stock_movements(owner_id,product_id,created_at desc);
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
create policy own_products on public.products for select to authenticated using(owner_id=(select auth.uid()));
create policy own_movements on public.stock_movements for select to authenticated using(owner_id=(select auth.uid()));
revoke all on public.products, public.stock_movements from anon, authenticated;
grant select on public.products, public.stock_movements to authenticated;

create function public.save_product(p_id uuid,p_data jsonb) returns public.products
language plpgsql security definer set search_path='' as $$
declare r public.products; uid uuid:=auth.uid(); opening bigint; img text;
begin
 if uid is null then raise exception 'UNAUTHENTICATED'; end if;
 -- Reject fractional JSON values before bigint conversion can round them.
 if (p_data->>'price_centavos') !~ '^[0-9]+$' or (p_data->>'low_stock_threshold') !~ '^[0-9]+$' or coalesce(p_data->>'opening_quantity','0') !~ '^[0-9]+$' then raise exception 'INVALID_NUMBER'; end if;
 opening:=coalesce((p_data->>'opening_quantity')::bigint,0); img:=p_data->>'image_path';
 if opening<0 or opening>1000000000 then raise exception 'INVALID_NUMBER'; end if;
 if img is not null and not exists(select 1 from storage.objects where bucket_id='product-photos' and name=img and split_part(name,'/',1)=uid::text) then raise exception 'INVALID_PHOTO'; end if;
 if p_id is null then
 insert into public.products(owner_id,sku,name,category,price_centavos,quantity,low_stock_threshold,image_path)
 values(uid,upper(trim(p_data->>'sku')),trim(p_data->>'name'),trim(p_data->>'category'),(p_data->>'price_centavos')::bigint,opening,(p_data->>'low_stock_threshold')::bigint,img) returning * into r;
 if opening>0 then insert into public.stock_movements(product_id,owner_id,type,quantity,previous_balance,resulting_balance,note,request_id) values(r.id,uid,'IN',opening,0,opening,'Opening stock',gen_random_uuid()); end if;
 else
 if opening<>0 then raise exception 'USE_MOVEMENT'; end if;
 update public.products set sku=upper(trim(p_data->>'sku')), name=trim(p_data->>'name'), category=trim(p_data->>'category'),price_centavos=(p_data->>'price_centavos')::bigint,low_stock_threshold=(p_data->>'low_stock_threshold')::bigint,image_path=img,updated_at=now() where id=p_id and owner_id=uid returning * into r;
 if not found then raise exception 'NOT_FOUND'; end if;
 end if;
 return r;
end $$;

create function public.adjust_stock(p_product_id uuid,p_type text,p_quantity numeric,p_note text,p_request_id uuid) returns public.stock_movements
language plpgsql security definer set search_path='' as $$
declare p public.products; m public.stock_movements; uid uuid:=auth.uid(); balance bigint;
begin
 if uid is null then raise exception 'UNAUTHENTICATED'; end if;
 if p_request_id is null or p_type is null or p_type not in ('IN','OUT') or p_quantity is null or p_quantity<1 or p_quantity>1000000000 or p_quantity<>trunc(p_quantity) or p_note is null or length(trim(p_note)) not between 1 and 200 then raise exception 'INVALID_MOVEMENT'; end if;
 -- Serialize the same idempotency key even when requests name different products.
 perform pg_advisory_xact_lock(hashtextextended(uid::text||p_request_id::text,0));
 select * into m from public.stock_movements where owner_id=uid and request_id=p_request_id;
 if found then
 if m.product_id<>p_product_id or m.type<>p_type or m.quantity<>p_quantity or m.note<>trim(p_note) then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
 return m;
 end if;
 select * into p from public.products where id=p_product_id and owner_id=uid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if p.archived_at is not null then raise exception 'ARCHIVED'; end if;
 balance:=p.quantity+case when p_type='IN' then p_quantity::bigint else -p_quantity::bigint end;
 if balance<0 then raise exception 'INSUFFICIENT_STOCK'; end if;
 if balance>1000000000 then raise exception 'BALANCE_LIMIT'; end if;
 update public.products set quantity=balance,updated_at=now() where id=p.id;
 insert into public.stock_movements(product_id,owner_id,type,quantity,previous_balance,resulting_balance,note,request_id) values(p.id,uid,p_type,p_quantity,p.quantity,balance,trim(p_note),p_request_id) returning * into m;
 return m;
end $$;
create function public.manage_product(p_id uuid,p_action text) returns void
language plpgsql security definer set search_path='' as $$
declare p public.products;
begin
 if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
 select * into p from public.products where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if p_action='delete' then
 if exists(select 1 from public.stock_movements where product_id=p_id) then raise exception 'HAS_HISTORY'; end if;
 delete from public.products where id=p_id;
 elsif p_action in ('archive','restore') then
 update public.products set archived_at=case when p_action='archive' then now() else null end,updated_at=now() where id=p_id;
 else raise exception 'INVALID_ACTION'; end if;
end $$;
revoke all on function public.save_product(uuid,jsonb),public.adjust_stock(uuid,text,numeric,text,uuid),public.manage_product(uuid,text) from public,anon;
grant execute on function public.save_product(uuid,jsonb),public.adjust_stock(uuid,text,numeric,text,uuid),public.manage_product(uuid,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-photos','product-photos',false,2097152,array['image/jpeg','image/png','image/webp']);
create policy photo_read on storage.objects for select to authenticated using(bucket_id='product-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy photo_insert on storage.objects for insert to authenticated with check(bucket_id='product-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- No overwrite policy: replacements always use a fresh generated filename.
create policy photo_delete on storage.objects for delete to authenticated using(bucket_id='product-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and not exists(select 1 from public.products where image_path=name));
