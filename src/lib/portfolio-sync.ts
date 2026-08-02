import { createClient } from "@/lib/supabase/server";
import { VIDEO_MANIFEST } from "@/lib/video-manifest";
import type { PortfolioClip } from "@/lib/types";

export type SyncResult = {
  added: number;
  missing: PortfolioClip[];
  error: string | null;
};

/**
 * Adds any video sitting in public/media/videos that isn't in the database
 * yet as an **unpublished (private)** clip, using its filename as the title.
 *
 * This is what replaced the old "paste a Google Drive link" form: clips are
 * never added by hand from the dashboard, they show up on their own and the
 * admin then edits the title/review/visibility.
 *
 * Rows are never updated or deleted here — once a clip exists, whatever the
 * admin typed into the dashboard is the source of truth. Clips whose file no
 * longer exists are reported back as `missing` so they can be cleaned up.
 */
export async function syncPortfolioVideos(): Promise<SyncResult> {
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("portfolio_clips")
    .select("*");

  if (readError) {
    return { added: 0, missing: [], error: readError.message };
  }

  const known = new Set((existing ?? []).map((clip) => clip.video_url));
  const onDisk = new Set(VIDEO_MANIFEST.map((entry) => entry.video_url));

  const toInsert = VIDEO_MANIFEST.filter((entry) => !known.has(entry.video_url)).map((entry) => ({
    title: entry.title,
    category: entry.category,
    video_url: entry.video_url,
    sort_order: entry.sort_order,
    published: false,
    review_rating: null,
    review_comment: null,
    review_discord_username: null,
  }));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("portfolio_clips").insert(toInsert);
    if (insertError) {
      return { added: 0, missing: [], error: insertError.message };
    }
  }

  return {
    added: toInsert.length,
    missing: (existing ?? []).filter((clip) => !onDisk.has(clip.video_url)),
    error: null,
  };
}
