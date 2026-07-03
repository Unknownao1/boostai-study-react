# Environment Variables

How secrets and configuration are managed across local development, preview
deployments, and production. Follow this guide when adding, changing, or
debugging any environment variable.

---

## The three environments

| Environment | Where vars are set | When it runs | Who sees it |
|---|---|---|---|
| **Local** | `.env.local` (your machine) | `npm run dev` | Only you |
| **Preview** | Vercel → Project Settings → Environment Variables (Preview) | Every PR gets a deploy | PR reviewers |
| **Production** | Vercel → Project Settings → Environment Variables (Production) | Merge to `main` | Real users |

---

## Adding a new environment variable

1. **Add it to `.env.example`** with a placeholder value and a comment explaining
   where to get the real value. This file is committed to the repo.
2. **Add it to your local `.env.local`** with the real value. This file is
   gitignored and never committed.
3. **Add it to Vercel** in Project Settings → Environment Variables.
   - Choose which environments it applies to (Preview, Production, or both).
   - If the value differs between Preview and Production (e.g. Supabase project
     URLs), add it twice with different values for each environment.
4. **If the build needs it** (e.g. it's used at build time, not just runtime),
   add a placeholder to the CI workflow in `.github/workflows/ci.yml` under the
   Build step's `env:` block.
5. **Add validation** in `lib/env.ts` so the app fails fast with a clear error
   if the variable is missing.

---

## Variable naming rules

- **`NEXT_PUBLIC_` prefix** = visible in the browser. Use this for values that
  are safe to expose (Supabase URL, Supabase anon key, Stripe publishable key).
- **No prefix** = server-only. Never reaches the browser bundle. Use this for
  secrets (service role keys, Stripe secret key, webhook secrets).

> ⚠️ **Never put a secret in a `NEXT_PUBLIC_` variable.** It will be bundled
> into JavaScript that anyone can read.

---

## Current variables

| Variable | Client/Server | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase public anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase admin key (bypasses RLS) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Server | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Server | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Client | Base URL of the app |

---

## Debugging

If the app crashes on startup with `Missing environment variable: ...`:

1. Check that `.env.local` exists and has the variable.
2. Check that the variable name is spelled exactly right (case-sensitive).
3. Restart the dev server after changing `.env.local` (Next.js does not
   hot-reload env changes).

If a variable works locally but fails on Vercel:

1. Go to Vercel → Project Settings → Environment Variables.
2. Check the variable exists for the right environment (Preview or Production).
3. Redeploy — Vercel caches env vars at build time.
