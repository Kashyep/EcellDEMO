-- ============================================================================
-- E-Cell SMVIT: Seed Dummy Tasks and Events
-- File: supabase/seed-dummy-tasks.sql
-- ============================================================================

DO $$
DECLARE
  v_head_id uuid := 'e0f2a6b4-c56b-4054-bbd5-aba7b033c931';    -- Arnav Kashyap (Tech Head)
  v_cohead_id uuid := 'ee81d686-7d35-4628-b5c1-40f0a0d3ddb2';  -- Rohan Sharma (Tech Co-Head)
  v_exec1_id uuid := 'f711b7ab-def9-4a7d-8bbf-544cd2e6eaa8';   -- Priya Nair (Tech Exec 1)
  v_exec2_id uuid := 'c07788a3-44d9-4b30-bc89-8128fc39f099';   -- Varun Rao (Tech Exec 2)

  v_t1 uuid := gen_random_uuid();
  v_t2 uuid := gen_random_uuid();
  v_t3 uuid := gen_random_uuid();
  v_t4 uuid := gen_random_uuid();
  v_t5 uuid := gen_random_uuid();
  v_t6 uuid := gen_random_uuid();
  v_t7 uuid := gen_random_uuid();
BEGIN
  -- Clean up any existing tasks for clean reproducible seeding
  DELETE FROM public.tasks WHERE domain = 'tech';

  -- 1. Task 1: TODO (Assigned to Priya by Arnav)
  INSERT INTO public.tasks (
    id, domain, title, description, assigned_to, assigned_by, priority, status, due_date, created_at, updated_at
  ) VALUES (
    v_t1, 'tech',
    'Implement OAuth Provider for GitHub Sign-in',
    'Configure Supabase GitHub OAuth provider in config.toml and add GitHub sign-in button to login and signup forms with appropriate redirect handlers.',
    v_exec1_id, v_head_id,
    'high', 'todo', CURRENT_DATE + 3,
    now() - interval '2 days', now() - interval '2 days'
  );

  -- 2. Task 2: IN_PROGRESS (Assigned to Priya by Rohan)
  INSERT INTO public.tasks (
    id, domain, title, description, assigned_to, assigned_by, priority, status, due_date, created_at, updated_at
  ) VALUES (
    v_t2, 'tech',
    'Audit and optimize Web Vitals on Landing Page',
    'Analyze Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS) on index.html. Compress hero SVG and defer non-critical CSS/fonts.',
    v_exec1_id, v_cohead_id,
    'high', 'in_progress', CURRENT_DATE + 2,
    now() - interval '3 days', now() - interval '1 day'
  );
  INSERT INTO public.task_events (task_id, actor_id, action, note, created_at)
  VALUES (v_t2, v_exec1_id, 'started', 'Began audit using Chrome Lighthouse and web-vitals profiling.', now() - interval '1 day');

  -- 3. Task 3: SUBMITTED (Assigned to Priya by Arnav - Ready for Review!)
  INSERT INTO public.tasks (
    id, domain, title, description, assigned_to, assigned_by, priority, status, due_date,
    submission_note, submission_link, created_at, updated_at
  ) VALUES (
    v_t3, 'tech',
    'Design Responsive Navigation Drawer for Mobile View',
    'Create sliding drawer navigation for screens below 768px with touch backdrop close and accessible ARIA attributes.',
    v_exec1_id, v_head_id,
    'medium', 'submitted', CURRENT_DATE + 1,
    'Completed the mobile navigation drawer with smooth CSS transforms and focus trapping. PR preview is ready for review.',
    'https://github.com/Kashyep/EcellDEMO/pull/12',
    now() - interval '4 days', now() - interval '3 hours'
  );
  INSERT INTO public.task_events (task_id, actor_id, action, note, created_at)
  VALUES
    (v_t3, v_exec1_id, 'started', 'Starting work on drawer component CSS and backdrop overlay.', now() - interval '2 days'),
    (v_t3, v_exec1_id, 'submitted', 'Submitted pull request #12 for review.', now() - interval '3 hours');

  -- 4. Task 4: APPROVED (Assigned to Varun by Rohan, Reviewed & Approved by Rohan)
  INSERT INTO public.tasks (
    id, domain, title, description, assigned_to, assigned_by, priority, status, due_date,
    submission_note, submission_link, review_note, reviewed_by, created_at, updated_at
  ) VALUES (
    v_t4, 'tech',
    'Setup Supabase CLI Database Migration Workflow',
    'Document npx supabase db diff and migration scripts in README. Ensure npm scripts for db:push, db:reset work seamlessly.',
    v_exec2_id, v_cohead_id,
    'medium', 'approved', CURRENT_DATE - 2,
    'Added db scripts to package.json, initialized config.toml and tested rollback security test suite.',
    'https://github.com/Kashyep/EcellDEMO/commit/daf805d',
    'Excellent work! Verified all npm scripts and migrations run cleanly without issues.',
    v_cohead_id,
    now() - interval '5 days', now() - interval '1 day'
  );
  INSERT INTO public.task_events (task_id, actor_id, action, note, created_at)
  VALUES
    (v_t4, v_exec2_id, 'started', 'Setting up local supabase CLI configuration.', now() - interval '4 days'),
    (v_t4, v_exec2_id, 'submitted', 'Submitted commit with package.json and config.toml.', now() - interval '2 days'),
    (v_t4, v_cohead_id, 'approved', 'Approved after testing npm run build and db commands.', now() - interval '1 day');

  -- 5. Task 5: CHANGES_REQUESTED (Assigned to Varun by Arnav, Reviewed by Arnav)
  INSERT INTO public.tasks (
    id, domain, title, description, assigned_to, assigned_by, priority, status, due_date,
    submission_note, submission_link, review_note, reviewed_by, created_at, updated_at
  ) VALUES (
    v_t5, 'tech',
    'Update Favicon and OpenGraph Meta Tags',
    'Generate high-resolution PNG favicons and apple-touch-icon, and add og:image, og:description tags to public/index.html.',
    v_exec2_id, v_head_id,
    'low', 'changes_requested', CURRENT_DATE + 4,
    'Added basic favicon.ico and og tags to index.html.',
    'https://github.com/Kashyep/EcellDEMO/pull/8',
    'Please also generate 192x192 and 512x512 PWA icons and include Twitter card meta tags before approval.',
    v_head_id,
    now() - interval '3 days', now() - interval '6 hours'
  );
  INSERT INTO public.task_events (task_id, actor_id, action, note, created_at)
  VALUES
    (v_t5, v_exec2_id, 'started', 'Starting favicon generation.', now() - interval '2 days'),
    (v_t5, v_exec2_id, 'submitted', 'Submitted preliminary icons and meta tags.', now() - interval '1 day'),
    (v_t5, v_head_id, 'changes_requested', 'Need high-res icons and twitter cards.', now() - interval '6 hours');

  -- 6. Task 6: IN_PROGRESS (Assigned to Rohan Sharma [Co-Head] by Arnav [Head])
  INSERT INTO public.tasks (
    id, domain, title, description, assigned_to, assigned_by, priority, status, due_date, created_at, updated_at
  ) VALUES (
    v_t6, 'tech',
    'Lead Technical Architecture for Hackathon Registration Portal',
    'Draft the database schema and team registration RPCs for the upcoming Annual E-Cell Hackathon. Review with executive dev team.',
    v_cohead_id, v_head_id,
    'high', 'in_progress', CURRENT_DATE + 5,
    now() - interval '4 days', now() - interval '2 days'
  );
  INSERT INTO public.task_events (task_id, actor_id, action, note, created_at)
  VALUES (v_t6, v_cohead_id, 'started', 'Drafting ER diagrams and API contract.', now() - interval '2 days');

  -- 7. Task 7: TODO (Overdue Demo Task assigned to Varun)
  INSERT INTO public.tasks (
    id, domain, title, description, assigned_to, assigned_by, priority, status, due_date, created_at, updated_at
  ) VALUES (
    v_t7, 'tech',
    'Overdue Demo: Fix IST Clock Sync Glitch on Landing Page',
    'Resolve timestamp timezone offset calculation so the IST clock renders smoothly across all user local timezones.',
    v_exec2_id, v_cohead_id,
    'medium', 'todo', CURRENT_DATE - 3,
    now() - interval '6 days', now() - interval '6 days'
  );

END $$;
