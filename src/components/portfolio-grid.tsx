import type { PortfolioCategory, PortfolioClip } from "@/lib/types";

/**
 * Clips are local files under /public/media/videos, so there are no separate
 * thumbnail images: the poster frame is grabbed from the video itself by
 * pointing the browser at the first frame with a media fragment (`#t=`) and
 * letting it preload just the metadata.
 */
function toPosterFrameSrc(url: string): string {
  return url.includes("#") ? url : `${url}#t=0.1`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-fg" : "text-white/25"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ClipGrid({ clips }: { clips: PortfolioClip[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 max-md:grid-cols-2 max-md:gap-1.5 max-[380px]:grid-cols-1">
      {clips.map((clip) => {
        const hasReview = clip.review_rating != null || clip.review_comment || clip.review_discord_username;

        return (
          <div
            key={clip.id}
            className="group relative aspect-square bg-[#0d0d0d] border border-border overflow-hidden"
          >
            <video
              src={toPosterFrameSrc(clip.video_url)}
              title={clip.title}
              controls
              playsInline
              muted
              loop
              preload="metadata"
              /* `contain`, not `cover`: these are 9:16 TikTok edits in a
                 square tile, so cover was cropping the top and bottom off
                 the actual work. */
              className="absolute inset-0 w-full h-full object-contain bg-black"
            />

            {hasReview && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/85 px-5 text-center opacity-0 pointer-events-none transition-opacity duration-250 group-hover:opacity-100">
                {clip.review_rating != null && <Stars rating={clip.review_rating} />}
                {clip.review_comment && (
                  <p className="text-[12px] leading-[1.6] text-white/90 max-w-[85%]">
                    &ldquo;{clip.review_comment}&rdquo;
                  </p>
                )}
                {clip.review_discord_username && (
                  <p className="text-[10px] tracking-[0.1em] uppercase text-white/50">
                    - {clip.review_discord_username}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const SECTIONS: { key: PortfolioCategory; label: string }[] = [
  { key: "tiktok", label: "TikTok" },
  { key: "clients", label: "Clients" },
];

export function PortfolioGrid({
  clips,
  hiddenSections,
}: {
  clips: PortfolioClip[];
  hiddenSections?: Set<PortfolioCategory>;
}) {
  return (
    <div className="flex flex-col gap-10">
      {SECTIONS.map(({ key, label }) => {
        if (hiddenSections?.has(key)) return null;

        const sectionClips = clips.filter((clip) => clip.category === key);
        if (sectionClips.length === 0) return null;

        return (
          <div key={key}>
            <div className="text-[10px] text-mid tracking-[0.14em] uppercase mb-3">{label}</div>
            <ClipGrid clips={sectionClips} />
          </div>
        );
      })}
    </div>
  );
}
