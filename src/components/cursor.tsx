"use client";

import { useEffect, useRef } from "react";

/** Custom dot cursor that grows over interactive elements. No-ops on touch/coarse pointers via CSS. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = ref.current;
    if (!cursor) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, [data-cursor="big"]';

    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    /**
     * Delegated rather than bound per element. The previous version queried
     * for links once on mount, so anything rendered later — every page
     * reached by client-side navigation, the mobile menu, the cookie banner —
     * never grew the cursor. `mouseover`/`mouseout` bubble (unlike
     * mouseenter/mouseleave), so one pair of listeners covers everything.
     */
    const over = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.(INTERACTIVE)) cursor.classList.add("big");
    };

    const out = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest?.(INTERACTIVE)) return;

      // Ignore moves between children of the same interactive element.
      const next = e.relatedTarget as Element | null;
      if (next?.closest?.(INTERACTIVE) === target.closest(INTERACTIVE)) return;

      cursor.classList.remove("big");
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
    };
  }, []);

  return <div id="cursor" ref={ref} aria-hidden="true" />;
}
