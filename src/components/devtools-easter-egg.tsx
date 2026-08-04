"use client";

import { useCallback, useEffect, useState } from "react";
import { SOCIALS } from "@/lib/site";

/**
 * Greets anyone who opens devtools.
 *
 * To be completely clear about what this is and isn't: a web page cannot
 * prevent devtools from opening. F12 and Ctrl/Cmd+Shift+I are handled by the
 * browser before the page sees them, and the browser's own menu can't be
 * touched at all. The shortcut handling below is a speed bump, nothing more —
 * and the source is on GitHub anyway, so there's nothing here to protect.
 *
 * So rather than pretend, the site says well done and hands over the repo.
 *
 * Detection is heuristic and deliberately forgiving: it would rather miss
 * someone than nag a visitor whose window just happens to be an odd shape.
 */

/** Docked devtools eats this much viewport before we call it. */
const SIZE_THRESHOLD = 170;
const POLL_MS = 1200;
const SEEN_KEY = "bo-devtools-greeted";

function alreadyGreeted(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberGreeted(): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Nothing to do — worst case they get greeted again next navigation.
  }
}

export function DevtoolsEasterEgg() {
  const [found, setFound] = useState(false);

  const reveal = useCallback(() => {
    if (alreadyGreeted()) return;
    rememberGreeted();
    setFound(true);

    // The other half of the easter egg, for whoever is actually reading here.
    const banner = "background:#000;color:#c9a869;font-size:13px;padding:6px 0;";
    const body = "background:#000;color:#888;font-size:12px;";
    console.log("%c  nicely done.", banner);
    console.log(`%c  the whole site is open source → ${SOCIALS.github}`, body);
  }, []);

  // ── Detection ───────────────────────────────────────────────────────────
  useEffect(() => {
    // Skip touch and small screens: the size heuristic is meaningless there
    // and an on-screen keyboard would trip it constantly.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.innerWidth < 768) return;

    const bySize = () =>
      window.outerWidth - window.innerWidth > SIZE_THRESHOLD ||
      window.outerHeight - window.innerHeight > SIZE_THRESHOLD;

    let stop = false;

    // Catches devtools in a separate window, where the size check can't help:
    // formatting a function for the console calls its toString.
    const bait = function bait() {};
    let baitTripped = false;
    bait.toString = () => {
      baitTripped = true;
      return "";
    };

    const tick = () => {
      if (stop) return;

      if (bySize() || baitTripped) {
        reveal();
        stop = true;
        return;
      }

      // Only probe while nothing has been found yet, and keep it quiet.
      console.debug("%c", "", bait);
    };

    const timer = window.setInterval(tick, POLL_MS);
    tick();

    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [reveal]);

  // ── Best-effort shortcut handling ───────────────────────────────────────
  // Chrome treats most of these as browser-level and will open devtools
  // regardless; preventDefault is honoured inconsistently across browsers.
  // Where it *is* honoured, the greeting stands in for what was blocked.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const mod = event.ctrlKey || event.metaKey;

      const isDevtools =
        event.key === "F12" ||
        (mod && event.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        (mod && key === "u");

      if (!isDevtools) return;

      // Never swallow the shortcut while someone is typing — Ctrl+U and
      // friends have text-editing meanings in fields.
      const target = event.target as Element | null;
      if (target?.closest?.("input, textarea, [contenteditable='true']")) return;

      event.preventDefault();
      reveal();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [reveal]);

  if (!found) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="devtools-egg-title"
      className="fixed bottom-6 left-6 z-[10002] max-w-sm border border-border bg-black/95 backdrop-blur-md p-6 max-md:inset-x-4 max-md:left-auto max-md:right-auto max-md:max-w-none"
    >
      <p className="text-[10px] tracking-[0.2em] uppercase text-accent mb-2">Well done</p>
      <h2 id="devtools-egg-title" className="font-display text-2xl tracking-[0.06em] mb-3">
        You found the wiring
      </h2>
      <p className="text-[12px] text-mid leading-[1.7] mb-5">
        There&apos;s no trick here — the whole site is open source. Have a proper look instead of
        squinting at minified bundles, and if you spot something broken, tell me.
      </p>
      <div className="flex items-center gap-4">
        <a
          href={SOCIALS.github}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          View the repo
        </a>
        <button type="button" onClick={() => setFound(false)} className="btn-ghost cursor-pointer">
          Dismiss
        </button>
      </div>
    </div>
  );
}
