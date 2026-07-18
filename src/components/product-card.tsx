import Image from "next/image";
import type { Product } from "@/lib/types";
import { Reveal } from "@/components/reveal";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Reveal className="bg-card border border-border transition-[border-color,transform] duration-300 relative overflow-hidden hover:border-border-hover hover:-translate-y-0.5">
      <a
        href={product.buy_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full aspect-video bg-[#0a0a0a] relative overflow-hidden"
      >
        <Image
          src={product.preview_image_url}
          alt={`${product.name} preview`}
          fill
          sizes="(max-width: 768px) 100vw, 380px"
          className="object-cover"
        />
        <span className="absolute bottom-3.5 left-3.5 bg-black/80 text-[9px] tracking-[0.2em] uppercase px-2 py-1 text-mid border border-border">
          DaVinci Resolve Preset
        </span>
      </a>

      <div className="p-6 pt-6 pb-[26px] bg-white/2 backdrop-blur-md border-t border-border">
        <h3 className="font-display text-[28px] tracking-[0.06em] mb-1.5">{product.name}</h3>
        <p className="text-[11px] text-mid leading-[1.7] mb-5">{product.description}</p>

        <div className="flex gap-1.5 flex-wrap mb-5">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] tracking-[0.15em] uppercase border border-border px-2 py-[3px] text-dim"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="font-serif text-[22px] tracking-[0.04em]">
            <small className="block font-mono text-[9px] text-mid tracking-[0.15em] mb-0.5 not-italic">
              From
            </small>
            {product.price_label}
          </div>
          <a
            href={product.buy_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-fg text-bg px-5 py-2.5 font-mono text-[10px] tracking-[0.14em] uppercase font-medium transition-opacity hover:opacity-80"
          >
            Get it
          </a>
        </div>
      </div>
    </Reveal>
  );
}
