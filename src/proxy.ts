import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Runs on every page request, not just /admin.
   *
   * Supabase's server client can't write refreshed auth cookies from a Server
   * Component (see the swallowed error in lib/supabase/server.ts), so this is
   * the only place a rotated refresh token gets persisted. Scoping it to
   * /admin meant sessions on /contact and /scripts rotated tokens that were
   * never saved, quietly signing people out mid-visit.
   *
   * Everything static is excluded so the middleware doesn't run for assets:
   * _next internals, the metadata files served from the app root, and
   * anything with a file extension (the videos and images under /media).
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|site.webmanifest|.*\\.[^/]+$).*)",
  ],
};
