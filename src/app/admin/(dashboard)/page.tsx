import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function getCounts() {
  const supabase = await createClient();
  const [clips, products, messages, unread] = await Promise.all([
    supabase.from("portfolio_clips").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("bo_messages").select("id", { count: "exact", head: true }),
    supabase
      .from("bo_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender", "user")
      .eq("read", false),
  ]);

  return {
    clips: clips.count ?? 0,
    products: products.count ?? 0,
    messages: messages.count ?? 0,
    unread: unread.count ?? 0,
  };
}

export default async function AdminOverviewPage() {
  const counts = await getCounts();

  const cards = [
    { label: "Portfolio clips", value: counts.clips, href: "/admin/portfolio" },
    { label: "Products", value: counts.products, href: "/admin/products" },
    { label: "Unread messages", value: counts.unread, href: "/admin/messages" },
    { label: "Total messages", value: counts.messages, href: "/admin/messages" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.04em] mb-8">Overview</h1>
      <div className="grid grid-cols-4 gap-px bg-border max-md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-bg p-7 no-underline transition-colors hover:bg-white/3"
          >
            <div className="font-display text-4xl tracking-[0.04em] mb-2">{card.value}</div>
            <div className="text-[11px] text-mid tracking-[0.08em] uppercase">{card.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
