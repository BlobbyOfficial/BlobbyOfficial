"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/site";

export function SiteNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-[100] flex items-center justify-between px-10 py-[22px] bg-black/85 backdrop-blur-md border-b border-border max-md:px-5 max-md:py-4"
      aria-label="Main Navigation"
    >
      <Link href="/" className="font-display text-[22px] tracking-[0.12em] text-fg" aria-label="Homepage">
        blobbyofficial
      </Link>

      <button
        className="hidden max-md:flex flex-col justify-center items-center gap-[5px] w-9 h-9 border border-border shrink-0 transition-colors hover:border-border-hover"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={`block w-4 h-px bg-fg transition-transform ${open ? "translate-y-[6px] rotate-45" : ""}`}
        />
        <span
          className={`block w-4 h-px bg-fg transition-transform ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
        />
      </button>

      <ul
        className={`flex gap-9 list-none max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:h-dvh max-md:bg-black/97 max-md:backdrop-blur-xl max-md:flex-col max-md:justify-center max-md:items-center max-md:gap-0 max-md:border-b max-md:border-border max-md:z-[99] max-md:transition-transform max-md:duration-[400ms] ${
          open ? "max-md:translate-y-0" : "max-md:-translate-y-full"
        }`}
      >
        {NAV_LINKS.map((link) => (
          <li key={link.href} className="max-md:w-full max-md:text-center max-md:border-b max-md:border-border">
            <Link
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-mid no-underline text-[11px] tracking-[0.14em] uppercase transition-colors hover:text-fg max-md:block max-md:px-5 max-md:py-[18px] max-md:text-[13px] max-md:tracking-[0.2em]"
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li className="max-md:w-full max-md:text-center">
          <Link
            href="/contact"
            aria-label="Contact me"
            onClick={() => setOpen(false)}
            className="text-fg! border border-border px-3.5 py-1.5 transition-colors hover:bg-white/7 hover:border-border-hover max-md:block max-md:border-none! max-md:px-5 max-md:py-[18px] max-md:bg-white/4 text-[11px] tracking-[0.14em] uppercase no-underline"
          >
            Contact
          </Link>
        </li>
      </ul>
    </nav>
  );
}
