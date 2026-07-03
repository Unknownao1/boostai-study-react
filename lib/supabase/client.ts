/**
 * Browser-side Supabase client.
 *
 * Uses the public anon key only — safe for client components.
 * This is the ONLY Supabase file that client components may import.
 *
 * Usage:
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
