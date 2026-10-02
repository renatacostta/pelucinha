-- PELUCHINHA ACESSÓRIOS — SUPABASE
-- Execute este arquivo no SQL Editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null default 0,
  sale_price numeric(12,2),
  category_id uuid references public.categories(id) on delete set null,
  stock integer not null default 0,
  available boolean not null default true,
  published boolean not null default false,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.admin_users enable row level security;

create policy "public read active categories" on public.categories
for select using (active = true);

create policy "public read published products" on public.products
for select using (published = true and available = true);

create policy "public read images of public products" on public.product_images
for select using (exists (
  select 1 from public.products p
  where p.id = product_images.product_id
    and p.published = true and p.available = true
));

create policy "admin read admin_users" on public.admin_users
for select to authenticated using (user_id = auth.uid());

create policy "admin manage categories" on public.categories
for all to authenticated using (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
) with check (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

create policy "admin manage products" on public.products
for all to authenticated using (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
) with check (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

create policy "admin manage images" on public.product_images
for all to authenticated using (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
) with check (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

-- Storage:
-- Crie manualmente um bucket público chamado "product-images"
-- e configure políticas de upload/update/delete para usuários
-- presentes em public.admin_users.


-- STORAGE: bucket público para fotos dos produtos.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

create policy "public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "admins upload product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

create policy "admins update product images"
on storage.objects for update to authenticated
using (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
)
with check (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

create policy "admins delete product images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);
