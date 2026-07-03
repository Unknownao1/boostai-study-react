/**
 * Auth sign-out API route.
 *
 * POST /api/auth/signout → signs the user out and redirects to home.
 * Using a POST route (not client-side signOut) ensures the session cookie
 * is properly cleared on the server.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, { status: 302 });
}
