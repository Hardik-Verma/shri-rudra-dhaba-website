create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- First user to sign up becomes admin
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  phone text,
  whatsapp text,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "Anyone reads settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Admins insert settings" on public.site_settings for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update settings" on public.site_settings for update to authenticated using (public.has_role(auth.uid(), 'admin'));
insert into public.site_settings (id) values (1);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  is_veg boolean not null default true,
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;
create policy "Anyone reads menu" on public.menu_items for select to anon, authenticated using (true);
create policy "Admins insert menu" on public.menu_items for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update menu" on public.menu_items for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete menu" on public.menu_items for delete to authenticated using (public.has_role(auth.uid(), 'admin'));