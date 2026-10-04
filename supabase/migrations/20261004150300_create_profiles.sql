-- Member profiles, one per auth user, created by a trigger on signup.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 80),
  email text not null,
  usn text check (usn is null or usn ~ '^[1-4][A-Z]{2}[0-9]{2}[A-Z]{2,3}[0-9]{3}$'),
  member_id text not null unique,
  checklist jsonb not null default '{}'::jsonb check (jsonb_typeof(checklist) = 'object' and pg_column_size(checklist) < 2000),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Members can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Members can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Members may only change their checklist; everything else is set by the trigger.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (checklist) on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := left(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 80);
  v_usn  text := nullif(upper(trim(new.raw_user_meta_data ->> 'usn')), '');
begin
  if v_usn is not null and v_usn !~ '^[1-4][A-Z]{2}[0-9]{2}[A-Z]{2,3}[0-9]{3}$' then
    v_usn := null;
  end if;
  insert into public.profiles (id, full_name, email, usn, member_id)
  values (
    new.id,
    coalesce(v_name, split_part(new.email, '@', 1)),
    new.email,
    v_usn,
    'ECS-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(new.id::text, '-', ''), 1, 6))
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
