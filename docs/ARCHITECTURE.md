# Architecture

This document describes **what BoostAI Study is today** and **where it is going**,
so changes stay coherent. It is the source of truth for technical decisions.
If you (or Claude) want to do something this document doesn't cover, update this
document first — don't just do it.

---

## 1. Current architecture (the MVP, as of June 2026)

### Stack
- **Framework:** Next.js 15.5.9 (App Router) + React 19
- **Language:** TypeScript, `strict: true`
- **Styling:** CSS Modules (one `*.module.css` per component)
- **Hosting:** Vercel, git-based auto-deploy from `main`
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Database:** Supabase PostgreSQL with Row Level Security
- **Payments:** Stripe (subscription groundwork — checkout + webhooks)
- **Fonts/assets:** local, under `public/boostai/`

### Layout
```
app/                      Routing layer (thin — pages just render components or redirect)
  layout.tsx              Root: fonts, <head>, site metadata
  page.tsx                "/"        → HomeLanding
  dashboard/page.tsx      "/dashboard" → StudyDashboard (auth-gated)
  auth/page.tsx            "/auth"    → AuthLogin (real Supabase auth)
  study|account/page.tsx  redirect → /dashboard
  university/page.tsx      redirect → /uni
  api/
    auth/callback/route.ts  OAuth redirect callback
    auth/signout/route.ts   Server-side sign out
    checkout/route.ts       Creates Stripe Checkout Sessions
    webhooks/stripe/route.ts Stripe webhook handler
lib/                        One typed module per external service
  env.ts                   Environment variable validation
  supabase/
    client.ts              Browser Supabase client (anon key only)
    server.ts              Server Supabase client (cookie-based sessions)
    middleware.ts           Session refresh helper
  stripe/
    index.ts               Stripe client + subscription tier config
middleware.ts              Root middleware (session refresh + route protection)
components/boostai/        The real UI
  HomeLanding.tsx          Home / route chooser
  PersonaLanding.tsx       Shared school/uni landing
  StudyWorkspace.tsx       Interactive demo (client component)
  StudyDashboard.tsx       Dashboard (client component, uses real user data)
  AuthLogin.tsx            Login / signup page (client component)
  site-data.ts             All mock content, typed
  *.module.css             Styles
supabase/
  migrations/              SQL migration files
public/                    Static assets only (fonts, images, favicon)
```

### Principle: thin routes, real components
`app/*/page.tsx` files stay tiny — they route and render. All UI and logic live in
`components/`. This keeps routing readable and components testable.

### State of the world
- **Auth is real** — Supabase Auth with email/password and Google OAuth.
  Sessions are managed via cookies (middleware refreshes them on every request).
- **Database exists** — Supabase PostgreSQL with `profiles` table and RLS.
- **Stripe groundwork is in place** — webhook handler + checkout route ready.
  Products and pricing need to be configured in Stripe Dashboard.
- **Content is still mock data** in `site-data.ts` (real content comes with AI features).
- **No AI features yet** — no OpenAI calls, no document processing.
- **CI runs on every PR** — lint, type-check, build, secret scanning.

---

## 2. The legacy zone — retired

`public/` used to hold an older, separate implementation of the site as plain
HTML + JS (`login.html`, `school/`, `uni/`, `auth/`, `legacy/`, `assets/*.js`),
served via `next.config.ts` rewrites for `/school` and `/uni`.

**As of this change:** `/school` and `/uni` are real Next.js routes
(`app/school/page.tsx`, `app/uni/page.tsx`) rendering the `PersonaLanding`
component with `schoolLanding` / `universityLanding` data from `site-data.ts`
— that component already existed and was fully built but unused. The legacy
HTML/JS files and the rewrites pointing to them have been deleted.
`public/` now holds only static assets: fonts, images, favicon, logo.

---

## 3. Target directory structure (when backend features land)

```
app/
  api/                          Next.js API routes (server-side only — no secrets reach the browser)
    auth/                       Supabase OAuth redirect callbacks
    questions/
      route.ts                  GET /api/questions, POST /api/questions
      generate/route.ts         POST → generate similar questions via OpenAI
    documents/
      upload/route.ts           POST → LlamaParse PDF pipeline
    webhooks/
      stripe/route.ts           Stripe webhook handler → writes subscription status to Postgres
  (pages as today)

lib/                            One typed module per external service
  supabase/
    client.ts                   Browser Supabase client (public anon key only)
    server.ts                   Server Supabase client (service role key — never imported by client components)
  openai/
    index.ts                    All OpenAI calls: generation + embeddings
  stripe/
    index.ts                    Stripe client + subscription helpers
  llamaparse/
    index.ts                    PDF → structured text pipeline

components/boostai/             UI only — never imports from lib/openai, lib/stripe, lib/llamaparse
```

### Boundary rules
- `lib/supabase/server.ts` and all of `lib/openai/`, `lib/stripe/`, `lib/llamaparse/` are **server-only** — imported exclusively by `app/api/` routes or Next.js Server Components.
- `lib/supabase/client.ts` is the only service file the browser ever touches.
- Client components call our `/api/` routes — never external provider APIs directly.

---

## 4. Target architecture (the roadmap — NOT built yet)

This is the direction. Build toward it incrementally; do not assume any of it exists.

- **Frontend:** Next.js 15 + TypeScript. *Roadmap mentions Tailwind + shadcn/ui;*
  *the MVP currently uses CSS Modules. Migrating is a deliberate, separate decision —*
  *record it here before starting, don't mix the two ad hoc.*
- **Backend:** Supabase — PostgreSQL, Auth, Storage, Edge Functions.
- **Auth:** Supabase Auth (Google + email). Replaces the localStorage fake and the
  legacy JS auth.
- **AI:** OpenAI GPT-5 (generation) + OpenAI embeddings (similarity). Use the latest,
  most capable models; centralise all AI calls behind one server-side module.
- **Document processing:** LlamaParse (PDF → structured text).
- **Vector search:** pgvector inside Supabase (no separate vector DB at MVP).
- **Payments:** Stripe (subscriptions, webhook-driven feature gating).

### The core learning loop (the product)
`Question → Solution → Explanation → Generate Similar → Practice → Mastery`
**Generate Similar** is the central feature. Everything else supports it.

### Hard architectural boundaries (apply these as features land)
1. **AI and secrets are server-side only.** API keys never reach the browser. All
   OpenAI / LlamaParse / Stripe calls happen in Supabase Edge Functions or Next.js
   server code. The client calls *our* endpoints, never the providers directly.
2. **AI output is never trusted blindly.** Every solution/explanation goes through
   the verification approach in `docs/TESTING.md` before a student sees it.
3. **Feature gating is driven by subscription status in Postgres**, set by Stripe
   webhooks — never by client-side checks alone.
4. **One module per external service.** Wrap Supabase, OpenAI, Stripe, and LlamaParse
   each behind a single typed module so they can be tested and swapped.

---

## 5. Recording decisions

When a non-trivial technical choice is made (a new library, a styling-system change,
a new service), add a short dated entry below. This is the project's memory.

### Decision log
- **2026-06 — Baseline.** MVP = Next.js + CSS Modules + mock data, no backend.
  Legacy `public/` frozen as read-only. CI + testing strategy introduced.
- **2026-07 — Infrastructure setup.** Added Supabase (auth + PostgreSQL + RLS),
  Stripe groundwork (checkout + webhooks), proper env var management, enhanced
  CI/CD with secret scanning, and comprehensive documentation (ENVIRONMENTS.md,
  SUPABASE.md, STRIPE.md). Replaced fake localStorage auth with real
  Supabase Auth. Dependencies added: `@supabase/supabase-js`, `@supabase/ssr`,
  `stripe`.
