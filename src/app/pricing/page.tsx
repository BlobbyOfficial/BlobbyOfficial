import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { PricingCards, PricingTable } from "@/components/pricing-section";
import { getPricingFeatures, getPricingSettings, getPricingTiers } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Per-video editing prices: a free tier, $10 short-form and $100 longform - paid in Discord Nitro.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const [settings, tiers, features] = await Promise.all([
    getPricingSettings(),
    getPricingTiers(),
    getPricingFeatures(),
  ]);

  return (
    <>
      <PageHero
        tag="Pricing"
        title={settings.heading}
        subtitle={settings.subheading}
        ghost="$"
        description={settings.description}
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <PricingCards tiers={tiers} />

        {settings.payment_note && (
          <Reveal>
            <p className="border border-border bg-white/2 mt-0.5 p-6 text-[12px] text-mid leading-[1.8] max-md:p-5">
              {settings.payment_note}
            </p>
          </Reveal>
        )}
      </section>

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6" id="compare">
        <Reveal as="div">
          <h2 className="section-label">Compare</h2>
        </Reveal>

        <Reveal>
          <PricingTable tiers={tiers} features={features} />
        </Reveal>

        {settings.footnote && (
          <Reveal>
            <p className="text-[11px] text-dim leading-[1.8] mt-6 max-w-[560px]">{settings.footnote}</p>
          </Reveal>
        )}
      </section>
    </>
  );
}
