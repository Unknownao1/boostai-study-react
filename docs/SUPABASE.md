# Supabase Setup

Reference for the Supabase database, authentication, and Row Level Security (RLS)
configuration. If you need to change the database schema, update this document
first — don't just do it.

---

## Projects

For a proper setup, use **two Supabase projects**:

| Project | Purpose | Used by |
|---|---|---|
| **Dev / Staging** | Local development + Vercel preview deployments | `.env.local` and Vercel Preview env vars |
| **Production** | Live site | Vercel Production env vars |

This prevents preview deployments from touching production data.

---

## Authentication

### Enabled providers
- **Email/password** — built-in, no extra config needed
- **Google OAuth** — requires setup in Supabase Dashboard → Authentication →
  Providers → Google

### Google OAuth setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URIs:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase → Authentication → Providers → Google

### Redirect URLs (Supabase Dashboard → Authentication → URL Configuration)
- Site URL: `https://boostai.study` (production) or `http://localhost:3000` (dev)
- Redirect URLs (add all):
  - `http://localhost:3000/api/auth/callback`
  - `https://boostai.study/api/auth/callback`
  - `https://*.vercel.app/api/auth/callback` (for preview deployments)

---

## Database schema

The initial schema lives in `supabase/migrations/001_initial_schema.sql`.

### Tables

#### `profiles`
Extends `auth.users` with app-specific data.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | UUID (PK, FK → auth.users) | — | User's auth ID |
| `display_name` | TEXT | — | User's display name |
| `persona` | TEXT | — | `'school'` or `'university'` |
| `subscription_tier` | TEXT | `'free'` | `'free'`, `'pro'`, or `'premium'` |
| `stripe_customer_id` | TEXT (unique) | — | Stripe customer ID |
| `essay_marks_used` | INT | `0` | Essay Marker usage count (free tier limit) |
| `created_at` | TIMESTAMPTZ | `now()` | — |
| `updated_at` | TIMESTAMPTZ | `now()` | — |

**RLS policies:**
- Users can read and update their own profile
- Service role has full access (needed for webhook updates)

**Auto-creation trigger:** When a new user signs up, a profile row is
automatically created with `display_name` pulled from Google metadata or email.

**`increment_essay_marks(user_id)`:** Postgres function (SECURITY DEFINER) that
atomically increments `essay_marks_used`, called from `POST /api/essays/mark`
after a successful mark. We deliberately don't store essay text — just the
count — since essays are often personal/identifiable student work.

#### `subscription_events`
Debug log for Stripe webhook deliveries.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | — |
| `user_id` | UUID (FK) | — |
| `stripe_event_id` | TEXT (unique) | Stripe event ID for deduplication |
| `event_type` | TEXT | e.g. `checkout.session.completed` |
| `data` | JSONB | Full event payload |
| `created_at` | TIMESTAMPTZ | — |

**RLS:** Service role only.

#### `generated_questions`
Question Bank — every AI-generated question a user has received, so they can
revisit it later without re-generating.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | — |
| `user_id` | UUID (FK → auth.users) | — |
| `subject` | TEXT | e.g. `"Mathematics"` |
| `level` | TEXT | e.g. `"A-Level"` |
| `topic` | TEXT | e.g. `"Quadratics"` |
| `original_prompt` / `original_answer` | TEXT | The question the user pasted in |
| `generated_prompt` | TEXT | The new AI-generated question |
| `reasoning` | JSONB | Array of mark-scheme style working steps |
| `generated_answer` | TEXT | Final answer to the generated question |
| `created_at` | TIMESTAMPTZ | — |

**RLS policies:** Users can read, insert, and delete only their own rows.

Populated by `POST /api/questions/generate` after each successful OpenAI call.
Read by `GET /api/questions` for the dashboard's Question Bank panel.

---

## Running the migration

### Option A: Supabase Dashboard
1. Go to SQL Editor → New Query
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click Run

### Option B: Supabase CLI
```bash
npx supabase db push
```

---

## Code architecture

| File | Purpose | Import from |
|---|---|---|
| `lib/supabase/client.ts` | Browser client (anon key) | Client components |
| `lib/supabase/server.ts` | Server client (anon key + cookies) | Server Components, API routes |
| `lib/supabase/middleware.ts` | Session refresh helper | `middleware.ts` only |

> ⚠️ **Never import `lib/supabase/server.ts` from a client component.**
> It uses `next/headers` which is server-only.
