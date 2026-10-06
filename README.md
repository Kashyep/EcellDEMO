# E-Cell SMVIT website

A redesign of https://www.ecellsmvit.in/ built for the E-Cell Executive web development task:
landing page (hero + footer), signup, login, and domain/role-based member dashboards.

**Flow:** Landing page → Sign up / Log in → Supabase Auth → Dashboard (with role-specific capabilities).

- **Hosting:** Vercel (Next.js, zero-config)
- **Auth and database:** Supabase (email + password auth, `profiles`, `tasks`, `task_events` tables with row-level security and RPCs)
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui, with four [Componentry](https://componentry.fun) components (`dithered-logo`, `text-morph`, `scroll-tilted-grid`, `aurora-flow`)
- **Fonts:** IBM Plex Sans (body), a condensed display face (large headings), Silkscreen (pixel font, **numbers only** via the `<Num>` component)

## Project structure

```
app/                     Routes: / (landing), /login, /signup, /dashboard, /dashboard/{team,review,assign}
components/
  ui/                    shadcn + Componentry components (dithered-logo, text-morph, scroll-tilted-grid, aurora-flow)
  landing/               Landing sections and client-only wrappers for canvas/WebGL components
  dashboard/             Sidebar / mobile tab bar and the role-aware dashboard views
  num.tsx                The only place the pixel font is used
lib/                     Supabase client + auth helpers, role logic, types
public/img/              Logos and owner photo assets
supabase/                Database migrations, seeds, and test harness (unchanged by the redesign)
  migrations/            Migration scripts
    20261004150300_create_profiles.sql  Base migration (profiles, trigger, initial RLS) - UNTOUCHED
    20261005010000_role_dashboards.sql  Role hierarchy, paired checks, tasks, events, RLS, and RPCs
  seed-roles.sql         Commented safe SQL templates for first Head and demo team roles
  test-roles-security.sql Self-contained transaction rollback test suite (assertions)
next.config.mjs          Security headers
```

## Environment variables

| Name | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → the **publishable** key (`sb_publishable_…`) or legacy `anon` key |

Both are safe to ship to the browser; PostgreSQL row-level security (RLS) protects the data. Never use the `service_role` / secret key in client code or environment variables.

**Vercel:** Project → Settings → Environment Variables → add both variables above (Production, Preview and Development), then redeploy. The old `SUPABASE_URL` / `SUPABASE_ANON_KEY` names are no longer read.

## Run locally

```bash
npm install
cp .env.example .env.local    # fill in the two NEXT_PUBLIC_ variables
npm run dev                   # http://localhost:3000
npm run build && npm run lint
```

## Gallery photos

The landing gallery is driven by `content/gallery.json` and renders real campus event photos in a portrait 4:5 aspect ratio with interactive dialogs and category filtering. Because the landing page is a static server-rendered page (`app/page.tsx`), image file existence (`checkLocalImageExists`) is evaluated at build time. When a photo is missing from `public/img/gallery/`, the gallery displays a branded accent block fallback without requesting nonexistent files or producing network/console errors. When adding or updating local photos in `public/img/gallery/`, a project rebuild and redeploy (`npm run build` or Vercel deployment) is required for the static server render to detect the images.

### Photos Needed

All 8 event photos (`.jpg`) are still needed in `public/img/gallery/`:

1. `investors-dilemma-2026.jpg` — Investor's Dilemma (Competition)
2. `recruitment-2026-round2.jpg` — Recruitment 2026–27: Round 2 (Recruitment)
3. `recruitment-2026.jpg` — Recruitment 2026–27 (Recruitment)
4. `extra-milers-s2.jpg` — Extra Mile S2: the Extra Milers (Extra Mile, Featured)
5. `extra-mile-s2-mentors.jpg` — Extra Mile S2: Meet the Mentors (Extra Mile)
6. `extra-mile-s2-session.jpg` — Meet Your Mentor: Dr. Debasish Chakraborty (Extra Mile)
7. `extra-mile-s2-launch.jpg` — Extra Mile Season 2 launch (Extra Mile)
8. `team-2025.jpg` — Meet the 2025 team (Team)

### Photo Sourcing & Quality Guidelines

- **Photo content:** Owner saves one or more real EVENT photos capturing people and collaborative moments (builders, participants, mentors, teams), **not** promotional flyers or posters.
- **Source account:** Use own-account photos only from `@ecell_smvit`. Do not scrape Instagram, embed private APIs, or hotlink external images. Honor removal requests promptly.
- **Specifications:** Save as `<id>.jpg` into `public/img/gallery/`. Dimensions should be at least 1080px wide (portrait 4:5 orientation preferred) and compressed under ~400KB.
- **Alt Text Policy (TODO):** Alt text MUST describe the actual photo content; never use the event title as photo alt text. Leave `alt: ""` with a README TODO until owner supplies the real photo asset and writes a true descriptive alt text.
- **Adding events:** To add older or future events, append an entry to `content/gallery.json` and place the local photo in `public/img/gallery/<id>.jpg`.
- **Potential sources:** The owner can source high-quality photos from existing account highlights:
  - `Events 2026`
  - `Events 2025`
  - `Events 2024`
  - `Events 2023`
  - `ExtraMile`
  - `Hall of Fame`
  - `ECell Represent`
  - `Farewell 2023`

---

## Role System and Domain Hierarchy

### Domains
Members belong to one of 6 functional domains:
- `tech`
- `marketing`
- `design`
- `content`
- `events`
- `operations`

### Designations and Rank Hierarchy
- `head` (Rank 3): Domain leader. Full jurisdiction to assign/remove lower roles in their domain, create tasks, and review all submissions.
- `co_head` (Rank 2): Domain senior. Can create tasks for Executives, start/submit tasks assigned to them, and review Executive submissions.
- `executive` (Rank 1): Domain contributor. Executes assigned tasks, transitions status to in-progress, and submits deliverables with secure links.
- `unassigned` (Rank 0): New signups default to `domain = NULL` and `designation = NULL` until assigned by a domain Head.

### Database Constraints and Security Principles
1. **Paired Nullable Check (`profiles_domain_designation_paired_check`):**
   `domain` and `designation` must either both be `NULL` (unassigned member) or both non-null and valid.
2. **Senior Profile Access vs Safe Directory:**
   - Seniors can view subordinate profiles in the same domain.
   - Subordinates cannot query senior profiles directly via `SELECT` on `profiles`, preventing exposure of seniors' private `email` and `usn`.
   - The `team_directory()` RPC provides public directory info (`id, full_name, domain, designation`) so the UI can safely display assigner and reviewer names.
3. **Column Insert Privileges & Metadata Protection:**
   - Authenticated clients only have `INSERT` permissions on safe task columns: `(title, description, assigned_to, assigned_by, domain, priority, due_date)`.
   - Columns such as `id`, `status`, `submission_note`, `submission_link`, `review_note`, and `reviewed_by` cannot be populated on insert, preventing fabricated metadata attacks.
4. **No Direct Client UPDATE / DELETE:**
   - Direct `UPDATE` and `DELETE` on `tasks` are revoked for `authenticated` users.
   - All state transitions occur exclusively through atomic, security definer RPC functions.
5. **No Direct Client Writes to `task_events`:**
   - `task_events` is an immutable append-only audit trail populated by database triggers and verified RPCs.

---

## Bootstrapping the First Head

Because `assign_member()` requires an existing Head caller, the initial Head for any domain is bootstrapped via administrative SQL:

1. Have the user sign up normally via the website at `/signup`.
2. Open the Supabase Dashboard → **SQL Editor**.
3. Use the template in `supabase/seed-roles.sql` (Step 1):
   ```sql
   UPDATE public.profiles
      SET domain = 'tech',
          designation = 'head'
    WHERE email = 'head.tech@ecellsmvit.in';
   ```
4. Once updated, this user can log into `/dashboard` and use domain Head capabilities to discover unassigned members via `find_member()` and assign them using `assign_member()`.

---

## Database Migrations

### Migration Files
- `supabase/migrations/20261004150300_create_profiles.sql`: Base profiles table, USN validation check, checklist JSONB, and signup trigger. (Already applied to production; never modify).
- `supabase/migrations/20261005010000_role_dashboards.sql`: Adds domain/designation columns, ranking functions, tasks table, task_events audit table, triggers, RLS policies, and RPC functions.

### Applying Migrations
- **Via Supabase CLI (local or linked project):**
  ```bash
  npx supabase db push
  ```
- **Via Supabase Web Console:**
  Open `supabase/migrations/20261005010000_role_dashboards.sql`, copy all contents, paste into the **SQL Editor**, and click **Run**.

---

## Running the Security and Functional Test Suite

The automated test suite in `supabase/test-roles-security.sql` verifies all database constraints, RLS policies, column privilege restrictions, and RPC state transitions inside an atomic `BEGIN ... ROLLBACK` block. It leaves zero test rows or changes in your database.

### Running Tests
- **Via Supabase CLI (Local Database):**
  Requires local Supabase stack running via Docker (prerequisites: initialized via `npx supabase init` and running via `npx supabase start`).
  ```bash
  npx supabase db query --local --file supabase/test-roles-security.sql
  ```
- **Via Supabase CLI (Authorized Linked Project):**
  Authorized linked variant for remote project verification (prerequisites: logged into Supabase CLI with permissions for project `kovebqhqibixpdlwgqlr`):
  ```bash
  npx supabase db query --linked --project-ref kovebqhqibixpdlwgqlr --file supabase/test-roles-security.sql
  ```
- **Via psql:**
  ```bash
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/test-roles-security.sql
  ```
- **Via Supabase SQL Editor:**
  Paste the entire contents of `supabase/test-roles-security.sql` into the SQL Editor and click **Run**. Check the **Messages / Output** tab for step-by-step test results:
  ```
  [PASS] Step 1: Domain without designation rejected by paired check
  [PASS] Step 2: Designation without domain rejected by paired check
  ...
  TEST SUITE SUMMARY: assertions Passed, 0 Failed
  ```

---

## RPC API Reference

All RPCs are callable via `supabase.rpc('<function_name>', { ... })` and return standard JSON or table datasets.

### 1. `start_task(task_id uuid)`
- **Caller:** Task assignee.
- **Allowed Status:** `todo` OR `changes_requested` → `in_progress`.
- **Side Effect:** Clears stale reviewer fields (`review_note = NULL, reviewed_by = NULL`).
- **Row Lock:** Row locked for update to prevent concurrent race conditions.
- **Audit Event:** Logs `started` action in `task_events`.
- **Returns:** `jsonb` (`{ task_id, status: 'in_progress' }`).

### 2. `submit_task(task_id uuid, note text, link text)`
- **Caller:** Task assignee.
- **Allowed Status:** ONLY `in_progress` → `submitted` (tasks with `changes_requested` must be restarted first via `start_task`).
- **Validation:** `link` must start with `https://`.
- **Audit Event:** Logs `submitted` action in `task_events` with note.
- **Returns:** `jsonb` (`{ task_id, status: 'submitted', submission_link }`).

### 3. `review_task(task_id uuid, decision text, note text)`
- **Caller:** Senior in the same domain (`public.is_senior_of(auth.uid(), assigned_to)` and reviewer domain matches task domain).
- **Decision:** `'approved'` or `'changes_requested'`. Assignee cannot review their own submission.
- **Allowed Status:** `submitted` → decision status.
- **Audit Event:** Logs decision action in `task_events`.
- **Returns:** `jsonb` (`{ task_id, status, reviewed_by }`).

### 4. `assign_member(member uuid, domain text, designation text)`
- **Caller:** Domain Head (`designation = 'head'`).
- **Rules:**
  - Can only assign to Head's own domain.
  - Can only assign lower designations (`'executive'`, `'co_head'`).
  - Cannot assign/modify self or another Head.
  - Cannot steal members already assigned to another domain.
- **Returns:** `jsonb` (`{ member_id, domain, designation }`).

### 5. `remove_member(member uuid)`
- **Caller:** Domain Head.
- **Rules:**
  - Cannot remove self or another Head.
  - Cannot remove members from other domains.
  - Resets member's `domain = NULL` and `designation = NULL`.
  - Retains historical task assignee and task-domain defense so new teams cannot see old-domain work, while member retains own visibility.
- **Returns:** `jsonb` (`{ member_id, removed: true }`).

### 6. `find_member(identifier text)`
- **Caller:** Domain Head only.
- **Parameter:** Exact `email` or `member_id` (case-insensitive).
- **Scope:** Returns only unassigned candidates eligible to join the domain (`domain IS NULL AND designation IS NULL`).
- **Returns:** `table (id uuid, full_name text, member_id text)`.

### 7. `team_directory()`
- **Caller:** Any authenticated member.
- **Scope:** Returns caller and all teammates within caller's domain.
- **Privacy:** Returns safe public display data (`id, full_name, domain, designation`) while protecting private email and USN.
- **Returns:** `table (id uuid, full_name text, domain text, designation text)`.

### 8. `team_stats()`
- **Caller:** Domain senior (Head or Co-Head).
- **Scope:** Aggregates metrics for every subordinate in caller's domain, including subordinates with 0 tasks.
- **Calculation Rules:**
  - `overdue`: `due_date < current_date` and `status != 'approved'`. Evaluated using UTC date-only comparison against `current_date`; tasks due today (`due_date = current_date`) are not overdue, only tasks whose due date has strictly passed (`due_date < current_date`).
  - `completed`: `status = 'approved'` (`'approved'` is the sole completion status).
  - `completion_rate`: SQL percentage on a 0..100 scale (`numeric`, rounded to 2 decimal places: `round((count(approved)::numeric / count(total)::numeric) * 100, 2)`, evaluating to `0.0` for members with 0 tasks).
- **Returns:**
  `table (member_id uuid, full_name text, designation text, todo bigint, in_progress bigint, submitted bigint, approved bigint, changes_requested bigint, completed bigint, overdue bigint, total bigint, completion_rate numeric)`.
