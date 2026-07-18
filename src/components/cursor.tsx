"use client";

import { useEffect, useRef } from "react";

/** Custom dot cursor that grows over interactive elements. No-ops on touch/coarse pointers via CSS. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = ref.current;
    if (!cursor) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };
    const onEnter = () => cursor.classList.add("big");
    const onLeave = () => cursor.classList.remove("big");

    document.addEventListener("mousemove", move);

    const targets = document.querySelectorAll('a, button, [data-cursor="big"]');
    targets.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.removeEventListener("mousemove", move);
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return <div id="cursor" ref={ref} aria-hidden="true" />;
}
