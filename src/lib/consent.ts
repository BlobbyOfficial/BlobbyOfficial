/**
 * Analytics consent, stored client-side.
 *
 * Google Analytics and Microsoft Clarity both set cookies and profile
 * behaviour, which under UK/EU PECR + GDPR needs opt-in consent before the
 * scripts load — not a notice after the fact. Nothing analytics-related is
 * requested until `granted` is stored here.
 *
 * This is modelled as an external store (subscribe/getSnapshot) so components
 * can read it with `useSyncExternalStore`, which renders nothing on the server
 * and the real value straight after hydration — no mismatch, and no writing
 * state from an effect.
 */

export const CONSENT_STORAGE_KEY = "bo-analytics-consent";

/** Dispatched on `window` to reopen the banner from the footer link. */
export const CONSENT_REOPEN_EVENT = "bo:cookie-settings";

export type ConsentChoice = "granted" | "denied";

const listeners = new Set<() => void>();

/**
 * Mirrors the stored choice in memory so the decision still takes effect for
 * the current page view when localStorage is unavailable (private mode,
 * cookies blocked) and the write silently failed.
 */
let inMemoryChoice: ConsentChoice | null = null;

export function subscribeConsent(onChange: () => void): () => void {
  listeners.add(onChange);

  // Keep other tabs in sync: declining in one should stop analytics in all.
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** `null` means the visitor hasn't chosen yet, so the banner should show. */
export function readConsent(): ConsentChoice | null {
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === "granted" || stored === "denied") return stored;
  } catch {
    // Storage can throw in private modes or with cookies blocked. Treating
    // that as "no consent recorded" is the safe direction to fail.
  }
  return inMemoryChoice;
}

/**
 * `undefined` during server render and hydration — distinct from `null`, so
 * the banner isn't briefly painted into HTML that the client may replace.
 */
export function readConsentOnServer(): undefined {
  return undefined;
}

export function writeConsent(choice: ConsentChoice): void {
  inMemoryChoice = choice;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // If we can't persist the choice we still honour it for this page view.
  }
  listeners.forEach((listener) => listener());
}

/** Reopens the banner so a stored decision can be changed. */
export function openCookieSettings(): void {
  window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT));
}
