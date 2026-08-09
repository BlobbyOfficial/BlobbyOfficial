import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Store",
  description: "Free DaVinci Resolve and HandBrake presets built for TikTok-style editing.",
  alternates: { canonical: "/store" },
};

export default async function StorePage() {
  const products = await getProducts();

  return (
    <>
      <PageHero
        tag="Store"
        title="Presets that"
        subtitle="do the boring part"
        ghost="$"
        description="Every preset here solved a real problem in one of my own edits. Free to download, free to use."
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <div
          className="grid gap-0.5 max-md:gap-px"
          /* See the note on the homepage grid: min() keeps the track from
             forcing a 280px column on narrower screens. */
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 380px))" }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
