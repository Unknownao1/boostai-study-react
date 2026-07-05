/**
 * Environment variable validation.
 *
 * Import `serverEnv` in API routes / server components.
 * Import `clientEnv` anywhere (only exposes NEXT_PUBLIC_ values).
 *
 * The app fails fast with a clear error if a required variable is missing.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}\n` +
        `Copy .env.example to .env.local and fill in real values.\n` +
        `See docs/ENVIRONMENTS.md for help.`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Client-safe variables (NEXT_PUBLIC_ prefix — visible in the browser bundle)
// ---------------------------------------------------------------------------
export const clientEnv = {
  SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  STRIPE_PUBLISHABLE_KEY: requireEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  APP_URL: requireEnv("NEXT_PUBLIC_APP_URL"),
} as const;

// ---------------------------------------------------------------------------
// Server-only variables (never reach the browser)
// Import ONLY in: app/api/*, lib/supabase/server.ts, lib/stripe/*, middleware.ts
// ---------------------------------------------------------------------------
export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  STRIPE_SECRET_KEY: requireEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: requireEnv("STRIPE_WEBHOOK_SECRET"),
} as const;
