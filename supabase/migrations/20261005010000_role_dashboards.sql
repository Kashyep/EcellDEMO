-- Migration: Role Dashboards, Domain Hierarchies, Tasks, Events, and Role Management RPCs
-- Date: 2026-10-05

-- 1. Profiles Table Extension
alter table public.profiles
  add column domain text,
  add column designation text;

alter table public.profiles
  add constraint profiles_domain_check
    check (domain is null or domain in ('tech', 'marketing', 'design', 'content', 'events', 'operations')),
  add constraint profiles_designation_check
    check (designation is null or designation in ('executive', 'co_head', 'head')),
  add constraint profiles_domain_designation_paired_check
    check ((domain is null and designation is null) or (domain is not null and designation is not null));

create index profiles_domain_idx on public.profiles (domain);
create index profiles_designation_idx on public.profiles (designation);
create index profiles_domain_designation_idx on public.profiles (domain, designation);

-- 2. Role Ranking and Seniority Function
create or replace function public.role_rank(p_designation text)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return case lower(trim(coalesce(p_designation, '')))
    when 'head' then 3
    when 'co_head' then 2
    when 'executive' then 1
    else 0
  end;
end;
$$;

revoke all on function public.role_rank(text) from public, anon;
grant execute on function public.role_rank(text) to authenticated;

-- Seniority by member UUIDs (checks same-domain and higher rank)
create or replace function public.is_senior_of(p_senior_id uuid, p_junior_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_senior_domain text;
  v_senior_rank integer;
  v_junior_domain text;
  v_junior_rank integer;
begin
  if p_senior_id is null or p_junior_id is null or p_senior_id = p_junior_id then
    return false;
  end if;

  select domain, public.role_rank(designation)
    into v_senior_domain, v_senior_rank
    from public.profiles
   where id = p_senior_id;

  select domain, public.role_rank(designation)
    into v_junior_domain, v_junior_rank
    from public.profiles
   where id = p_junior_id;

  if v_senior_domain is null or v_junior_domain is null then
    return false;
  end if;

  return (v_senior_domain = v_junior_domain) and (v_senior_rank > v_junior_rank);
end;
$$;

revoke all on function public.is_senior_of(uuid, uuid) from public, anon;
grant execute on function public.is_senior_of(uuid, uuid) to authenticated;

-- 3. Profiles RLS: Senior Profile Access (read lower-rank members in same domain)
create policy "Seniors can read subordinate profiles in same domain"
  on public.profiles for select to authenticated
  using (
    domain is not null
    and public.is_senior_of((select auth.uid()), id)
  );

-- 4. Tasks Table
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  domain text not null check (domain in ('tech', 'marketing', 'design', 'content', 'events', 'operations')),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  assigned_to uuid not null references public.profiles (id) on delete restrict,
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'submitted', 'approved', 'changes_requested')),
  due_date date,
  submission_note text check (submission_note is null or char_length(submission_note) <= 2000),
  submission_link text check (submission_link is null or submission_link ~* '^https://[a-zA-Z0-9].+'),
  review_note text check (review_note is null or char_length(review_note) <= 2000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_domain_idx on public.tasks (domain);
create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_assigned_by_idx on public.tasks (assigned_by);
create index tasks_status_idx on public.tasks (status);
create index tasks_due_date_idx on public.tasks (due_date);
create index tasks_domain_status_idx on public.tasks (domain, status);
create index tasks_assigned_to_status_idx on public.tasks (assigned_to, status);

alter table public.tasks enable row level security;

-- 5. Task Events Table (Audit Log)
create table public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  action text not null check (action in ('created', 'started', 'submitted', 'approved', 'changes_requested', 'reassigned')),
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create index task_events_task_id_idx on public.task_events (task_id);
create index task_events_actor_id_idx on public.task_events (actor_id);
create index task_events_action_idx on public.task_events (action);
create index task_events_created_at_idx on public.task_events (created_at);

alter table public.task_events enable row level security;

-- 6. Triggers on Tasks
-- 6a. updated_at timestamp trigger
create or replace function public.update_tasks_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.update_tasks_updated_at() from public, anon, authenticated;

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_tasks_updated_at();

-- 6b. Automatically log "created" event on task insert
create or replace function public.handle_task_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_events (task_id, actor_id, action, created_at)
  values (new.id, new.assigned_by, 'created', new.created_at);
  return new;
end;
$$;

revoke all on function public.handle_task_created() from public, anon, authenticated;

create trigger trg_task_created_event
  after insert on public.tasks
  for each row execute function public.handle_task_created();

-- 7. Table Grants and Row-Level Security Policies
-- Tasks permissions: client can only SELECT and INSERT specific safe task fields
-- ONLY title, description, assigned_to, assigned_by, domain, priority, due_date permitted
revoke all on public.tasks from anon, authenticated, public;
grant select on public.tasks to authenticated;
grant insert (title, description, assigned_to, assigned_by, domain, priority, due_date) on public.tasks to authenticated;

-- Task events permissions: strictly read-only for clients (no direct client writes)
revoke all on public.task_events from anon, authenticated, public;
grant select on public.task_events to authenticated;

-- RLS: Tasks SELECT - assignee or higher-rank in same task domain (strictly no extra bypass)
create policy "Assignee or higher-rank same-domain can read tasks"
  on public.tasks for select to authenticated
  using (
    assigned_to = (select auth.uid())
    or (
      tasks.domain = (select p.domain from public.profiles p where p.id = (select auth.uid()) and p.domain is not null)
      and public.is_senior_of((select auth.uid()), assigned_to)
    )
  );

-- RLS: Tasks INSERT - only senior same-domain assigned_by auth.uid
create policy "Senior same-domain can insert tasks"
  on public.tasks for insert to authenticated
  with check (
    assigned_by = (select auth.uid())
    and domain = (select p.domain from public.profiles p where p.id = (select auth.uid()) and p.domain is not null)
    and public.is_senior_of((select auth.uid()), assigned_to)
  );

-- RLS: Task events SELECT - accessible if parent task is accessible
create policy "Assignee or higher-rank same-domain can read task events"
  on public.task_events for select to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_events.task_id
        and (
          t.assigned_to = (select auth.uid())
          or (
            t.domain = (select p.domain from public.profiles p where p.id = (select auth.uid()) and p.domain is not null)
            and public.is_senior_of((select auth.uid()), t.assigned_to)
          )
        )
    )
  );

-- 8. RPC Functions
-- 8a. start_task: transition from 'todo' OR 'changes_requested' to 'in_progress'
create or replace function public.start_task(task_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_task record;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if task_id is null then
    raise exception 'task_id is required';
  end if;

  select * into v_task
    from public.tasks
   where id = task_id
     for update;

  if not found then
    raise exception 'Task not found';
  end if;

  if v_task.assigned_to != v_caller then
    raise exception 'Only the assigned member can start this task';
  end if;

  if v_task.status not in ('todo', 'changes_requested') then
    raise exception 'Task cannot be started from status "%". Expected "todo" or "changes_requested"', v_task.status;
  end if;

  update public.tasks
     set status = 'in_progress',
         review_note = null,
         reviewed_by = null,
         updated_at = now()
   where id = task_id;

  insert into public.task_events (task_id, actor_id, action, created_at)
  values (task_id, v_caller, 'started', now());

  return jsonb_build_object(
    'task_id', task_id,
    'status', 'in_progress'
  );
end;
$$;

revoke all on function public.start_task(uuid) from public, anon;
grant execute on function public.start_task(uuid) to authenticated;

-- 8b. submit_task: transition ONLY from 'in_progress' to 'submitted'
create or replace function public.submit_task(
  task_id uuid,
  note text default null,
  link text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_task record;
  v_trimmed_link text := nullif(trim(link), '');
  v_trimmed_note text := nullif(trim(note), '');
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if task_id is null then
    raise exception 'task_id is required';
  end if;

  select * into v_task
    from public.tasks
   where id = task_id
     for update;

  if not found then
    raise exception 'Task not found';
  end if;

  if v_task.assigned_to != v_caller then
    raise exception 'Only the assigned member can submit this task';
  end if;

  if v_task.status != 'in_progress' then
    raise exception 'Task cannot be submitted from status "%". Expected "in_progress"', v_task.status;
  end if;

  if v_trimmed_link is not null and v_trimmed_link !~* '^https://[a-zA-Z0-9].+' then
    raise exception 'Submission link must be a valid secure URL starting with https://';
  end if;

  update public.tasks
     set status = 'submitted',
         submission_note = v_trimmed_note,
         submission_link = v_trimmed_link,
         updated_at = now()
   where id = task_id;

  insert into public.task_events (task_id, actor_id, action, note, created_at)
  values (task_id, v_caller, 'submitted', v_trimmed_note, now());

  return jsonb_build_object(
    'task_id', task_id,
    'status', 'submitted',
    'submission_link', v_trimmed_link
  );
end;
$$;

revoke all on function public.submit_task(uuid, text, text) from public, anon;
grant execute on function public.submit_task(uuid, text, text) to authenticated;

-- 8c. review_task: senior decision on submitted task ('approved' or 'changes_requested')
-- Rechecks task domain matches caller current domain and seniority
create or replace function public.review_task(
  task_id uuid,
  decision text,
  note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_caller_profile record;
  v_task record;
  v_decision text := lower(trim(coalesce(decision, '')));
  v_trimmed_note text := nullif(trim(note), '');
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if task_id is null then
    raise exception 'task_id is required';
  end if;

  if v_decision not in ('approved', 'changes_requested') then
    raise exception 'Invalid review decision "%". Allowed decisions are "approved" or "changes_requested"', decision;
  end if;

  select * into v_caller_profile
    from public.profiles
   where id = v_caller;

  if v_caller_profile.domain is null then
    raise exception 'Reviewer has no domain assigned';
  end if;

  select * into v_task
    from public.tasks
   where id = task_id
     for update;

  if not found then
    raise exception 'Task not found';
  end if;

  if v_task.status != 'submitted' then
    raise exception 'Task cannot be reviewed from status "%". Expected "submitted"', v_task.status;
  end if;

  if v_task.assigned_to = v_caller then
    raise exception 'Members cannot review their own submissions';
  end if;

  if v_caller_profile.domain != v_task.domain then
    raise exception 'Reviewer domain (%) does not match task domain (%)', v_caller_profile.domain, v_task.domain;
  end if;

  if not public.is_senior_of(v_caller, v_task.assigned_to) then
    raise exception 'Only seniors in the same domain can review this task';
  end if;

  update public.tasks
     set status = v_decision,
         review_note = v_trimmed_note,
         reviewed_by = v_caller,
         updated_at = now()
   where id = task_id;

  insert into public.task_events (task_id, actor_id, action, note, created_at)
  values (task_id, v_caller, v_decision, v_trimmed_note, now());

  return jsonb_build_object(
    'task_id', task_id,
    'status', v_decision,
    'reviewed_by', v_caller
  );
end;
$$;

revoke all on function public.review_task(uuid, text, text) from public, anon;
grant execute on function public.review_task(uuid, text, text) to authenticated;

-- 8d. assign_member: Head assigns lower roles in own domain (no self, upward, cross-domain, or stealing)
create or replace function public.assign_member(
  member uuid,
  domain text,
  designation text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_caller_profile record;
  v_target record;
  v_clean_domain text := lower(trim(coalesce(domain, '')));
  v_clean_desig text := lower(trim(coalesce(designation, '')));
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if member is null then
    raise exception 'Member id is required';
  end if;

  select * into v_caller_profile
    from public.profiles
   where id = v_caller;

  if not found or v_caller_profile.designation != 'head' or v_caller_profile.domain is null then
    raise exception 'Only domain Heads can assign members';
  end if;

  if v_clean_domain != v_caller_profile.domain then
    raise exception 'Heads can only assign members to their own domain (%)', v_caller_profile.domain;
  end if;

  if v_clean_desig not in ('executive', 'co_head') then
    raise exception 'Heads can only assign lower roles ("executive" or "co_head")';
  end if;

  if member = v_caller then
    raise exception 'Cannot assign or modify your own role';
  end if;

  select * into v_target
    from public.profiles
   where id = member
     for update;

  if not found then
    raise exception 'Target member not found';
  end if;

  if v_target.designation = 'head' then
    raise exception 'Cannot modify another Head';
  end if;

  if v_target.domain is not null and v_target.domain != v_caller_profile.domain then
    raise exception 'Cannot steal member from domain "%"', v_target.domain;
  end if;

  update public.profiles
     set domain = v_caller_profile.domain,
         designation = v_clean_desig
   where id = member;

  return jsonb_build_object(
    'member_id', member,
    'domain', v_caller_profile.domain,
    'designation', v_clean_desig
  );
end;
$$;

revoke all on function public.assign_member(uuid, text, text) from public, anon;
grant execute on function public.assign_member(uuid, text, text) to authenticated;

-- 8e. remove_member: Head removes lower roles in own domain (retains historical task assignee and task-domain defense)
create or replace function public.remove_member(member uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_caller_profile record;
  v_target record;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if member is null then
    raise exception 'Member id is required';
  end if;

  select * into v_caller_profile
    from public.profiles
   where id = v_caller;

  if not found or v_caller_profile.designation != 'head' or v_caller_profile.domain is null then
    raise exception 'Only domain Heads can remove members';
  end if;

  if member = v_caller then
    raise exception 'Cannot remove yourself';
  end if;

  select * into v_target
    from public.profiles
   where id = member
     for update;

  if not found then
    raise exception 'Target member not found';
  end if;

  if v_target.domain is distinct from v_caller_profile.domain then
    raise exception 'Cannot remove member from another domain';
  end if;

  if v_target.designation = 'head' then
    raise exception 'Cannot remove another Head';
  end if;

  -- Membership removal only: retain historical task assignee and task-domain defense
  update public.profiles
     set domain = null,
         designation = null
   where id = member;

  return jsonb_build_object(
    'member_id', member,
    'removed', true
  );
end;
$$;

revoke all on function public.remove_member(uuid) from public, anon;
grant execute on function public.remove_member(uuid) to authenticated;

-- 8f. find_member: Head-only lookup for unassigned members by exact email or member_id
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

  return query
  select p.id, p.full_name, p.member_id
    from public.profiles p
   where (lower(p.email) = lower(v_clean_ident) or upper(p.member_id) = upper(v_clean_ident))
     and p.domain is null
     and p.designation is null;
end;
$$;

revoke all on function public.find_member(text) from public, anon;
grant execute on function public.find_member(text) to authenticated;

-- 8g. team_directory: safe member directory returning caller and same-domain members (protects private email/usn)
create or replace function public.team_directory()
returns table (
  id uuid,
  full_name text,
  domain text,
  designation text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_caller_domain text;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select p.domain into v_caller_domain
    from public.profiles p
   where p.id = v_caller;

  return query
  select p.id, p.full_name, p.domain, p.designation
    from public.profiles p
   where p.id = v_caller
      or (v_caller_domain is not null and p.domain = v_caller_domain)
   order by public.role_rank(p.designation) desc, p.full_name asc;
end;
$$;

revoke all on function public.team_directory() from public, anon;
grant execute on function public.team_directory() to authenticated;

-- 8h. team_stats: aggregate subordinate metrics including members with 0 tasks
-- Uses due_date < current_date for overdue and approved as sole completion
create or replace function public.team_stats()
returns table (
  member_id uuid,
  full_name text,
  designation text,
  todo bigint,
  in_progress bigint,
  submitted bigint,
  approved bigint,
  changes_requested bigint,
  completed bigint,
  overdue bigint,
  total bigint,
  completion_rate numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_caller_domain text;
  v_caller_rank integer;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select p.domain, public.role_rank(p.designation)
    into v_caller_domain, v_caller_rank
    from public.profiles p
   where p.id = v_caller;

  if v_caller_domain is null or v_caller_rank <= 1 then
    -- Executives or unassigned members have no subordinates
    return;
  end if;

  return query
  select
    p.id as member_id,
    p.full_name,
    p.designation,
    count(t.id) filter (where t.status = 'todo')::bigint as todo,
    count(t.id) filter (where t.status = 'in_progress')::bigint as in_progress,
    count(t.id) filter (where t.status = 'submitted')::bigint as submitted,
    count(t.id) filter (where t.status = 'approved')::bigint as approved,
    count(t.id) filter (where t.status = 'changes_requested')::bigint as changes_requested,
    count(t.id) filter (where t.status = 'approved')::bigint as completed,
    count(t.id) filter (where t.status != 'approved' and t.due_date is not null and t.due_date < current_date)::bigint as overdue,
    count(t.id)::bigint as total,
    case
      when count(t.id) = 0 then 0.0
      else round((count(t.id) filter (where t.status = 'approved')::numeric / count(t.id)::numeric) * 100, 2)
    end as completion_rate
  from public.profiles p
  left join public.tasks t on t.assigned_to = p.id and t.domain = v_caller_domain
  where p.domain = v_caller_domain
    and public.role_rank(p.designation) < v_caller_rank
    and p.id != v_caller
  group by p.id, p.full_name, p.designation
  order by public.role_rank(p.designation) desc, p.full_name asc;
end;
$$;

revoke all on function public.team_stats() from public, anon;
grant execute on function public.team_stats() to authenticated;
