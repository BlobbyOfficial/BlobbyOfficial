import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { FOOTER_LINKS, SOCIALS } from "@/lib/site";

const footerLinkClass =
  "text-[10px] text-dim no-underline tracking-[0.14em] uppercase transition-colors hover:text-fg max-md:text-[11px]";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-10 py-10 flex items-center justify-between max-md:flex-col max-md:gap-7 max-md:text-center max-md:px-6 max-md:py-9">
      <div className="font-display text-lg tracking-[0.12em] text-dim">BLOBBYOFFICIAL</div>

      <div className="flex gap-7 flex-wrap justify-center max-md:gap-4">
        {FOOTER_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={footerLinkClass}>
            {link.label}
          </Link>
        ))}
        <a href={SOCIALS.tiktok} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
          TikTok
        </a>
        <a href={SOCIALS.youtube} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
          YouTube
        </a>
        <a href={SOCIALS.discord} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
          Discord
        </a>
        <CookieSettingsButton className={`${footerLinkClass} cursor-pointer`} />
      </div>

      <div className="text-[10px] text-dim tracking-[0.1em]">© {year} BLOBBYOFFICIAL</div>
    </footer>
  );
}
