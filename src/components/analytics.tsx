"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";
import { ANALYTICS } from "@/lib/site";
import {
  CONSENT_REOPEN_EVENT,
  readConsent,
  readConsentOnServer,
  subscribeConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/consent";

/**
 * Consent-gated analytics.
 *
 * GA and Clarity used to load for everyone on first paint. They're both
 * cookie-setting, behaviour-profiling tools, so they now stay unloaded until
 * the visitor accepts — and a decision is remembered so the banner isn't
 * shown again. Declining is a real choice: nothing is requested at all.
 */
export function Analytics({ enabled }: { enabled: boolean }) {
  // `undefined` on the server and during hydration, the stored value after —
  // so nothing is painted until we know what the visitor actually chose.
  const choice = useSyncExternalStore(subscribeConsent, readConsent, readConsentOnServer);

  // Separate from the stored choice: "show me the banner again" is UI state,
  // not consent state.
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener(CONSENT_REOPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, reopen);
  }, []);

  const decide = useCallback((next: ConsentChoice) => {
    writeConsent(next);
    setReopened(false);
  }, []);

  if (!enabled || choice === undefined) return null;

  if (choice === "granted" && !reopened) {
    return (
      <>
        <Script
          id="clarity-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${ANALYTICS.clarityId}");`,
          }}
        />
        <Script
          id="ga-loader"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.gaId}`}
        />
        <Script
          id="ga-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${ANALYTICS.gaId}');`,
          }}
        />
      </>
    );
  }

  if (choice === "denied" && !reopened) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      /* Anchored bottom-right on desktop so it doesn't sit on top of the
         hero's "Hire Me" call to action, which is bottom-left. */
      className="fixed z-[9997] border border-border bg-black/95 backdrop-blur-md p-6 flex flex-col gap-4 bottom-6 right-6 max-w-sm max-md:inset-x-0 max-md:bottom-0 max-md:right-auto max-md:max-w-none max-md:border-x-0 max-md:border-b-0 max-md:p-5"
    >
      <div>
        <p
          id="cookie-banner-title"
          className="text-[10px] tracking-[0.2em] uppercase text-mid mb-2"
        >
          Cookies
        </p>
        <p className="text-[12px] text-mid leading-[1.7]">
          I&apos;d like to use analytics to see which pages people actually find useful. They set
          cookies, so they only load if you say yes — the site works the same either way.{" "}
          <Link href="/privacy-policy" className="text-fg underline underline-offset-2">
            Privacy policy
          </Link>
          .
        </p>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={() => decide("granted")}
          className="btn-primary flex-1 justify-center"
        >
          Accept
        </button>
        <button type="button" onClick={() => decide("denied")} className="btn-ghost">
          Decline
        </button>
      </div>
    </div>
  );
}
