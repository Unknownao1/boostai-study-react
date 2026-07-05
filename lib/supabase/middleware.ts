/**
 * Supabase middleware helper.
 *
 * Refreshes the user's auth session on every request by reading and writing
 * cookies. This prevents sessions from expiring while the user is active.
 *
 * Called from the root middleware.ts — do not import elsewhere.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT call supabase.auth.getSession() here.
  // getUser() actually validates the session with the Supabase server,
  // while getSession() only reads from the (potentially stale) cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes: redirect unauthenticated users to login
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/account") ||
    request.nextUrl.pathname.startsWith("/study");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
