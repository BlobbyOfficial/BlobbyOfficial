"use client";

import { useEffect } from "react";
import { SOCIALS } from "@/lib/site";

/**
 * The note for anyone who opens the Elements panel.
 *
 * It's a comment node inserted above <html>, so it sits at the very top of
 * the element tree — the first thing in view when devtools opens. Nothing is
 * shown on the page itself, and nothing is written to the console.
 *
 * React can't render comment nodes, and the root layout owns <html>, so
 * there's no way to put this in the server-rendered markup from a component.
 * Inserting it into the live DOM is what the Elements panel reads anyway.
 *
 * On blocking devtools: a page can't. F12 and Ctrl/Cmd+Shift+I are handled by
 * the browser before the page ever sees them, and the browser's own menu is
 * untouchable. The shortcut handler below is a speed bump and nothing more —
 * the source is on GitHub regardless, which is what the note says.
 */

const NOTE = `
  ─────────────────────────────────────────────────

    nicely done — you found the wiring.

    there's no trick here: the whole site is
    open source, so have a proper look instead
    of squinting at minified bundles.

    ${SOCIALS.github}

    spot something broken? tell me.

  ─────────────────────────────────────────────────
`;

/** Marker so the note is never inserted twice (Strict Mode, re-mounts). */
const MARKER = "you found the wiring";

export function DevtoolsNote() {
  useEffect(() => {
    for (const node of Array.from(document.childNodes)) {
      if (node.nodeType === Node.COMMENT_NODE && node.nodeValue?.includes(MARKER)) return;
    }

    try {
      // Before <html> (and after the doctype) — the top of the Elements tree.
      document.insertBefore(document.createComment(NOTE), document.documentElement);
    } catch {
      // Nothing worth breaking a page render over.
    }
  }, []);

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
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
