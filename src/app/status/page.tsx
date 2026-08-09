import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ReportOutage, type ReportableService } from "@/components/status/report-outage";
import {
  FALLBACK_SERVICES,
  HISTORY_LENGTH,
  STATE_CLASS,
  STATE_LABEL,
  STATE_SQUARE,
  UNKNOWN_SQUARE,
  groupServices,
  worstState,
  type StatusGroup,
} from "@/lib/status";
import type { StatusCheck, StatusService, StatusState } from "@/lib/types";

export const metadata: Metadata = {
  title: "Status",
  description: "Live uptime for blobbyofficial.com and everything running on it.",
  alternates: { canonical: "/status" },
  // A status page has nothing to rank for and shouldn't compete with the site
  // itself in search results.
  robots: { index: false, follow: false },
};

/**
 * Always rendered per-request. A cached status page is worse than no status
 * page — the one moment it matters is the moment it's out of date.
 */
export const dynamic = "force-dynamic";

/**
 * Enough history for every row's squares in one query. HISTORY_LENGTH per
 * service plus headroom, rather than N queries or a per-service limit
 * PostgREST can't express.
 */
const CHECK_FETCH_LIMIT = 600;

async function loadGroups(): Promise<{ groups: StatusGroup[]; configured: boolean }> {
  if (!isSupabaseConfigured()) {
    // No database yet: show the shape of the page with every row unknown
    // rather than claiming everything is fine.
    const services = FALLBACK_SERVICES.map<StatusService>((service, index) => ({
      ...service,
      group_order: 0,
      check_url: null,
      sort_order: index,
      state: "up",
      state_source: "auto",
      open_reports: 0,
      published: true,
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    }));
    return { groups: groupServices(services, new Map()), configured: false };
  }

  const supabase = await createClient();

  const { data: services } = await supabase
    .from("bo_status_services")
    .select("*")
    .eq("published", true)
    .order("group_order")
    .order("group_key")
    .order("sort_order");

  if (!services?.length) return { groups: [], configured: true };

  const { data: checks } = await supabase
    .from("bo_status_checks")
    .select("*")
    .in(
      "service_id",
      services.map((service) => service.id)
    )
    .order("checked_at", { ascending: false })
    .limit(CHECK_FETCH_LIMIT);

  const checksByService = new Map<string, StatusCheck[]>();
  for (const check of checks ?? []) {
    const bucket = checksByService.get(check.service_id);
    if (bucket) {
      if (bucket.length < HISTORY_LENGTH) bucket.push(check);
    } else {
      checksByService.set(check.service_id, [check]);
    }
  }

  return { groups: groupServices(services, checksByService), configured: true };
}

function StateTag({ state }: { state: StatusState }) {
  return <span className={STATE_CLASS[state]}>[{STATE_LABEL[state]}]</span>;
}

/**
 * The squares are decoration around the tag that follows them, so they're
 * hidden from screen readers — seventeen emoji read aloud one at a time is
 * noise, and "[working]" already carries the answer.
 */
function History({ history }: { history: (StatusState | null)[] }) {
  return (
    <span
      className="tracking-[0.05em] break-all max-md:text-[11px]"
      aria-hidden="true"
      // Emoji squares only render as colour in the system emoji font; the
      // page's mono stack would otherwise substitute glyphs unevenly.
      style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}
    >
      {history.map((state, index) => (
        <span key={index}>{state ? STATE_SQUARE[state] : UNKNOWN_SQUARE}</span>
      ))}
    </span>
  );
}

export default async function StatusPage() {
  const { groups, configured } = await loadGroups();

  const allStates = groups.flatMap((group) => group.rows.map((row) => row.service.state));
  const overall = worstState(allStates);
  const anyTrouble = allStates.some((state) => state !== "up");

  const reportable: ReportableService[] = groups.flatMap((group) =>
    group.rows.map((row) => ({
      id: row.service.id,
      label: `${group.label} — ${row.service.name}`,
    }))
  );

  return (
    <div className="min-h-screen px-10 pt-28 pb-20 max-md:px-5 max-md:pt-24">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="font-display text-[clamp(36px,7vw,72px)] leading-[0.95] tracking-[0.04em]">
            -- Status page --
          </h1>
          <p className="text-[13px] text-mid mt-3">check here if any of my websites are down</p>

          <p className="text-[13px] mt-6">
            {configured ? (
              anyTrouble ? (
                <>
                  Something&apos;s off right now — <StateTag state={overall} />
                </>
              ) : (
                <>
                  Everything&apos;s up — <StateTag state="up" />
                </>
              )
            ) : (
              <span className="text-mid">
                Checks aren&apos;t running yet, so every row below is unknown.
              </span>
            )}
          </p>
        </header>

        {groups.length === 0 ? (
          <p className="text-[13px] text-mid">Nothing is being monitored yet.</p>
        ) : (
          <div className="flex flex-col gap-12">
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`group-${group.key}`}>
                <h2 id={`group-${group.key}`} className="text-[15px] text-fg mb-5">
                  {group.url ? (
                    <a
                      href={group.url}
                      className="underline underline-offset-4 decoration-border hover:decoration-fg transition-colors"
                      rel="noreferrer"
                    >
                      {group.label}
                    </a>
                  ) : (
                    group.label
                  )}
                </h2>

                <div className="flex flex-col gap-5">
                  {group.rows.map((row) => (
                    <div key={row.service.id}>
                      <p className="text-[12px] text-mid mb-1">{row.service.name}:</p>
                      <p className="text-[14px] flex items-center gap-3 flex-wrap">
                        <History history={row.history} />
                        <StateTag state={row.service.state} />
                      </p>
                      {row.service.state === "investigating" && row.service.open_reports > 0 && (
                        <p className="text-[11px] text-dim mt-1">
                          {row.service.open_reports} open report
                          {row.service.open_reports === 1 ? "" : "s"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <ReportOutage services={reportable} disabled={!configured || reportable.length === 0} />

        <footer className="mt-14 border-t border-border pt-6 text-[11px] text-dim flex flex-wrap gap-x-6 gap-y-2">
          <span>
            🟩 working &nbsp; 🟧 degraded / investigating &nbsp; 🟥 down &nbsp; ⬜ no data
          </span>
          <Link href="https://blobbyofficial.com" className="hover:text-fg transition-colors">
            back to blobbyofficial.com
          </Link>
        </footer>
      </div>
    </div>
  );
}
