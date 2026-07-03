/**
 * Root middleware — runs on every request.
 *
 * Responsibilities:
 * 1. Refreshes the Supabase auth session (keeps users logged in)
 * 2. Protects routes that require authentication (see lib/supabase/middleware.ts)
 *
 * See: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, favicon.png, favicon.svg, favicon.webp
     * - logo.png, logo.svg, logo.webp
     * - Files in /boostai/ (public assets)
     * - Files in /Images/ (public assets)
     * - Files in /fonts/ (public fonts)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|favicon\\.svg|favicon\\.webp|logo\\.png|logo\\.svg|logo\\.webp|boostai/|Images/|fonts/).*)",
  ],
};
