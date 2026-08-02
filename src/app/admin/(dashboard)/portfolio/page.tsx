import { createClient } from "@/lib/supabase/server";
import { syncPortfolioVideos } from "@/lib/portfolio-sync";
import { syncClips, updateClip, deleteClip, toggleSectionVisibility } from "./actions";

const inputClass =
  "bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none transition-colors focus:border-border-hover w-full";
const labelClass = "text-[9px] tracking-[0.14em] uppercase text-mid";

const SECTIONS = [
  { key: "tiktok", label: "TikTok" },
  { key: "clients", label: "Clients" },
] as const;

export default async function AdminPortfolioPage() {
  // Videos are picked up automatically: anything new in public/media/videos is
  // added as a private clip the moment this page is opened. Nothing is
  // uploaded or linked by hand.
  const sync = await syncPortfolioVideos();

  const supabase = await createClient();
  const [{ data: clips }, { data: visibility }] = await Promise.all([
    supabase.from("portfolio_clips").select("*").order("sort_order", { ascending: true }),
    supabase.from("portfolio_section_visibility").select("*"),
  ]);

  const hiddenSections = new Set((visibility ?? []).filter((row) => row.hidden).map((row) => row.category));
  const missingUrls = new Set(sync.missing.map((clip) => clip.video_url));

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.04em] mb-3">Portfolio clips</h1>
      <p className="text-[12px] text-mid leading-[1.8] mb-8 max-w-2xl">
        Clips are added automatically from{" "}
        <code className="text-fg">public/media/videos/TikTok</code> and{" "}
        <code className="text-fg">public/media/videos/clients</code>, using the filename as the
        title, and they start out <strong className="text-fg">private</strong>. Rename them, add a
        review, and tick Published below to put them on the site.
      </p>

      <div className="flex items-center gap-4 flex-wrap mb-10">
        {SECTIONS.map(({ key, label }) => {
          const hidden = hiddenSections.has(key);
          return (
            <form key={key} action={toggleSectionVisibility.bind(null, key, !hidden)}>
              <button type="submit" className={hidden ? "btn-ghost" : "btn-primary"}>
                {label}: {hidden ? "Hidden" : "Visible"} - click to {hidden ? "unhide" : "hide"}
              </button>
            </form>
          );
        })}

        <form action={syncClips}>
          <button type="submit" className="btn-ghost">
            Rescan video folders
          </button>
        </form>
      </div>

      {sync.error && (
        <p className="text-[12px] text-red-400 mb-6" role="alert">
          Couldn&apos;t scan the video folders: {sync.error}
        </p>
      )}
      {sync.added > 0 && (
        <p className="text-[12px] text-mid mb-6">
          Added {sync.added} new clip{sync.added === 1 ? "" : "s"} as private.
        </p>
      )}
      {sync.missing.length > 0 && (
        <p className="text-[12px] text-yellow-400/80 mb-6">
          {sync.missing.length} clip{sync.missing.length === 1 ? "" : "s"} below no longer have a
          matching video file - delete them, or put the file back.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {(clips ?? []).map((clip) => (
          <form
            key={clip.id}
            action={updateClip.bind(null, clip.id)}
            className="border border-border p-6 grid grid-cols-5 gap-4 items-end max-md:grid-cols-2"
          >
            <div className="row-start-1 col-span-5 max-md:col-span-2 flex items-center gap-4">
              <video
                src={`${clip.video_url}#t=0.1`}
                muted
                playsInline
                preload="metadata"
                controls
                className="h-24 w-24 object-cover bg-black border border-border shrink-0"
              />
              <div className="min-w-0">
                <div className={labelClass}>Video file</div>
                <p className="text-[12px] text-fg break-all">{decodeURI(clip.video_url)}</p>
                {missingUrls.has(clip.video_url) && (
                  <p className="text-[11px] text-yellow-400/80 mt-1">File not found in the videos folder.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Title</label>
              <input name="title" defaultValue={clip.title} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Category</label>
              <select name="category" defaultValue={clip.category} className={inputClass}>
                <option value="tiktok">TikTok</option>
                <option value="clients">Clients</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Sort order</label>
              <input name="sort_order" type="number" defaultValue={clip.sort_order} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Visibility</label>
              <label className="flex items-center gap-2 text-[11px] text-mid py-2">
                <input name="published" type="checkbox" defaultChecked={clip.published} />
                {clip.published ? "Public" : "Private"}
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Review rating (clients only)</label>
              <select name="review_rating" defaultValue={clip.review_rating ?? ""} className={inputClass}>
                <option value="">No review</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className={labelClass}>Review comment</label>
              <input
                name="review_comment"
                defaultValue={clip.review_comment ?? ""}
                className={inputClass}
                placeholder="What the client said"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Client Discord username</label>
              <input
                name="review_discord_username"
                defaultValue={clip.review_discord_username ?? ""}
                className={inputClass}
                placeholder="username"
              />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-ghost">
                Save
              </button>
              <button
                type="submit"
                formAction={deleteClip.bind(null, clip.id)}
                className="text-[11px] text-red-400 uppercase tracking-[0.1em]"
              >
                Delete
              </button>
            </div>
          </form>
        ))}
        {(!clips || clips.length === 0) && (
          <p className="text-[12px] text-mid">
            No clips yet - drop .mp4 files into public/media/videos and they&apos;ll appear here.
          </p>
        )}
      </div>
    </div>
  );
}
