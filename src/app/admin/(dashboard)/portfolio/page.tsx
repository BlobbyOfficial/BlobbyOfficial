import { createClient } from "@/lib/supabase/server";
import { createClip, updateClip, deleteClip } from "./actions";

const inputClass =
  "bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none transition-colors focus:border-border-hover w-full";
const labelClass = "text-[9px] tracking-[0.14em] uppercase text-mid";

export default async function AdminPortfolioPage() {
  const supabase = await createClient();
  const { data: clips } = await supabase
    .from("portfolio_clips")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.04em] mb-8">Portfolio clips</h1>

      <form action={createClip} className="border border-border p-6 mb-10 grid grid-cols-5 gap-4 items-end max-md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Title</label>
          <input name="title" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Category</label>
          <select name="category" defaultValue="tiktok" className={inputClass}>
            <option value="tiktok">TikTok</option>
            <option value="clients">Clients</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Video URL (Google Drive)</label>
          <input name="video_url" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Sort order</label>
          <input name="sort_order" type="number" defaultValue={0} className={inputClass} />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] text-mid">
            <input name="published" type="checkbox" defaultChecked /> Published
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Review rating (1-5, clients only)</label>
          <select name="review_rating" defaultValue="" className={inputClass}>
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
          <input name="review_comment" className={inputClass} placeholder="What the client said" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Client Discord username</label>
          <input name="review_discord_username" className={inputClass} placeholder="username" />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary shrink-0">
            Add
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {(clips ?? []).map((clip) => (
          <form
            key={clip.id}
            action={updateClip.bind(null, clip.id)}
            className="border border-border p-6 grid grid-cols-5 gap-4 items-end max-md:grid-cols-2"
          >
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
              <label className={labelClass}>Video URL (Google Drive)</label>
              <input name="video_url" defaultValue={clip.video_url} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Sort order</label>
              <input name="sort_order" type="number" defaultValue={clip.sort_order} className={inputClass} />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-[11px] text-mid">
                <input name="published" type="checkbox" defaultChecked={clip.published} /> Published
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
          <p className="text-[12px] text-mid">No portfolio clips yet — add one above.</p>
        )}
      </div>
    </div>
  );
}
