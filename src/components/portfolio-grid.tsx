import Image from "next/image";
import type { PortfolioClip } from "@/lib/types";

export function PortfolioGrid({ clips }: { clips: PortfolioClip[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 max-md:grid-cols-2 max-md:gap-1.5 max-[380px]:grid-cols-1">
      {clips.map((clip) => (
        <a
          key={clip.id}
          href={clip.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square bg-[#0d0d0d] border border-border overflow-hidden block no-underline transition-colors hover:border-border-hover"
        >
          <Image
            src={clip.thumbnail_url}
            alt={clip.title}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-400 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/38">
            <div className="w-[42px] h-[42px] rounded-full border border-white/70 bg-black/40 flex items-center justify-center opacity-0 scale-[0.85] transition-all duration-250 group-hover:opacity-100 group-hover:scale-100">
              <span className="block w-0 h-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-white/90 ml-[3px]" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 pt-[22px] pb-2.5 px-2.5 bg-linear-to-t from-black/75 to-transparent text-[9px] tracking-[0.12em] uppercase text-white/55 pointer-events-none">
            Watch clip
          </div>
        </a>
      ))}
    </div>
  );
}
