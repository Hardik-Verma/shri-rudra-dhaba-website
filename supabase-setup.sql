-- ============================================================
-- Shri Rudra Dhaba — full Supabase setup (fresh project)
-- Paste the WHOLE file into Supabase Dashboard → SQL Editor → Run.
-- Safe to re-run: every section is idempotent.
-- ============================================================

-- 1. Extensions ------------------------------------------------
create extension if not exists "pgcrypto";

-- 2. Roles ------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'user', 'owner');
exception when duplicate_object then null;
end $$;

-- 3. user_roles + has_role() ------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

drop policy if exists "Users read own roles" on public.user_roles;
create policy "Users read own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid());

-- Owner auto-grant on signup (change the email if ownership moves)
create or replace function public.handle_owner_signup()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if lower(new.email) = 'hardikverma1902@gmail.com'
     and not exists (select 1 from public.user_roles where role = 'owner') then
    insert into public.user_roles (user_id, role) values (new.id, 'owner'), (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_owner on auth.users;
create trigger on_auth_user_created_owner after insert on auth.users
for each row execute function public.handle_owner_signup();

-- If the owner account already exists, grant now
insert into public.user_roles (user_id, role)
select u.id, r.role
from auth.users u
cross join (values ('owner'::public.app_role), ('admin'::public.app_role)) r(role)
where lower(u.email) = 'hardikverma1902@gmail.com'
  and not exists (select 1 from public.user_roles where role = 'owner')
on conflict do nothing;

-- 4. site_settings (single row, id = 1) --------------------------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  phone text,
  whatsapp text,
  updated_at timestamptz not null default now(),
  banner_image_url text,
  banner_eyebrow text not null default 'Shri Rudra',
  banner_heading text not null default 'Murthal Walo Ka Dhaba',
  banner_text text not null default 'Murthal-style food on NH-734 near Bijnor. Fresh tandoor, white-butter parathas and chai — right on the highway.',
  banner_primary_button text not null default 'Navigate',
  banner_secondary_button text not null default 'Call Dhaba',
  banner_video_path text,
  about_heading text not null default 'A highway stop made for a proper pause',
  about_text text not null default 'Shri Rudra Murthal Walo Ka Dhaba welcomes diners on NH-734 near Bijnor. Visit for a dine-in break, browse the live menu, and order from your table.',
  about_image_url text,
  logo_image_url text
);
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;

drop policy if exists "Anyone reads settings" on public.site_settings;
create policy "Anyone reads settings"
on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admins insert settings" on public.site_settings;
create policy "Admins insert settings"
on public.site_settings for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins update settings" on public.site_settings;
create policy "Admins update settings"
on public.site_settings for update to authenticated
using (public.has_role(auth.uid(), 'admin'));

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

-- 5. menu_items ---------------------------------------------------
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  is_veg boolean not null default true,
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  image_url text
);
grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;

drop policy if exists "Anyone reads menu" on public.menu_items;
create policy "Anyone reads menu"
on public.menu_items for select to anon, authenticated using (true);
drop policy if exists "Admins insert menu" on public.menu_items;
create policy "Admins insert menu"
on public.menu_items for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins update menu" on public.menu_items;
create policy "Admins update menu"
on public.menu_items for update to authenticated
using (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins delete menu" on public.menu_items;
create policy "Admins delete menu"
on public.menu_items for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 6. gallery_media -------------------------------------------------
create table if not exists public.gallery_media (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt_text text not null default 'Shri Rudra Dhaba',
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.gallery_media to anon;
grant select, insert, update, delete on public.gallery_media to authenticated;
grant all on public.gallery_media to service_role;
alter table public.gallery_media enable row level security;

drop policy if exists "Anyone reads gallery" on public.gallery_media;
create policy "Anyone reads gallery"
on public.gallery_media for select to anon, authenticated using (true);
drop policy if exists "Admins insert gallery" on public.gallery_media;
create policy "Admins insert gallery"
on public.gallery_media for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins update gallery" on public.gallery_media;
create policy "Admins update gallery"
on public.gallery_media for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins delete gallery" on public.gallery_media;
create policy "Admins delete gallery"
on public.gallery_media for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 7. Storage: private site-media bucket -----------------------------
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', false)
on conflict (id) do nothing;

-- Admin-only access to temp menu PDF uploads
drop policy if exists "Admins can upload menu files" on storage.objects;
create policy "Admins can upload menu files"
on storage.objects for insert to authenticated
with check (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can read menu files" on storage.objects;
create policy "Admins can read menu files"
on storage.objects for select to authenticated
using (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update menu files" on storage.objects;
create policy "Admins can update menu files"
on storage.objects for update to authenticated
using (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete menu files" on storage.objects;
create policy "Admins can delete menu files"
on storage.objects for delete to authenticated
using (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'));

-- Public reads + admin writes for published media (banner videos)
drop policy if exists "Public reads published site media" on storage.objects;
create policy "Public reads published site media"
on storage.objects for select to anon, authenticated
using (bucket_id = 'site-media' and (storage.foldername(name))[1] = 'public-media');

drop policy if exists "Admins upload published site media" on storage.objects;
create policy "Admins upload published site media"
on storage.objects for insert to authenticated
with check (bucket_id = 'site-media' and (storage.foldername(name))[1] = 'public-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins update published site media" on storage.objects;
create policy "Admins update published site media"
on storage.objects for update to authenticated
using (bucket_id = 'site-media' and (storage.foldername(name))[1] = 'public-media' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'site-media' and (storage.foldername(name))[1] = 'public-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins delete published site media" on storage.objects;
create policy "Admins delete published site media"
on storage.objects for delete to authenticated
using (bucket_id = 'site-media' and (storage.foldername(name))[1] = 'public-media' and public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- DONE. Next steps:
-- 1. Supabase → Authentication → Sign up with hardikverma1902@gmail.com
--    (owner + admin roles are granted automatically by the trigger).
-- 2. Copy the new Project URL + publishable key + service_role key
--    into Render env vars AND your local .env, then redeploy.
-- ============================================================
