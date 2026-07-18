import Link from "next/link";
import { FOOTER_LINKS, SOCIALS } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-10 py-10 flex items-center justify-between max-md:flex-col max-md:gap-7 max-md:text-center max-md:px-6 max-md:py-9">
      <div className="font-display text-lg tracking-[0.12em] text-dim">BLOBBYOFFICIAL</div>

      <div className="flex gap-7 flex-wrap justify-center max-md:gap-4">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[10px] text-dim no-underline tracking-[0.14em] uppercase transition-colors hover:text-fg max-md:text-[11px]"
          >
            {link.label}
          </Link>
        ))}
        <a
          href={SOCIALS.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-dim no-underline tracking-[0.14em] uppercase transition-colors hover:text-fg max-md:text-[11px]"
        >
          TikTok
        </a>
        <a
          href={SOCIALS.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-dim no-underline tracking-[0.14em] uppercase transition-colors hover:text-fg max-md:text-[11px]"
        >
          YouTube
        </a>
        <a
          href={SOCIALS.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-dim no-underline tracking-[0.14em] uppercase transition-colors hover:text-fg max-md:text-[11px]"
        >
          Discord
        </a>
      </div>

      <div className="text-[10px] text-dim tracking-[0.1em]">© {year} BLOBBYOFFICIAL</div>
    </footer>
  );
}
