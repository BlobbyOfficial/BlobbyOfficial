import type { PortfolioCategory, PortfolioClip } from "@/lib/types";

function toDriveEmbedUrl(url: string): string {
  const match = url.match(/\/d\/([^/]+)/);
  if (!match) return url;
  return `https://drive.google.com/file/d/${match[1]}/preview`;
}

function ClipGrid({ clips }: { clips: PortfolioClip[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 max-md:grid-cols-2 max-md:gap-1.5 max-[380px]:grid-cols-1">
      {clips.map((clip) => (
        <div
          key={clip.id}
          className="relative aspect-square bg-[#0d0d0d] border border-border overflow-hidden"
        >
          <iframe
            src={toDriveEmbedUrl(clip.video_url)}
            title={clip.title}
            allow="autoplay"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      ))}
    </div>
  );
}

const SECTIONS: { key: PortfolioCategory; label: string }[] = [
  { key: "tiktok", label: "TikTok" },
  { key: "clients", label: "Clients" },
];

export function PortfolioGrid({ clips }: { clips: PortfolioClip[] }) {
  return (
    <div className="flex flex-col gap-10">
      {SECTIONS.map(({ key, label }) => {
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
