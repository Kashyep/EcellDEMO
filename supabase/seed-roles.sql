-- ============================================================================
-- E-Cell SMVIT: Seed Roles & Bootstrap Templates
-- File: supabase/seed-roles.sql
-- ============================================================================
--
-- This script contains safe, commented SQL templates for initializing domain
-- Heads and demo team roles.
--
-- WORKFLOW:
-- 1. Members sign up normally via the website (signup.html).
--    The `on_auth_user_created` trigger automatically creates a profile with
--    `domain = NULL` and `designation = NULL`.
-- 2. An administrator promotes the first Head of each domain using Step 1 below
--    in the Supabase SQL Editor.
-- 3. Once a Head is set up, they can assign Co-Heads and Executives in their
--    own domain directly from the web dashboard using `assign_member()`,
--    or administrators can use the batch SQL templates in Step 2 & 3.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Bootstrap First Domain Head (By Email)
-- ----------------------------------------------------------------------------
-- Uncomment and edit the email address below to promote the initial Head for
-- the Tech domain (or any other domain).

/*
DO $$
DECLARE
  v_head_email text := 'head.tech@ecellsmvit.in';
  v_head_domain text := 'tech';
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id
    FROM public.profiles
   WHERE lower(email) = lower(v_head_email);

  IF v_profile_id IS NULL THEN
    RAISE NOTICE 'No profile found for email: %. Please ensure the user has signed up first.', v_head_email;
  ELSE
    UPDATE public.profiles
       SET domain = v_head_domain,
           designation = 'head'
     WHERE id = v_profile_id;
    RAISE NOTICE 'User % successfully promoted to Head of % domain.', v_head_email, v_head_domain;
  END IF;
END $$;
*/

-- ----------------------------------------------------------------------------
-- STEP 2: Bootstrap Heads for Other Domains (Templates)
-- ----------------------------------------------------------------------------
-- Allowed domains: 'tech', 'marketing', 'design', 'content', 'events', 'operations'

/*
-- Marketing Head:
-- UPDATE public.profiles
--    SET domain = 'marketing', designation = 'head'
--  WHERE lower(email) = 'head.marketing@ecellsmvit.in';

-- Design Head:
-- UPDATE public.profiles
--    SET domain = 'design', designation = 'head'
--  WHERE lower(email) = 'head.design@ecellsmvit.in';

-- Content Head:
-- UPDATE public.profiles
--    SET domain = 'content', designation = 'head'
--  WHERE lower(email) = 'head.content@ecellsmvit.in';

-- Events Head:
-- UPDATE public.profiles
--    SET domain = 'events', designation = 'head'
--  WHERE lower(email) = 'head.events@ecellsmvit.in';

-- Operations Head:
-- UPDATE public.profiles
--    SET domain = 'operations', designation = 'head'
--  WHERE lower(email) = 'head.operations@ecellsmvit.in';
*/

-- ----------------------------------------------------------------------------
-- STEP 3: Demo Lower Roles Templates (Co-Heads and Executives)
-- ----------------------------------------------------------------------------
-- Allowed designations: 'co_head', 'executive'
-- Paired constraint requires that domain and designation are both set together.

/*
-- Tech Co-Head:
-- UPDATE public.profiles
--    SET domain = 'tech', designation = 'co_head'
--  WHERE lower(email) = 'cohead.tech@ecellsmvit.in';

-- Tech Executives:
-- UPDATE public.profiles
--    SET domain = 'tech', designation = 'executive'
--  WHERE lower(email) IN (
--    'exec1.tech@ecellsmvit.in',
--    'exec2.tech@ecellsmvit.in'
--  );

-- Marketing Co-Head & Executives:
-- UPDATE public.profiles
--    SET domain = 'marketing', designation = 'co_head'
--  WHERE lower(email) = 'cohead.marketing@ecellsmvit.in';

-- UPDATE public.profiles
--    SET domain = 'marketing', designation = 'executive'
--  WHERE lower(email) = 'exec.marketing@ecellsmvit.in';
*/

-- ----------------------------------------------------------------------------
-- STEP 4: Verification Query
-- ----------------------------------------------------------------------------
-- Run this query in the SQL Editor to inspect all assigned roles by domain and rank.

SELECT
  p.id,
  p.full_name,
  p.email,
  p.member_id,
  p.domain,
  p.designation,
  public.role_rank(p.designation) AS rank,
  p.created_at
FROM public.profiles p
WHERE p.domain IS NOT NULL
ORDER BY p.domain, rank DESC, p.full_name;
