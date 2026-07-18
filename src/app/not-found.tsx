import Link from "next/link";

export default function NotFound() {
  return (
    <section className="cine-backdrop relative min-h-screen flex flex-col justify-end items-start px-10 pb-[60px] overflow-hidden max-md:px-6 max-md:pb-14 max-md:min-h-dvh">
      <div
        className="absolute -right-[2vw] -bottom-[4vh] font-display leading-[0.85] tracking-[-0.02em] pointer-events-none select-none z-0 text-transparent max-md:hidden"
        style={{
          fontSize: "clamp(260px, 38vw, 540px)",
          WebkitTextStroke: "1px rgba(255,255,255,0.04)",
        }}
        aria-hidden="true"
      >
        404
      </div>

      <div className="relative z-[3]">
        <p className="fade-up text-[10px] tracking-[0.2em] uppercase text-mid mb-5">Error 404</p>
        <h1 className="fade-up font-display text-[clamp(100px,18vw,220px)] leading-[0.88] tracking-[0.04em]" style={{ animationDelay: "0.1s" }}>
          NOT
          <br />
          FOUND
        </h1>
        <span
          className="fade-up block font-serif italic font-light text-mid text-[clamp(22px,3.5vw,44px)] tracking-[0.1em] mt-2.5"
          style={{ animationDelay: "0.22s" }}
        >
          this page doesn&apos;t exist
        </span>
        <p className="fade-up max-w-[360px] mt-7 text-xs text-mid leading-[1.75]" style={{ animationDelay: "0.34s" }}>
          The page you&apos;re looking for may have been moved, deleted, or never existed.
          Head back and find what you need.
        </p>
        <div className="fade-up mt-9 flex gap-4 items-center max-md:flex-col max-md:items-start max-md:w-full" style={{ animationDelay: "0.46s" }}>
          <Link href="/" className="btn-primary max-md:w-full max-md:justify-center">
            Go Home
          </Link>
          <Link href="/store" className="btn-ghost">
            View Store →
          </Link>
        </div>
      </div>

      <div
        className="fade-up absolute right-10 bottom-[60px] z-[3] flex items-center gap-2.5 text-[10px] tracking-[0.2em] text-dim uppercase max-md:hidden"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed", animationDelay: "0.6s" }}
        aria-hidden="true"
      >
        blobbyofficial.com
      </div>
    </section>
  );
}
