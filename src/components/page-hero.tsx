import type { ReactNode } from "react";

export function PageHero({
  tag,
  title,
  subtitle,
  ghost,
  description,
}: {
  tag: string;
  title: ReactNode;
  subtitle?: string;
  ghost: string;
  description?: string;
}) {
  return (
    <section className="cine-backdrop relative min-h-[60vh] flex flex-col justify-end items-start px-10 pb-16 pt-32 overflow-hidden max-md:px-6 max-md:pb-10 max-md:pt-28">
      <div
        className="absolute -right-[2vw] -bottom-[4vh] font-display leading-[0.85] tracking-[-0.02em] pointer-events-none select-none z-0 text-transparent max-md:text-[clamp(120px,44vw,220px)] max-md:-right-[4vw]"
        style={{
          fontSize: "clamp(200px, 30vw, 420px)",
          WebkitTextStroke: "1px rgba(255,255,255,0.04)",
        }}
        aria-hidden="true"
      >
        {ghost}
      </div>

      <div className="relative z-[3]">
        <p className="fade-up text-[10px] tracking-[0.2em] uppercase text-mid mb-5">{tag}</p>
        <h1 className="fade-up font-display text-[clamp(48px,9vw,120px)] leading-[0.9] tracking-[0.04em]" style={{ animationDelay: "0.1s" }}>
          {title}
        </h1>
        {subtitle && (
          <span
            className="fade-up block font-serif italic font-light text-mid text-[clamp(20px,3vw,36px)] tracking-[0.1em] mt-2.5"
            style={{ animationDelay: "0.22s" }}
          >
            {subtitle}
          </span>
        )}
        {description && (
          <p
            className="fade-up max-w-[440px] mt-7 text-xs text-mid leading-[1.75]"
            style={{ animationDelay: "0.34s" }}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
