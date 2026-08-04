"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SOCIALS } from "@/lib/site";

/**
 * Custom right-click menu.
 *
 * Replaces the browser's default menu with one in the site's own visual
 * language, and drops the Inspect entry along the way. It is *not* a security
 * measure — the page source is public and devtools has its own shortcuts and
 * browser-menu entry that a page cannot touch (see devtools-easter-egg.tsx,
 * which greets anyone who gets in).
 *
 * The native menu is deliberately left alone inside text fields: spellcheck,
 * copy/paste and the browser's own suggestions matter more in the contact
 * thread and the script editor than a consistent menu does.
 */

type MenuItem =
  | { kind: "action"; label: string; hint?: string; run: () => void | Promise<void> }
  | { kind: "separator" };

const MENU_WIDTH = 232;
const EDGE_GAP = 8;

/** Elements where the browser's own menu is more useful than ours. */
function wantsNativeMenu(target: EventTarget | null): boolean {
  const el = target as Element | null;
  if (!el?.closest) return false;
  return Boolean(el.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']"));
}

function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ContextMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [toast, setToast] = useState<string | null>(null);

  const close = useCallback(() => {
    setPosition(null);
    setActiveIndex(-1);
  }, []);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  // Build the menu from whatever was actually right-clicked, so the entries
  // are about the thing under the cursor rather than a fixed list.
  const buildItems = useCallback(
    (target: Element | null): MenuItem[] => {
      const contextual: MenuItem[] = [];

      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      const selection = window.getSelection()?.toString().trim();

      // The portfolio player lays its play button and control bar over the
      // video, so the click target is usually one of those rather than the
      // media itself — fall back to the video inside the surrounding player.
      const media = (target?.closest?.("video, img") ??
        target?.closest?.('[role="group"]')?.querySelector("video") ??
        null) as HTMLVideoElement | HTMLImageElement | null;

      if (selection) {
        contextual.push({
          kind: "action",
          label: "Copy selection",
          run: async () => flash((await copy(selection)) ? "Copied" : "Couldn't copy"),
        });
      }

      if (link) {
        const href = link.href;
        contextual.push(
          { kind: "action", label: "Open link in new tab", run: () => openExternal(href) },
          { kind: "action", label: "Copy link address", run: async () => flash((await copy(href)) ? "Copied" : "Couldn't copy") }
        );
      }

      if (media) {
        const src = media.currentSrc || media.src;
        const isVideo = media.tagName === "VIDEO";
        if (src) {
          contextual.push(
            {
              kind: "action",
              label: isVideo ? "Open clip in new tab" : "Open image in new tab",
              run: () => openExternal(src),
            },
            {
              kind: "action",
              label: isVideo ? "Copy clip link" : "Copy image link",
              run: async () => flash((await copy(src)) ? "Copied" : "Couldn't copy"),
            }
          );
        }
      }

      const base: MenuItem[] = [
        {
          kind: "action",
          label: "Copy page link",
          run: async () => flash((await copy(window.location.href)) ? "Copied" : "Couldn't copy"),
        },
        { kind: "separator" },
        { kind: "action", label: "Portfolio", run: () => router.push("/portfolio") },
        { kind: "action", label: "Store", run: () => router.push("/store") },
        { kind: "action", label: "Hire me", run: () => router.push("/contact") },
        { kind: "separator" },
        {
          kind: "action",
          label: "Source on GitHub",
          hint: "↗",
          run: () => openExternal(SOCIALS.github),
        },
      ];

      return contextual.length > 0 ? [...contextual, { kind: "separator" }, ...base] : base;
    },
    [router, flash]
  );

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      if (wantsNativeMenu(event.target)) return;

      event.preventDefault();
      setItems(buildItems(event.target as Element | null));
      setPosition({ x: event.clientX, y: event.clientY });
      setActiveIndex(-1);
    };

    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, [buildItems]);

  // Dismiss on anything that would move the menu away from its anchor.
  useEffect(() => {
    if (!position) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) close();
    };
    const onScroll = () => close();
    const onBlur = () => close();

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("blur", onBlur);
    };
  }, [position, close]);

  // Keep the menu on screen: flip it back inside whichever edge it overruns.
  useLayoutEffect(() => {
    if (!position || !menuRef.current) return;

    const menu = menuRef.current;
    const { offsetWidth: width, offsetHeight: height } = menu;
    const maxX = window.innerWidth - width - EDGE_GAP;
    const maxY = window.innerHeight - height - EDGE_GAP;

    menu.style.left = `${Math.max(EDGE_GAP, Math.min(position.x, maxX))}px`;
    menu.style.top = `${Math.max(EDGE_GAP, Math.min(position.y, maxY))}px`;
  }, [position, items]);

  useEffect(() => {
    if (!position) return;
    // Focus the menu itself so Escape and arrow keys work without forcing
    // focus onto the first item (which would look pre-selected).
    menuRef.current?.focus();
  }, [position]);

  if (!position && !toast) return null;

  const selectableIndexes = items
    .map((item, index) => (item.kind === "action" ? index : -1))
    .filter((index) => index >= 0);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const current = selectableIndexes.indexOf(activeIndex);
      const next =
        event.key === "ArrowDown"
          ? selectableIndexes[(current + 1) % selectableIndexes.length]
          : selectableIndexes[(current - 1 + selectableIndexes.length) % selectableIndexes.length];
      setActiveIndex(next);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? selectableIndexes[0] : selectableIndexes.at(-1)!);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      const item = items[activeIndex];
      if (item?.kind === "action") {
        event.preventDefault();
        close();
        void item.run();
      }
    }
  };

  return (
    <>
      {position && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Page actions"
          tabIndex={-1}
          onKeyDown={onKeyDown}
          style={{ left: position.x, top: position.y, width: MENU_WIDTH }}
          className="fixed z-[10000] border border-border bg-black/95 backdrop-blur-md py-1.5 outline-none shadow-[0_18px_50px_rgba(0,0,0,0.7)]"
        >
          {items.map((item, index) =>
            item.kind === "separator" ? (
              <div key={`sep-${index}`} className="my-1.5 h-px bg-border" role="separator" />
            ) : (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  close();
                  void item.run();
                }}
                className={`flex w-full items-center justify-between gap-4 px-4 py-2 text-left font-mono text-[10px] tracking-[0.14em] uppercase transition-colors cursor-pointer ${
                  activeIndex === index ? "bg-white/8 text-fg" : "text-mid hover:text-fg"
                }`}
              >
                <span>{item.label}</span>
                {item.hint && <span className="text-dim">{item.hint}</span>}
              </button>
            )
          )}
        </div>
      )}

      {toast && (
        <div
          role="status"
          /* Bottom-centre keeps it clear of the cookie banner (bottom-right)
             and the devtools greeting (bottom-left). */
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] border border-border bg-black/95 backdrop-blur-md px-4 py-2.5 font-mono text-[10px] tracking-[0.14em] uppercase text-mid"
        >
          {toast}
        </div>
      )}
    </>
  );
}
