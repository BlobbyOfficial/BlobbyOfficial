import { createClient } from "@/lib/supabase/server";
import type { PricingFeature, PricingTier } from "@/lib/types";
import {
  createPricingFeature,
  createPricingTier,
  deletePricingFeature,
  deletePricingTier,
  savePricingSettings,
  updatePricingFeature,
  updatePricingTier,
} from "./actions";

const inputClass =
  "bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none transition-colors focus:border-border-hover w-full";
const labelClass = "text-[9px] tracking-[0.14em] uppercase text-mid";

export default async function AdminPricingPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: tiers }, { data: features }] = await Promise.all([
    supabase.from("pricing_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("pricing_tiers").select("*").order("sort_order", { ascending: true }),
    supabase.from("pricing_features").select("*").order("sort_order", { ascending: true }),
  ]);

  // Feature values are keyed by tier slug, so the value inputs below are
  // generated from whatever tiers currently exist — add a tier and every
  // feature row grows a matching field on the next render.
  const tierList: PricingTier[] = tiers ?? [];
  const featureList: PricingFeature[] = features ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.04em] mb-8">Pricing</h1>

      {/* ── PAGE COPY ─────────────────────────────────────────────────── */}
      <h2 className="text-[11px] tracking-[0.14em] uppercase text-mid mb-3">Page copy</h2>
      <form action={savePricingSettings} className="border border-border p-6 mb-10 grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Heading</label>
          <input name="heading" defaultValue={settings?.heading ?? "Pricing"} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Subheading</label>
          <input name="subheading" defaultValue={settings?.subheading ?? "per video"} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Footnote</label>
          <input name="footnote" defaultValue={settings?.footnote ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5 col-span-3 max-md:col-span-1">
          <label className={labelClass}>Description (under the page title)</label>
          <textarea name="description" rows={2} defaultValue={settings?.description ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5 col-span-3 max-md:col-span-1">
          <label className={labelClass}>Payment note (Discord Nitro terms)</label>
          <textarea name="payment_note" rows={2} defaultValue={settings?.payment_note ?? ""} className={inputClass} />
        </div>
        <div className="col-span-3 max-md:col-span-1">
          <button type="submit" className="btn-primary">
            Save page copy
          </button>
        </div>
      </form>

      {/* ── TIERS ─────────────────────────────────────────────────────── */}
      <h2 className="text-[11px] tracking-[0.14em] uppercase text-mid mb-3">Tiers</h2>
      <form action={createPricingTier} className="border border-border p-6 mb-6 grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Slug (used by feature values)</label>
          <input name="slug" required className={inputClass} placeholder="longform" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Name</label>
          <input name="name" required className={inputClass} placeholder="Longform" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Price label</label>
          <input name="price_label" defaultValue="$0" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Price note</label>
          <input name="price_note" className={inputClass} placeholder="1 year of Discord Nitro" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>CTA label</label>
          <input name="cta_label" defaultValue="Get in touch" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>CTA URL</label>
          <input name="cta_url" defaultValue="/contact" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5 col-span-3 max-md:col-span-1">
          <label className={labelClass}>Description</label>
          <textarea name="description" rows={2} className={inputClass} />
        </div>
        <div className="flex items-center gap-3 col-span-3 max-md:col-span-1 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Sort order</label>
            <input name="sort_order" type="number" defaultValue={tierList.length} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-mid mt-5">
            <input name="highlighted" type="checkbox" /> Highlighted
          </label>
          <label className="flex items-center gap-2 text-[11px] text-mid mt-5">
            <input name="published" type="checkbox" defaultChecked /> Published
          </label>
          <button type="submit" className="btn-primary shrink-0 mt-5">
            Add tier
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3 mb-12">
        {tierList.map((tier) => (
          <form
            key={tier.id}
            action={updatePricingTier.bind(null, tier.id)}
            className="border border-border p-6 grid grid-cols-3 gap-4 max-md:grid-cols-1"
          >
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Slug</label>
              <input name="slug" defaultValue={tier.slug} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Name</label>
              <input name="name" defaultValue={tier.name} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Price label</label>
              <input name="price_label" defaultValue={tier.price_label} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Price note</label>
              <input name="price_note" defaultValue={tier.price_note} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>CTA label</label>
              <input name="cta_label" defaultValue={tier.cta_label} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>CTA URL</label>
              <input name="cta_url" defaultValue={tier.cta_url} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 col-span-3 max-md:col-span-1">
              <label className={labelClass}>Description</label>
              <textarea name="description" rows={2} defaultValue={tier.description} className={inputClass} />
            </div>
            <div className="flex items-center gap-3 col-span-3 max-md:col-span-1 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Sort order</label>
                <input name="sort_order" type="number" defaultValue={tier.sort_order} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-mid mt-5">
                <input name="highlighted" type="checkbox" defaultChecked={tier.highlighted} /> Highlighted
              </label>
              <label className="flex items-center gap-2 text-[11px] text-mid mt-5">
                <input name="published" type="checkbox" defaultChecked={tier.published} /> Published
              </label>
              <button type="submit" className="btn-ghost mt-5">
                Save
              </button>
              <button
                type="submit"
                formAction={deletePricingTier.bind(null, tier.id)}
                className="text-[11px] text-red-400 uppercase tracking-[0.1em] mt-5"
              >
                Delete
              </button>
            </div>
          </form>
        ))}
        {tierList.length === 0 && (
          <p className="text-[12px] text-mid">
            No tiers yet - add one above (or run the 0010_pricing migration to load the defaults).
          </p>
        )}
      </div>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <h2 className="text-[11px] tracking-[0.14em] uppercase text-mid mb-1">Comparison rows</h2>
      <p className="text-[11px] text-dim mb-3 max-w-[560px] leading-[1.7]">
        One row per thing you compare. Type <code className="text-fg">yes</code> or{" "}
        <code className="text-fg">no</code> for a tick or cross, leave a value blank for a dash, or write
        anything else (&ldquo;30 seconds&rdquo;) to print it as-is.
      </p>

      <form action={createPricingFeature} className="border border-border p-6 mb-6 grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Label</label>
          <input name="label" required className={inputClass} placeholder="Max length" />
        </div>
        <div className="flex flex-col gap-1.5 col-span-2 max-md:col-span-1">
          <label className={labelClass}>Note (optional)</label>
          <input name="note" className={inputClass} placeholder="Length of the finished video" />
        </div>
        {tierList.map((tier) => (
          <div key={tier.id} className="flex flex-col gap-1.5">
            <label className={labelClass}>{tier.name} value</label>
            <input name={`value:${tier.slug}`} className={inputClass} placeholder="yes / no / 30 seconds" />
          </div>
        ))}
        <div className="flex items-center gap-3 col-span-3 max-md:col-span-1 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Sort order</label>
            <input name="sort_order" type="number" defaultValue={featureList.length} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-mid mt-5">
            <input name="published" type="checkbox" defaultChecked /> Published
          </label>
          <button type="submit" className="btn-primary shrink-0 mt-5">
            Add row
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {featureList.map((feature) => (
          <form
            key={feature.id}
            action={updatePricingFeature.bind(null, feature.id)}
            className="border border-border p-6 grid grid-cols-3 gap-4 max-md:grid-cols-1"
          >
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Label</label>
              <input name="label" defaultValue={feature.label} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2 max-md:col-span-1">
              <label className={labelClass}>Note</label>
              <input name="note" defaultValue={feature.note} className={inputClass} />
            </div>
            {tierList.map((tier) => (
              <div key={tier.id} className="flex flex-col gap-1.5">
                <label className={labelClass}>{tier.name} value</label>
                <input
                  name={`value:${tier.slug}`}
                  defaultValue={feature.values?.[tier.slug] ?? ""}
                  className={inputClass}
                  placeholder="yes / no / 30 seconds"
                />
              </div>
            ))}
            <div className="flex items-center gap-3 col-span-3 max-md:col-span-1 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Sort order</label>
                <input name="sort_order" type="number" defaultValue={feature.sort_order} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-mid mt-5">
                <input name="published" type="checkbox" defaultChecked={feature.published} /> Published
              </label>
              <button type="submit" className="btn-ghost mt-5">
                Save
              </button>
              <button
                type="submit"
                formAction={deletePricingFeature.bind(null, feature.id)}
                className="text-[11px] text-red-400 uppercase tracking-[0.1em] mt-5"
              >
                Delete
              </button>
            </div>
          </form>
        ))}
        {featureList.length === 0 && <p className="text-[12px] text-mid">No comparison rows yet.</p>}
      </div>
    </div>
  );
}
