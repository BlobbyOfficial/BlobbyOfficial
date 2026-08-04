"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.innerWidth <= 768) return;

    const onReady = () => video.classList.add("loaded");
    if (video.readyState >= 3) onReady();
    else video.addEventListener("canplay", onReady, { once: true });

    const onError = () => {
      video.style.display = "none";
    };
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
    };
  }, []);

  return (
    <section
      className="cine-backdrop relative min-h-screen flex flex-col justify-end items-start px-10 pb-[60px] overflow-hidden max-md:px-6 max-md:pb-14 max-md:min-h-dvh"
      id="home"
    >
      {/* The black fill is the poster: the video fades in over it once it can
          play. A `poster` image would be better for LCP, but the one this
          pointed at was never committed, so it only ever cost a 404. */}
      <div className="absolute inset-0 bg-black">
        <video
          ref={videoRef}
          className="hero-video absolute inset-0 w-full h-full object-cover object-center opacity-0 transition-opacity duration-[1200ms] ease-in-out pointer-events-none z-0 max-md:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.3) 100%), linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="relative z-[3]">
        <h1 className="fade-up font-display text-[clamp(72px,12vw,160px)] leading-[0.9] tracking-[0.04em]" style={{ animationDelay: "0.35s" }}>
          <span className="block font-serif italic font-light text-mid text-[clamp(22px,3.5vw,48px)] tracking-[0.1em] mb-2">
            Freelance Video Editor
          </span>
          @blobbyofficial
        </h1>

        <p
          className="fade-up max-w-[380px] mt-7 text-xs text-mid leading-[1.7]"
          style={{ animationDelay: "0.5s" }}
        >
          I cut fast-paced, high-retention TikTok edits and build the DaVinci Resolve
          presets to back them up - free for anyone who wants to skip the guesswork.
        </p>

        <div
          className="fade-up mt-9 flex gap-4 items-center max-md:flex-col max-md:items-start max-md:w-full"
          style={{ animationDelay: "0.65s" }}
        >
          <Link href="/contact" className="btn-primary max-md:w-full max-md:justify-center">
            Hire Me
          </Link>
          <Link href="/portfolio" className="btn-ghost">
            View Portfolio →
          </Link>
        </div>
      </div>

      <div
        className="fade-up absolute right-10 bottom-[60px] z-[3] flex items-center gap-2.5 text-[10px] tracking-[0.2em] text-dim uppercase max-md:hidden"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed", animationDelay: "1s" }}
        aria-hidden="true"
      >
        <span
          className="w-px h-[50px] block"
          style={{ background: "linear-gradient(to bottom, transparent, var(--dim))" }}
        />
        <span>Scroll</span>
      </div>
    </section>
  );
}
