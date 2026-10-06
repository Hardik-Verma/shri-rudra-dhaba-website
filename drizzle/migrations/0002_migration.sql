-- Revoke the old "first signup becomes admin" behaviour
drop trigger if exists on_auth_user_created_admin on auth.users;
drop function if exists public.handle_first_admin();

delete from public.user_roles
where user_id not in (select id from auth.users where lower(email) = 'hardikverma1902@gmail.com');

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
create trigger on_auth_user_created_owner after insert on auth.users
for each row execute function public.handle_owner_signup();

-- If the owner account already exists, grant now
insert into public.user_roles (user_id, role)
select u.id, r.role from auth.users u cross join (values ('owner'::app_role), ('admin'::app_role)) r(role)
where lower(u.email) = 'hardikverma1902@gmail.com'
  and not exists (select 1 from public.user_roles where role = 'owner')
on conflict do nothing;