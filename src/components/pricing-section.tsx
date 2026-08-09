import Link from "next/link";
import type { PricingFeature, PricingTier } from "@/lib/types";
import { Reveal } from "@/components/reveal";

/**
 * Feature values are free text so the admin can write "90 seconds" or
 * "Up to 4K", but the yes/no rows are common enough that typing them out
 * every time would be noise — these words become marks instead. Everything
 * else prints exactly as it was entered.
 */
const YES = ["yes", "y", "true", "✅", "✔", "included"];
const NO = ["no", "n", "false", "❌", "✖", "none"];

function FeatureValue({ value }: { value: string }) {
  const key = value.trim().toLowerCase();

  // A tier the admin simply hasn't filled in yet is not the same as a "no",
  // so it gets a neutral dash rather than a cross.
  if (key === "" || key === "-" || key === "--") {
    return (
      <span className="text-[12px] text-dim" aria-label="Not applicable">
        &ndash;
      </span>
    );
  }

  if (YES.includes(key)) {
    return (
      <span className="text-[15px] text-emerald-400" title="Included">
        ✅<span className="sr-only">Included</span>
      </span>
    );
  }

  if (NO.includes(key)) {
    return (
      <span className="text-[15px] text-red-400/80" title="Not included">
        ❌<span className="sr-only">Not included</span>
      </span>
    );
  }

  return <span className="text-[12px] text-fg">{value}</span>;
}

function TierCta({ tier }: { tier: PricingTier }) {
  const label = tier.cta_label || "Get in touch";
  const href = tier.cta_url || "/contact";
  const className = tier.highlighted ? "btn-primary w-full text-center" : "btn-ghost w-full text-center";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
    </a>
  );
}

export function PricingCards({ tiers }: { tiers: PricingTier[] }) {
  if (tiers.length === 0) return null;

  return (
    <div
      className="grid gap-0.5 max-md:gap-px"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(260px, 100%), 1fr))` }}
    >
      {tiers.map((tier) => (
        <Reveal
          key={tier.id}
          className={`bg-card border p-8 flex flex-col gap-4 transition-colors max-md:p-6 ${
            tier.highlighted ? "border-fg/40" : "border-border hover:border-border-hover"
          }`}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[26px] tracking-[0.06em]">{tier.name}</h3>
            {tier.highlighted && (
              <span className="text-[9px] tracking-[0.2em] uppercase text-mid border border-border px-2 py-1">
                Most picked
              </span>
            )}
          </div>

          <div>
            <p className="font-display text-[44px] leading-none tracking-[0.02em]">{tier.price_label}</p>
            {tier.price_note && (
              <p className="text-[10px] tracking-[0.14em] uppercase text-mid mt-2.5">{tier.price_note}</p>
            )}
          </div>

          {tier.description && (
            <p className="text-[12px] text-mid leading-[1.75] flex-1">{tier.description}</p>
          )}

          <TierCta tier={tier} />
        </Reveal>
      ))}
    </div>
  );
}

export function PricingTable({
  tiers,
  features,
}: {
  tiers: PricingTier[];
  features: PricingFeature[];
}) {
  if (tiers.length === 0 || features.length === 0) return null;

  return (
    /* The table keeps its own horizontal scroll so a long tier list never
       makes the whole page scroll sideways on a phone. */
    <div className="border border-border overflow-x-auto">
      <table className="w-full border-collapse min-w-[560px]">
        <caption className="sr-only">Comparison of what each pricing tier includes</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="text-left text-[9px] tracking-[0.2em] uppercase text-mid font-normal p-4">
              What you get
            </th>
            {tiers.map((tier) => (
              <th
                key={tier.id}
                scope="col"
                className="p-4 text-center font-normal border-l border-border align-bottom"
              >
                <span className="block font-display text-[18px] tracking-[0.06em] text-fg">{tier.name}</span>
                <span className="block text-[11px] text-mid mt-1">{tier.price_label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.id} className="border-b border-border last:border-b-0">
              <th scope="row" className="text-left p-4 font-normal align-top">
                <span className="block text-[12px] text-fg">{feature.label}</span>
                {feature.note && <span className="block text-[10px] text-dim mt-1">{feature.note}</span>}
              </th>
              {tiers.map((tier) => (
                <td key={tier.id} className="p-4 text-center border-l border-border align-middle">
                  <FeatureValue value={feature.values?.[tier.slug] ?? ""} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
