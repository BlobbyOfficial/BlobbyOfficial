import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/hero";
import { ProductCard } from "@/components/product-card";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { StatsRow } from "@/components/stats-row";
import { Reveal } from "@/components/reveal";
import { PricingCards } from "@/components/pricing-section";
import {
  getProducts,
  getPortfolioClips,
  getHiddenPortfolioSections,
  getPricingSettings,
  getPricingTiers,
} from "@/lib/content";
import { SOCIALS } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [products, clips, hiddenSections, pricingTiers, pricingSettings] = await Promise.all([
    getProducts(),
    getPortfolioClips(),
    getHiddenPortfolioSections(),
    getPricingTiers(),
    getPricingSettings(),
  ]);

  return (
    <>
      <Hero />

      <section className="border-t border-border py-25 px-10 max-md:py-16 max-md:px-6" id="store">
        <Reveal as="div">
          <h2 className="section-label">Store</h2>
        </Reveal>

        {/* min() lets the column shrink below its 280px preference once the
            container is narrower than that — without it the grid forced a
            280px track and overflowed the very narrowest phones. */}
        <div
          className="grid gap-0.5 max-md:gap-px"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 380px))" }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="border-t border-border py-25 px-10 max-md:py-16 max-md:px-6" id="portfolio">
        <Reveal as="div">
          <h2 className="section-label">Portfolio</h2>
        </Reveal>

        <Reveal>
          <StatsRow />
        </Reveal>

        <Reveal>
          <div className="border border-border p-9 max-md:p-6">
            <div className="flex items-baseline justify-between mb-7">
              <h3 className="font-display text-[32px] tracking-[0.06em] max-md:text-[26px]">My Work</h3>
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
        </Reveal>

        <Reveal className="mt-8 text-center">
          <Link
            href="/portfolio"
            className="text-[11px] text-mid tracking-[0.14em] uppercase no-underline transition-colors hover:text-fg"
          >
            View full portfolio →
          </Link>
        </Reveal>
      </section>

      <section className="border-t border-border py-25 px-10 max-md:py-16 max-md:px-6" id="pricing">
        <Reveal as="div">
          <h2 className="section-label">Pricing</h2>
        </Reveal>

        <PricingCards tiers={pricingTiers} />

        {pricingSettings.payment_note && (
          <Reveal>
            <p className="border border-border bg-white/2 mt-0.5 p-6 text-[12px] text-mid leading-[1.8] max-md:p-5">
              {pricingSettings.payment_note}
            </p>
          </Reveal>
        )}

        <Reveal className="mt-8 text-center">
          <Link
            href="/pricing"
            className="text-[11px] text-mid tracking-[0.14em] uppercase no-underline transition-colors hover:text-fg"
          >
            Compare every tier →
          </Link>
        </Reveal>
      </section>
    </>
  );
}
