import { PORTFOLIO_STATS } from "@/lib/content";

export function StatsRow() {
  return (
    <div className="grid grid-cols-3 border border-border mb-20 max-md:grid-cols-1 max-md:mb-12">
      {PORTFOLIO_STATS.map((stat, i) => (
        <div
          key={stat.label}
          className={`p-9 px-8 relative backdrop-blur-sm bg-white/1.5 max-md:p-7 max-md:px-6 ${
            i !== PORTFOLIO_STATS.length - 1
              ? "border-r border-border max-md:border-r-0 max-md:border-b"
              : ""
          } max-md:last:border-b-0`}
        >
          <div className="flex items-center gap-2 text-[9px] tracking-[0.22em] uppercase text-mid mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-fg inline-block" />
            {stat.platform}
          </div>
          <div className="font-display text-5xl tracking-[0.04em] leading-none mb-1 max-md:text-4xl">
            {stat.value}
          </div>
          <div className="text-[11px] text-dim">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
