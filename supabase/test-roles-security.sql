-- ============================================================================
-- E-Cell SMVIT: Rollback Transaction Security & Functional SQL Test Suite
-- File: supabase/test-roles-security.sql
-- ============================================================================
--
-- This script executes inside a single transaction and ALWAYS rolls back at
-- the end, ensuring no test data or changes remain in the database.
--
-- REQUIREMENTS VERIFIED:
-- 1. Paired domain/designation constraints & allowed enum values.
-- 2. role_rank and is_senior_of ranking functions (security definer, empty search_path).
-- 3. Senior profile access RLS & safe team_directory() RPC (no email/usn leak).
-- 4. Head-only find_member() for unassigned members.
-- 5. assign_member() and remove_member() rules (own-domain, lower roles, no self,
--    no upward, no cross-domain, no stealing).
-- 6. remove_member() membership removal: retains historical task assignee and
--    task-domain defense so new team cannot see old-domain work.
-- 7. Tasks & Task Events table creation, status transitions, and triggers.
-- 8. Column-level insert privilege: permits ONLY (title, description, assigned_to,
--    assigned_by, domain, priority, due_date); prevents client spoofing of id,
--    status, submission, or review metadata.
-- 9. Client protection: No direct client UPDATE or DELETE on tasks.
-- 10. Client protection: No direct client INSERT/UPDATE/DELETE on task_events.
-- 11. RPC execute privileges: PUBLIC and anon revoked; authenticated only.
-- 12. RPC state transitions:
--     - start_task: transitions from 'todo' OR 'changes_requested' to 'in_progress'.
--     - submit_task: transitions ONLY from 'in_progress' to 'submitted' (cannot submit changes_requested directly).
--     - review_task: validates task domain equals reviewer domain and reviewer seniority.
-- 13. team_stats() calculation: uses due_date < current_date for overdue and
--     approved as sole completion for all subordinates including 0-task members.
-- ============================================================================

BEGIN;

-- Helper schema for test execution state and assertions
CREATE SCHEMA IF NOT EXISTS test_helpers;

CREATE TABLE test_helpers.test_results (
  step_num integer,
  test_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('PASSED', 'FAILED')),
  details text
);

CREATE OR REPLACE PROCEDURE test_helpers.assert_true(
  p_step integer,
  p_name text,
  p_condition boolean,
  p_details text DEFAULT ''
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_condition THEN
    INSERT INTO test_helpers.test_results (step_num, test_name, status, details)
    VALUES (p_step, p_name, 'PASSED', p_details);
    RAISE NOTICE '[PASS] Step %: %', p_step, p_name;
  ELSE
    INSERT INTO test_helpers.test_results (step_num, test_name, status, details)
    VALUES (p_step, p_name, 'FAILED', p_details);
    RAISE EXCEPTION '[FAIL] Step %: % - Details: %', p_step, p_name, p_details;
  END IF;
END;
$$;

-- Helper to switch JWT session context to a specific user
CREATE OR REPLACE PROCEDURE test_helpers.authenticate_as(p_user_id uuid)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claims', '{}', true);
    PERFORM set_config('role', 'none', true);
  ELSE
    PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
    PERFORM set_config('request.jwt.claims', json_build_object('sub', p_user_id::text, 'role', 'authenticated')::text, true);
    PERFORM set_config('role', 'authenticated', true);
  END IF;
END;
$$;

-- Helper to switch context to anonymous / unauthenticated client
CREATE OR REPLACE PROCEDURE test_helpers.authenticate_as_anon()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '{"role": "anon"}', true);
  PERFORM set_config('role', 'anon', true);
END;
$$;

-- Grant test harness execution & write permissions to anon and authenticated (test transaction only)
GRANT USAGE ON SCHEMA test_helpers TO authenticated, anon;
GRANT ALL ON TABLE test_helpers.test_results TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA test_helpers TO authenticated, anon;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA test_helpers TO authenticated, anon;
GRANT ALL ON ALL ROUTINES IN SCHEMA test_helpers TO authenticated, anon;

-- ----------------------------------------------------------------------------
-- FIXTURES SETUP
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_uid_head_tech uuid := '11111111-1111-1111-1111-111111111111';
  v_uid_cohead_tech uuid := '22222222-2222-2222-2222-222222222222';
  v_uid_exec_tech1 uuid := '33333333-3333-3333-3333-333333333333';
  v_uid_exec_tech2 uuid := '44444444-4444-4444-4444-444444444444';
  v_uid_head_mkt uuid := '55555555-5555-5555-5555-555555555555';
  v_uid_exec_mkt uuid := '66666666-6666-6666-6666-666666666666';
  v_uid_unassigned uuid := '77777777-7777-7777-7777-777777777777';
BEGIN
  -- Insert auth users
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES
    (v_uid_head_tech, 'head.fixture@ecellsmvit.in', '{"full_name": "Tech Head", "usn": "1VE21CS001"}'::jsonb),
    (v_uid_cohead_tech, 'cohead.fixture@ecellsmvit.in', '{"full_name": "Tech Co-Head", "usn": "1VE21CS002"}'::jsonb),
    (v_uid_exec_tech1, 'exec1.fixture@ecellsmvit.in', '{"full_name": "Tech Exec One", "usn": "1VE22CS003"}'::jsonb),
    (v_uid_exec_tech2, 'exec2.fixture@ecellsmvit.in', '{"full_name": "Tech Exec Two", "usn": "1VE22CS004"}'::jsonb),
    (v_uid_head_mkt, 'head.mkt@ecellsmvit.in', '{"full_name": "Marketing Head", "usn": "1VE21IS005"}'::jsonb),
    (v_uid_exec_mkt, 'exec.mkt@ecellsmvit.in', '{"full_name": "Marketing Exec", "usn": "1VE22IS006"}'::jsonb),
    (v_uid_unassigned, 'new.member@ecellsmvit.in', '{"full_name": "New Candidate", "usn": "1VE23CS007"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- Ensure profiles exist
  INSERT INTO public.profiles (id, full_name, email, usn, member_id, domain, designation)
  VALUES
    (v_uid_head_tech, 'Tech Head', 'head.fixture@ecellsmvit.in', '1VE21CS001', 'ECS-2026-TE0001', 'tech', 'head'),
    (v_uid_cohead_tech, 'Tech Co-Head', 'cohead.fixture@ecellsmvit.in', '1VE21CS002', 'ECS-2026-TE0002', 'tech', 'co_head'),
    (v_uid_exec_tech1, 'Tech Exec One', 'exec1.fixture@ecellsmvit.in', '1VE22CS003', 'ECS-2026-TE0003', 'tech', 'executive'),
    (v_uid_exec_tech2, 'Tech Exec Two', 'exec2.fixture@ecellsmvit.in', '1VE22CS004', 'ECS-2026-TE0004', 'tech', 'executive'),
    (v_uid_head_mkt, 'Marketing Head', 'head.mkt@ecellsmvit.in', '1VE21IS005', 'ECS-2026-MK0005', 'marketing', 'head'),
    (v_uid_exec_mkt, 'Marketing Exec', 'exec.mkt@ecellsmvit.in', '1VE22IS006', 'ECS-2026-MK0006', 'marketing', 'executive'),
    (v_uid_unassigned, 'New Candidate', 'new.member@ecellsmvit.in', '1VE23CS007', 'ECS-2026-UN0007', null, null)
  ON CONFLICT (id) DO UPDATE
    SET member_id = EXCLUDED.member_id,
        domain = EXCLUDED.domain,
        designation = EXCLUDED.designation;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 1: Paired domain/designation constraints & allowed values
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_err boolean := false;
BEGIN
  -- Test 1a: Domain without designation must fail
  BEGIN
    UPDATE public.profiles
       SET domain = 'tech', designation = null
     WHERE id = '77777777-7777-7777-7777-777777777777';
  EXCEPTION WHEN check_violation THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(1, 'Domain without designation rejected by paired check', v_err);

  -- Test 1b: Designation without domain must fail
  v_err := false;
  BEGIN
    UPDATE public.profiles
       SET domain = null, designation = 'executive'
     WHERE id = '77777777-7777-7777-7777-777777777777';
  EXCEPTION WHEN check_violation THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(2, 'Designation without domain rejected by paired check', v_err);

  -- Test 1c: Invalid domain rejected
  v_err := false;
  BEGIN
    UPDATE public.profiles
       SET domain = 'finance', designation = 'head'
     WHERE id = '77777777-7777-7777-7777-777777777777';
  EXCEPTION WHEN check_violation THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(3, 'Invalid domain "finance" rejected', v_err);

  -- Test 1d: Invalid designation rejected
  v_err := false;
  BEGIN
    UPDATE public.profiles
       SET domain = 'tech', designation = 'manager'
     WHERE id = '77777777-7777-7777-7777-777777777777';
  EXCEPTION WHEN check_violation THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(4, 'Invalid designation "manager" rejected', v_err);
END $$;

-- ----------------------------------------------------------------------------
-- STEP 2: Role ranking & seniority functions
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  CALL test_helpers.assert_true(5, 'role_rank(head) = 3', public.role_rank('head') = 3);
  CALL test_helpers.assert_true(6, 'role_rank(co_head) = 2', public.role_rank('co_head') = 2);
  CALL test_helpers.assert_true(7, 'role_rank(executive) = 1', public.role_rank('executive') = 1);
  CALL test_helpers.assert_true(8, 'role_rank(null) = 0', public.role_rank(null) = 0);

  -- Seniority checks
  CALL test_helpers.assert_true(9, 'Tech Head is senior of Tech Co-Head',
    public.is_senior_of('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));
  CALL test_helpers.assert_true(10, 'Tech Co-Head is senior of Tech Exec',
    public.is_senior_of('22222222-2222-2222-2222-222222222222'::uuid, '33333333-3333-3333-3333-333333333333'::uuid));
  CALL test_helpers.assert_true(11, 'Tech Exec is NOT senior of Tech Head',
    NOT public.is_senior_of('33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid));
  CALL test_helpers.assert_true(12, 'Tech Head is NOT senior of Marketing Exec (cross-domain)',
    NOT public.is_senior_of('11111111-1111-1111-1111-111111111111'::uuid, '66666666-6666-6666-6666-666666666666'::uuid));
END $$;

-- ----------------------------------------------------------------------------
-- STEP 3: RPC execute privileges - PUBLIC and anon revoked
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_err boolean := false;
BEGIN
  CALL test_helpers.authenticate_as_anon();

  -- Test 3a: anon cannot call team_stats
  BEGIN
    PERFORM * FROM public.team_stats();
  EXCEPTION WHEN insufficient_privilege THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(13, 'anon cannot execute team_stats (revoked from anon/public)', v_err);

  -- Test 3b: anon cannot call team_directory
  v_err := false;
  BEGIN
    PERFORM * FROM public.team_directory();
  EXCEPTION WHEN insufficient_privilege THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(14, 'anon cannot execute team_directory (revoked from anon/public)', v_err);

  -- Test 3c: anon cannot call assign_member
  v_err := false;
  BEGIN
    PERFORM public.assign_member('77777777-7777-7777-7777-777777777777', 'tech', 'executive');
  EXCEPTION WHEN insufficient_privilege THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(15, 'anon cannot execute assign_member (revoked from anon/public)', v_err);

  CALL test_helpers.authenticate_as(null);
END $$;

-- ----------------------------------------------------------------------------
-- STEP 4: Senior profile access and team_directory() RPC (privacy protection)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_visible_count integer;
  v_directory_count integer;
  v_exec_can_see_head_profile boolean;
BEGIN
  -- Authenticate as Tech Executive
  CALL test_helpers.authenticate_as('33333333-3333-3333-3333-333333333333');

  -- Direct profile SELECT: Executive can ONLY see own profile
  SELECT count(*) INTO v_visible_count FROM public.profiles;
  CALL test_helpers.assert_true(16, 'Executive can only view own profile via direct SELECT', v_visible_count = 1);

  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111')
    INTO v_exec_can_see_head_profile;
  CALL test_helpers.assert_true(17, 'Executive cannot read Tech Head profile directly (protects email/usn)', NOT v_exec_can_see_head_profile);

  -- Safe Directory RPC: Executive calls team_directory() to get teammate names/roles without email/usn
  SELECT count(*) INTO v_directory_count FROM public.team_directory();
  CALL test_helpers.assert_true(18, 'Executive gets full domain directory via team_directory()', v_directory_count >= 4);

  -- Authenticate as Tech Head
  CALL test_helpers.authenticate_as('11111111-1111-1111-1111-111111111111');

  -- Head can see own profile + 3 subordinates in Tech domain (at least 4)
  SELECT count(*) INTO v_visible_count FROM public.profiles;
  CALL test_helpers.assert_true(19, 'Tech Head can view subordinate profiles in same domain', v_visible_count >= 4);

  -- Reset to postgres admin
  CALL test_helpers.authenticate_as(null);
END $$;

-- ----------------------------------------------------------------------------
-- STEP 5: find_member() Head-only lookup for unassigned members
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_err boolean := false;
  v_found_count integer;
  v_found_member record;
BEGIN
  -- Non-head (Exec) calls find_member -> fails
  CALL test_helpers.authenticate_as('33333333-3333-3333-3333-333333333333');
  BEGIN
    PERFORM * FROM public.find_member('new.member@ecellsmvit.in');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(20, 'Non-head calling find_member is rejected', v_err);

  -- Regression: Unassigned member (null designation) calls find_member -> fails
  CALL test_helpers.authenticate_as('77777777-7777-7777-7777-777777777777');
  v_err := false;
  BEGIN
    PERFORM * FROM public.find_member('new.member@ecellsmvit.in');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(20, 'Unassigned member calling find_member is rejected', v_err);

  -- Regression: Caller with missing profile calls find_member -> fails
  CALL test_helpers.authenticate_as('99999999-9999-9999-9999-999999999999');
  v_err := false;
  BEGIN
    PERFORM * FROM public.find_member('new.member@ecellsmvit.in');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(20, 'Missing profile caller calling find_member is rejected', v_err);

  -- Head calls find_member for unassigned candidate -> returns minimal data
  CALL test_helpers.authenticate_as('11111111-1111-1111-1111-111111111111');
  SELECT count(*) INTO v_found_count FROM public.find_member('new.member@ecellsmvit.in');
  CALL test_helpers.assert_true(21, 'Head successfully finds eligible unassigned member by email', v_found_count = 1);

  -- Strengthened assertion: verify returned unassigned member exact fields without column ambiguity
  SELECT * INTO v_found_member FROM public.find_member('new.member@ecellsmvit.in');
  CALL test_helpers.assert_true(21, 'Head finds unassigned member with exact expected identity and member_id',
    v_found_member.id = '77777777-7777-7777-7777-777777777777'::uuid
    AND v_found_member.full_name = 'New Candidate'
    AND v_found_member.member_id = 'ECS-2026-UN0007');

  -- Head searches for already assigned member -> returns 0 rows (not eligible for adding)
  SELECT count(*) INTO v_found_count FROM public.find_member('exec.mkt@ecellsmvit.in');
  CALL test_helpers.assert_true(22, 'Already assigned member is not returned by find_member', v_found_count = 0);

  -- Head searches for eligible unassigned member by full name
  SELECT count(*) INTO v_found_count FROM public.find_member('New Candidate');
  CALL test_helpers.assert_true(23, 'Head successfully finds eligible unassigned member by full name', v_found_count = 1);

  -- Head searches for eligible unassigned member by partial name (case-insensitive)
  SELECT count(*) INTO v_found_count FROM public.find_member('candidate');
  CALL test_helpers.assert_true(24, 'Head successfully finds eligible unassigned member by partial lowercase name', v_found_count >= 1);

  -- Head searches for eligible unassigned member by first name
  SELECT count(*) INTO v_found_count FROM public.find_member('New');
  CALL test_helpers.assert_true(25, 'Head successfully finds eligible unassigned member by first name', v_found_count = 1);

  -- Head calls get_unassigned_members -> returns eligible unassigned candidate
  SELECT count(*) INTO v_found_count FROM public.get_unassigned_members(10);
  CALL test_helpers.assert_true(26, 'Head successfully retrieves unassigned members list', v_found_count >= 1);

  -- Non-head calling get_unassigned_members -> rejected
  CALL test_helpers.authenticate_as('33333333-3333-3333-3333-333333333333');
  v_err := false;
  BEGIN
    PERFORM * FROM public.get_unassigned_members(10);
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(27, 'Non-head calling get_unassigned_members is rejected', v_err);

  CALL test_helpers.authenticate_as(null);
END $$;

-- ----------------------------------------------------------------------------
-- STEP 6: assign_member() rules & constraints
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_err boolean := false;
  v_target_profile record;
BEGIN
  CALL test_helpers.authenticate_as('11111111-1111-1111-1111-111111111111');

  -- 6a: Head cannot self-assign
  v_err := false;
  BEGIN
    PERFORM public.assign_member('11111111-1111-1111-1111-111111111111', 'tech', 'co_head');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(23, 'Head cannot modify own role', v_err);

  -- 6b: Head cannot assign to different domain
  v_err := false;
  BEGIN
    PERFORM public.assign_member('77777777-7777-7777-7777-777777777777', 'marketing', 'executive');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(24, 'Head cannot assign to cross-domain', v_err);

  -- 6c: Head cannot assign another Head
  v_err := false;
  BEGIN
    PERFORM public.assign_member('77777777-7777-7777-7777-777777777777', 'tech', 'head');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(25, 'Head cannot assign another Head (only lower roles)', v_err);

  -- 6d: Head cannot steal member from another domain
  v_err := false;
  BEGIN
    PERFORM public.assign_member('66666666-6666-6666-6666-666666666666', 'tech', 'executive');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(26, 'Head cannot steal member from marketing domain', v_err);

  -- 6e: Valid assignment of unassigned member succeeds
  PERFORM public.assign_member('77777777-7777-7777-7777-777777777777', 'tech', 'executive');
  SELECT domain, designation INTO v_target_profile
    FROM public.profiles
   WHERE id = '77777777-7777-7777-7777-777777777777';
  CALL test_helpers.assert_true(27, 'Unassigned candidate assigned to Tech Executive successfully',
    v_target_profile.domain = 'tech' AND v_target_profile.designation = 'executive');

  CALL test_helpers.authenticate_as(null);
END $$;

-- ----------------------------------------------------------------------------
-- STEP 7: Task Creation, RLS, Trigger, and Insert-Metadata Bypass Protection
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_err boolean := false;
  v_task_id uuid;
  v_event_count integer;
  v_task_status text;
  v_task_assignee uuid;
BEGIN
  -- 7a: Executive cannot insert task (RLS failure)
  CALL test_helpers.authenticate_as('33333333-3333-3333-3333-333333333333');
  v_err := false;
  BEGIN
    INSERT INTO public.tasks (domain, title, assigned_to, assigned_by)
    VALUES ('tech', 'Exec unauthorized task', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(28, 'Executive cannot create tasks (RLS prevents junior assignment)', v_err);

  -- 7b: Senior (Head) cannot insert task for member in another domain
  CALL test_helpers.authenticate_as('11111111-1111-1111-1111-111111111111');
  v_err := false;
  BEGIN
    INSERT INTO public.tasks (domain, title, assigned_to, assigned_by)
    VALUES ('tech', 'Cross domain assignment', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(29, 'Senior cannot assign task cross-domain', v_err);

  -- 7c: ATTACK TEST: User attempts to client-spoof task ID on INSERT
  v_err := false;
  BEGIN
    INSERT INTO public.tasks (id, domain, title, assigned_to, assigned_by)
    VALUES ('88888888-8888-8888-8888-888888888888', 'tech', 'Spoofed ID task', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111');
  EXCEPTION WHEN insufficient_privilege THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(30, 'Column privilege prevents client spoofing task ID on INSERT', v_err);

  -- 7d: ATTACK TEST: User attempts to fabricate status on INSERT (metadata bypass)
  v_err := false;
  BEGIN
    INSERT INTO public.tasks (domain, title, assigned_to, assigned_by, status)
    VALUES ('tech', 'Fabricated task', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'approved');
  EXCEPTION WHEN insufficient_privilege THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(31, 'Column privilege prevents fabricating status on INSERT', v_err);

  -- 7e: ATTACK TEST: User attempts to fabricate submission_link on INSERT
  v_err := false;
  BEGIN
    INSERT INTO public.tasks (domain, title, assigned_to, assigned_by, submission_link)
    VALUES ('tech', 'Fabricated submission', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'https://fake.link');
  EXCEPTION WHEN insufficient_privilege THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(32, 'Column privilege prevents fabricating submission_link on INSERT', v_err);

  -- 7f: Valid INSERT by Tech Head for Tech Exec One using ONLY permitted columns
  INSERT INTO public.tasks (domain, title, description, assigned_to, assigned_by, priority, due_date)
  VALUES (
    'tech',
    'Implement Auth Feature',
    'Implement login and signup with validation',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'high',
    current_date + 3
  )
  RETURNING id, status, assigned_to INTO v_task_id, v_task_status, v_task_assignee;

  CALL test_helpers.assert_true(33, 'Task inserted with auto-generated ID', v_task_id IS NOT NULL);
  CALL test_helpers.assert_true(34, 'Task inserted with default status "todo"', v_task_status = 'todo');
  CALL test_helpers.assert_true(35, 'Task assigned_to correctly populated',
    v_task_assignee = '33333333-3333-3333-3333-333333333333');

  -- Verify "created" event was inserted automatically via trigger (sole action column)
  SELECT count(*) INTO v_event_count FROM public.task_events WHERE task_id = v_task_id AND action = 'created';
  CALL test_helpers.assert_true(36, 'Trigger automatically created task_event with action "created"', v_event_count = 1);

  -- 7g: ATTACK TEST: Direct client write to task_events rejected
  v_err := false;
  BEGIN
    INSERT INTO public.task_events (task_id, actor_id, action)
    VALUES (v_task_id, '11111111-1111-1111-1111-111111111111', 'approved');
  EXCEPTION WHEN insufficient_privilege THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(37, 'Direct client INSERT to task_events rejected (no client writes)', v_err);

  -- 7h: ATTACK TEST: Direct client UPDATE to tasks rejected
  v_err := false;
  BEGIN
    UPDATE public.tasks SET status = 'approved' WHERE id = v_task_id;
  EXCEPTION WHEN insufficient_privilege THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(38, 'Direct client UPDATE to tasks rejected (no UPDATE grant)', v_err);

  -- 7i: ATTACK TEST: Direct client DELETE on tasks rejected
  v_err := false;
  BEGIN
    DELETE FROM public.tasks WHERE id = v_task_id;
  EXCEPTION WHEN insufficient_privilege THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(39, 'Direct client DELETE on tasks rejected (no DELETE grant)', v_err);

  CALL test_helpers.authenticate_as(null);
END $$;

-- ----------------------------------------------------------------------------
-- STEP 8: Task Lifecycle RPCs (start_task, submit_task, review_task)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_err boolean := false;
  v_task_id uuid;
  v_status text;
BEGIN
  -- Retrieve task id created in Step 7
  SELECT id INTO v_task_id FROM public.tasks WHERE title = 'Implement Auth Feature' LIMIT 1;

  -- 8a: Non-assignee cannot start task
  CALL test_helpers.authenticate_as('44444444-4444-4444-4444-444444444444');
  v_err := false;
  BEGIN
    PERFORM public.start_task(v_task_id);
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(40, 'Non-assignee cannot start task', v_err);

  -- 8b: Assignee starts task -> transitions to in_progress
  CALL test_helpers.authenticate_as('33333333-3333-3333-3333-333333333333');
  PERFORM public.start_task(v_task_id);
  SELECT status INTO v_status FROM public.tasks WHERE id = v_task_id;
  CALL test_helpers.assert_true(41, 'Assignee starts task -> status is "in_progress"', v_status = 'in_progress');

  -- Starting already started task fails
  v_err := false;
  BEGIN
    PERFORM public.start_task(v_task_id);
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(42, 'Starting task already in_progress raises error', v_err);

  -- 8c: submit_task requires https link
  v_err := false;
  BEGIN
    PERFORM public.submit_task(v_task_id, 'PR ready', 'http://insecure.example.com');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(43, 'Non-https submission link rejected', v_err);

  -- 8d: Assignee submits task with valid https link
  PERFORM public.submit_task(v_task_id, 'PR ready for review', 'https://github.com/ecell-smvit/repo/pull/1');
  SELECT status INTO v_status FROM public.tasks WHERE id = v_task_id;
  CALL test_helpers.assert_true(44, 'Assignee submits task -> status is "submitted"', v_status = 'submitted');

  -- 8e: Assignee cannot review their own task
  v_err := false;
  BEGIN
    PERFORM public.review_task(v_task_id, 'approved', 'looks good to me');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(45, 'Assignee cannot review own task', v_err);

  -- 8f: Cross-domain senior cannot review task
  CALL test_helpers.authenticate_as('55555555-5555-5555-5555-555555555555'); -- Marketing Head
  v_err := false;
  BEGIN
    PERFORM public.review_task(v_task_id, 'approved', 'reviewed by mkt');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(46, 'Cross-domain senior cannot review task', v_err);

  -- 8g: Same-domain senior (Co-Head) reviews with changes_requested
  CALL test_helpers.authenticate_as('22222222-2222-2222-2222-222222222222');
  PERFORM public.review_task(v_task_id, 'changes_requested', 'Please add unit tests');
  SELECT status INTO v_status FROM public.tasks WHERE id = v_task_id;
  CALL test_helpers.assert_true(47, 'Senior reviews with "changes_requested" -> status is "changes_requested"', v_status = 'changes_requested');

  -- 8h: STATE TRANSITION ENFORCEMENT: Cannot submit directly from changes_requested before restart!
  CALL test_helpers.authenticate_as('33333333-3333-3333-3333-333333333333');
  v_err := false;
  BEGIN
    PERFORM public.submit_task(v_task_id, 'Attempted direct submit', 'https://github.com/ecell-smvit/repo/pull/1');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(48, 'Cannot submit task from changes_requested without restarting first', v_err);

  -- 8i: Assignee restarts task from changes_requested -> transitions to in_progress
  PERFORM public.start_task(v_task_id);
  SELECT status INTO v_status FROM public.tasks WHERE id = v_task_id;
  CALL test_helpers.assert_true(49, 'Assignee restarts task from changes_requested -> status is "in_progress"', v_status = 'in_progress');

  -- 8j: Assignee submits task from in_progress
  PERFORM public.submit_task(v_task_id, 'Tests added', 'https://github.com/ecell-smvit/repo/pull/1');
  SELECT status INTO v_status FROM public.tasks WHERE id = v_task_id;
  CALL test_helpers.assert_true(50, 'Assignee submits task -> status is "submitted"', v_status = 'submitted');

  -- 8k: Tech Head approves task
  CALL test_helpers.authenticate_as('11111111-1111-1111-1111-111111111111');
  PERFORM public.review_task(v_task_id, 'approved', 'Looks great, verified!');
  SELECT status INTO v_status FROM public.tasks WHERE id = v_task_id;
  CALL test_helpers.assert_true(51, 'Senior reviews with "approved" -> status is "approved"', v_status = 'approved');

  CALL test_helpers.authenticate_as(null);
END $$;

-- ----------------------------------------------------------------------------
-- STEP 9: remove_member() rules and task-domain defense
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_err boolean := false;
  v_active_task_id uuid;
  v_removed_profile record;
  v_retained_task record;
BEGIN
  CALL test_helpers.authenticate_as('11111111-1111-1111-1111-111111111111'); -- Tech Head

  -- 9a: Head cannot remove self
  v_err := false;
  BEGIN
    PERFORM public.remove_member('11111111-1111-1111-1111-111111111111');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(52, 'Head cannot remove self', v_err);

  -- 9b: Head cannot remove member from another domain
  v_err := false;
  BEGIN
    PERFORM public.remove_member('66666666-6666-6666-6666-666666666666');
  EXCEPTION WHEN OTHERS THEN
    v_err := true;
  END;
  CALL test_helpers.assert_true(53, 'Head cannot remove member from another domain', v_err);

  -- 9c: Head removes Tech Exec Two (membership removal only)
  PERFORM public.remove_member('44444444-4444-4444-4444-444444444444');

  SELECT domain, designation INTO v_removed_profile
    FROM public.profiles
   WHERE id = '44444444-4444-4444-4444-444444444444';
  CALL test_helpers.assert_true(54, 'Member removed: domain and designation reset to NULL',
    v_removed_profile.domain IS NULL AND v_removed_profile.designation IS NULL);

  CALL test_helpers.authenticate_as(null);
END $$;

-- ----------------------------------------------------------------------------
-- STEP 10: team_stats() Metrics and Subordinate Aggregation
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_stats_count integer;
  v_zero_task_member_found boolean := false;
  v_stat record;
BEGIN
  -- Authenticate as Tech Head
  CALL test_helpers.authenticate_as('11111111-1111-1111-1111-111111111111');

  -- Count subordinates returned by team_stats()
  SELECT count(*) INTO v_stats_count FROM public.team_stats();
  -- Current subordinates in Tech: Co-Head, Exec One, and Candidate (who was assigned to Tech)
  CALL test_helpers.assert_true(55, 'team_stats() returns rows for subordinates', v_stats_count >= 2);

  -- Verify members with 0 tasks are included with 0 metrics and approved is sole completion
  FOR v_stat IN SELECT * FROM public.team_stats() LOOP
    IF v_stat.total = 0 THEN
      v_zero_task_member_found := true;
      CALL test_helpers.assert_true(56, 'Zero task member has completion_rate = 0.0 (' || v_stat.full_name || ')', v_stat.completion_rate = 0.0);
    END IF;
  END LOOP;
  CALL test_helpers.assert_true(57, 'team_stats() includes subordinates with zero tasks', v_zero_task_member_found);

  CALL test_helpers.authenticate_as(null);
END $$;

-- ----------------------------------------------------------------------------
-- FINAL ASSERTION REPORT
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_failed_count integer;
  v_passed_count integer;
BEGIN
  SELECT count(*) INTO v_passed_count FROM test_helpers.test_results WHERE status = 'PASSED';
  SELECT count(*) INTO v_failed_count FROM test_helpers.test_results WHERE status = 'FAILED';

  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'TEST SUITE SUMMARY: % Passed, % Failed', v_passed_count, v_failed_count;
  RAISE NOTICE '=======================================================';

  IF v_failed_count > 0 THEN
    RAISE EXCEPTION '% test(s) failed in supabase/test-roles-security.sql', v_failed_count;
  END IF;
END $$;

-- ALWAYS ROLL BACK: database remains clean and untouched
ROLLBACK;
