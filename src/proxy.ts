import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * status.blobbyofficial.com serves the /status route, rewritten rather than
 * redirected so the status subdomain keeps its own URL in the address bar.
 *
 * Every other path on that host rewrites to /status too: the subdomain has
 * exactly one page, and a 404 there ("is the status page down?") is the last
 * thing anyone needs while checking whether something is down.
 */
function statusHostRewrite(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (!host.startsWith("status.")) return null;

  const path = request.nextUrl.pathname;
  // The status page files its reports through a Server Action, which POSTs
  // back to the page's own URL — leave those (and Next's internals) alone.
  if (path === "/status" || path.startsWith("/_next") || path.startsWith("/api")) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/status";
  return NextResponse.rewrite(url);
}

export async function proxy(request: NextRequest) {
  const statusRewrite = statusHostRewrite(request);
  if (statusRewrite) return statusRewrite;

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
