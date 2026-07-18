"use client";

import Script from "next/script";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Renders the Cloudflare Turnstile widget when a site key is configured.
 * Uses Turnstile's implicit render mode (api.js auto-scans for
 * `.cf-turnstile` elements), so no manual .render() call is needed.
 */
export function TurnstileWidget() {
  if (!SITE_KEY) return null;

  return (
    <>
      <div className="cf-turnstile" data-sitekey={SITE_KEY} data-theme="dark" />
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        async
        defer
      />
    </>
  );
}
