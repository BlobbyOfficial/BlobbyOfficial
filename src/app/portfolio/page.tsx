import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { StatsRow } from "@/components/stats-row";
import { getPortfolioClips, getHiddenPortfolioSections } from "@/lib/content";
import { SOCIALS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Freelance video editing work from blobbyofficial - TikTok edits and short-form cuts.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const [clips, hiddenSections] = await Promise.all([getPortfolioClips(), getHiddenPortfolioSections()]);

  return (
    <>
      <PageHero
        tag="Portfolio"
        title="Recent"
        subtitle="edits"
        ghost="02"
        description="A selection of TikTok-native edits. Every clip links out to the full video."
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <StatsRow />

        <div className="border border-border p-9 max-md:p-6">
          <div className="flex items-baseline justify-between mb-7">
            <h2 className="font-display text-[32px] tracking-[0.06em] max-md:text-[26px]">
              My Work
            </h2>
            <a
              href={SOCIALS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-mid tracking-[0.12em] uppercase no-underline transition-colors hover:text-fg"
            >
              View Profile →
            </a>
          </div>
          <PortfolioGrid clips={clips} hiddenSections={hiddenSections} />
        </div>

        <div className="mt-14 border border-border p-9 flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-6 max-md:p-6">
          <div>
            <h2 className="font-display text-2xl tracking-[0.06em] mb-2">Like what you see?</h2>
            <p className="text-[13px] text-mid max-w-md leading-[1.7]">
              I&apos;m currently taking on new freelance edits. Send over your footage and deadline.
            </p>
          </div>
          <Link href="/contact" className="btn-primary shrink-0">
            Hire Me
          </Link>
        </div>
      </section>
    </>
  );
}
