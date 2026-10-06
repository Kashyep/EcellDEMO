-- Migration: Enable search for unassigned members by name, email, or member_id
-- Date: 2026-10-06

-- 1. Enhanced find_member: Head-only lookup for unassigned members supporting name, email, or member_id
create or replace function public.find_member(identifier text)
returns table (
  id uuid,
  full_name text,
  member_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_caller_role text;
  v_clean_ident text := trim(coalesce(identifier, ''));
  v_pattern text;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select p.designation into v_caller_role
    from public.profiles p
   where p.id = v_caller;

  if v_caller_role is distinct from 'head' then
    raise exception 'Only domain Heads can search for unassigned members';
  end if;

  if v_clean_ident = '' then
    raise exception 'Search identifier is required';
  end if;

  -- Safe pattern escaping wildcards
  v_pattern := '%' || replace(replace(replace(lower(v_clean_ident), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  return query
  select p.id, p.full_name, p.member_id
    from public.profiles p
   where (
     lower(p.full_name) like v_pattern
     or lower(p.email) like v_pattern
     or upper(p.member_id) like '%' || replace(replace(replace(upper(v_clean_ident), '\', '\\'), '%', '\%'), '_', '\_') || '%'
   )
     and p.domain is null
     and p.designation is null
   order by
     case
       when lower(p.full_name) = lower(v_clean_ident) then 1
       when lower(p.full_name) like lower(v_clean_ident) || '%' then 2
       when upper(p.member_id) = upper(v_clean_ident) then 3
       when lower(p.email) = lower(v_clean_ident) then 4
       else 5
     end,
     p.full_name asc
   limit 25;
end;
$$;

revoke all on function public.find_member(text) from public, anon;
grant execute on function public.find_member(text) to authenticated;

-- 2. Optional helper: get_unassigned_members for Head to browse unassigned candidates
create or replace function public.get_unassigned_members(limit_count integer default 15)
returns table (
  id uuid,
  full_name text,
  member_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_caller_role text;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select p.designation into v_caller_role
    from public.profiles p
   where p.id = v_caller;

  if v_caller_role is distinct from 'head' then
    raise exception 'Only domain Heads can view unassigned members';
  end if;

  return query
  select p.id, p.full_name, p.member_id
    from public.profiles p
   where p.domain is null
     and p.designation is null
   order by p.created_at desc, p.full_name asc
   limit coalesce(limit_count, 15);
end;
$$;

revoke all on function public.get_unassigned_members(integer) from public, anon;
grant execute on function public.get_unassigned_members(integer) to authenticated;
