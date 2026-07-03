/**
 * OAuth callback handler.
 *
 * When a user signs in with Google (or any OAuth provider), Supabase redirects
 * them back to this route with a `code` parameter. We exchange that code for a
 * session and redirect the user to their intended destination.
 *
 * Flow: User clicks "Sign in with Google" → Supabase → Google → Supabase →
 *       /api/auth/callback?code=... → this route → redirect to /dashboard
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful auth — send user to their intended destination
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Auth failed — redirect to login with an error indicator
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
}
