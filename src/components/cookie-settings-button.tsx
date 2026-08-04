"use client";

import { openCookieSettings } from "@/lib/consent";

/**
 * Reopens the consent banner so a decision can be changed later — consent
 * has to be as easy to withdraw as it was to give.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookies
    </button>
  );
}
