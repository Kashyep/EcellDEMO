-- ============================================================================
-- E-Cell SMVIT: Seed Dummy Accounts for Testing Roles and Dashboards
-- File: supabase/seed-dummy-users.sql
-- ============================================================================
-- Creates test accounts with confirmed emails and pre-set passwords:
-- Password for all accounts: Password123!
-- ============================================================================

DO $$
DECLARE
  -- Bcrypt hash for: Password123!
  v_pw_hash text := '$2a$10$Dd0d99Ix0p2QAwBe74iFkeKAMKXQj0tPN7ABNnDabPghgYX97U.we';
  
  -- Co-Head (Tech)
  v_id0 uuid := 'ee81d686-7d35-4628-b5c1-40f0a0d3ddb2';
  v_email0 text := 'cohead.tech@ecellsmvit.in';
  v_name0 text := 'Rohan Sharma';
  v_usn0 text := '1MV22CS045';

  -- Executive 1 (Tech)
  v_id1 uuid := 'f711b7ab-def9-4a7d-8bbf-544cd2e6eaa8';
  v_email1 text := 'exec.tech@ecellsmvit.in';
  v_name1 text := 'Priya Nair';
  v_usn1 text := '1MV23IS088';
  
  -- Executive 2 (Tech)
  v_id2 uuid := 'c07788a3-44d9-4b30-bc89-8128fc39f099';
  v_email2 text := 'exec2.tech@ecellsmvit.in';
  v_name2 text := 'Varun Rao';
  v_usn2 text := '1MV23EC012';

  -- Unassigned Candidate (for testing find_member & assign_member)
  v_id3 uuid := 'f76f0d14-ee60-47d5-96f5-268696192e43';
  v_email3 text := 'candidate@ecellsmvit.in';
  v_name3 text := 'Aditya Verma';
  v_usn3 text := '1MV24CS002';
BEGIN
  -- Insert into auth.users (triggers profile creation via on_auth_user_created)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES
  (
    v_id0, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    v_email0, v_pw_hash, now(), '', '', '', '',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', v_name0, 'usn', v_usn0, 'email', v_email0, 'sub', v_id0::text, 'email_verified', true),
    now(), now()
  ),
  (
    v_id1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    v_email1, v_pw_hash, now(), '', '', '', '',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', v_name1, 'usn', v_usn1, 'email', v_email1, 'sub', v_id1::text, 'email_verified', true),
    now(), now()
  ),
  (
    v_id2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    v_email2, v_pw_hash, now(), '', '', '', '',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', v_name2, 'usn', v_usn2, 'email', v_email2, 'sub', v_id2::text, 'email_verified', true),
    now(), now()
  ),
  (
    v_id3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    v_email3, v_pw_hash, now(), '', '', '', '',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', v_name3, 'usn', v_usn3, 'email', v_email3, 'sub', v_id3::text, 'email_verified', true),
    now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), v_id0,
    jsonb_build_object('sub', v_id0::text, 'email', v_email0, 'email_verified', true, 'full_name', v_name0),
    'email', v_id0::text, now(), now(), now()
  ),
  (
    gen_random_uuid(), v_id1,
    jsonb_build_object('sub', v_id1::text, 'email', v_email1, 'email_verified', true, 'full_name', v_name1),
    'email', v_id1::text, now(), now(), now()
  ),
  (
    gen_random_uuid(), v_id2,
    jsonb_build_object('sub', v_id2::text, 'email', v_email2, 'email_verified', true, 'full_name', v_name2),
    'email', v_id2::text, now(), now(), now()
  ),
  (
    gen_random_uuid(), v_id3,
    jsonb_build_object('sub', v_id3::text, 'email', v_email3, 'email_verified', true, 'full_name', v_name3),
    'email', v_id3::text, now(), now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign domain and designations in public.profiles
  UPDATE public.profiles
     SET domain = 'tech', designation = 'co_head'
   WHERE id = v_id0;

  UPDATE public.profiles
     SET domain = 'tech', designation = 'executive'
   WHERE id IN (v_id1, v_id2);

  -- Note: v_id3 (candidate) deliberately left with domain = null, designation = null for testing find_member / assign_member
END $$;
