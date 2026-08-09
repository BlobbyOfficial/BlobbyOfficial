"use client";

import { usePathname } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

/**
 * The status page is served from its own subdomain (status.blobbyofficial.com,
 * rewritten to /status in proxy.ts), where the site nav and footer would be a
 * wall of links that all resolve to a host that doesn't have those pages. It
 * gets the shared shell — fonts, grain, cursor — and nothing that navigates.
 *
 * A client component because that's the only place a layout can learn which
 * route is rendering; the check is cheap and the pages stay static.
 */
function isBareRoute(pathname: string | null) {
  return pathname === "/status" || (pathname?.startsWith("/status/") ?? false);
}

export function SiteChromeNav() {
  return isBareRoute(usePathname()) ? null : <SiteNav />;
}

export function SiteChromeFooter() {
  return isBareRoute(usePathname()) ? null : <SiteFooter />;
}
