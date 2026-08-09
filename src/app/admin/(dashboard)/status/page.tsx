import { createClient } from "@/lib/supabase/server";
import { STATE_CLASS, STATE_LABEL, STATE_SQUARE } from "@/lib/status";
import type { StatusReport, StatusState } from "@/lib/types";
import { clearReports, resumeAutoState, setServiceState } from "./actions";

const STATES: StatusState[] = ["up", "degraded", "investigating", "down"];

export default async function AdminStatusPage() {
  const supabase = await createClient();

  const [{ data: services }, { data: reports }] = await Promise.all([
    supabase
      .from("bo_status_services")
      .select("*")
      .order("group_order")
      .order("group_key")
      .order("sort_order"),
    supabase
      .from("bo_status_reports")
      .select("*")
      .eq("resolved", false)
      .order("created_at", { ascending: false }),
  ]);

  const reportsByService = new Map<string, StatusReport[]>();
  for (const report of reports ?? []) {
    reportsByService.set(report.service_id, [
      ...(reportsByService.get(report.service_id) ?? []),
      report,
    ]);
  }

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.04em] mb-3">Status</h1>
      <p className="text-[12px] text-mid mb-8 max-w-prose leading-[1.8]">
        Services are pinged automatically. Setting a state here pins it by hand -
        the pinger stops touching that row until you hand it back with{" "}
        <span className="text-fg">resume auto</span>. Two or more open reports flip a
        healthy service to investigating on their own.
      </p>

      {!services?.length ? (
        <p className="text-[13px] text-mid mb-16">
          No services yet - run migration 0010 to seed them.
        </p>
      ) : (
        <div className="flex flex-col gap-4 mb-16">
          {services.map((service) => {
            const open = reportsByService.get(service.id) ?? [];
            return (
              <div key={service.id} className="border border-border p-4">
                <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <p className="text-[13px] text-fg">
                      {service.group_label} <span className="text-dim">/</span> {service.name}
                    </p>
                    <p className="text-[11px] text-dim mt-1">
                      {service.check_url ?? "no check URL - manual only"}
                    </p>
                  </div>
                  <p className="text-[12px]">
                    {STATE_SQUARE[service.state]}{" "}
                    <span className={STATE_CLASS[service.state]}>
                      [{STATE_LABEL[service.state]}]
                    </span>{" "}
                    <span className="text-dim">({service.state_source})</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {STATES.map((state) => (
                    <form key={state} action={setServiceState}>
                      <input type="hidden" name="service_id" value={service.id} />
                      <input type="hidden" name="state" value={state} />
                      <button
                        type="submit"
                        className={`text-[11px] border border-border px-2 py-1 transition-colors hover:border-border-hover ${
                          service.state === state ? "bg-white/8 text-fg" : "text-mid"
                        }`}
                      >
                        {STATE_LABEL[state]}
                      </button>
                    </form>
                  ))}

                  {service.state_source !== "auto" && (
                    <form action={resumeAutoState}>
                      <input type="hidden" name="service_id" value={service.id} />
                      <button
                        type="submit"
                        className="text-[11px] border border-border px-2 py-1 text-mid transition-colors hover:border-border-hover"
                      >
                        resume auto
                      </button>
                    </form>
                  )}
                </div>

                {open.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <p className="text-[11px] text-mid">
                        {open.length} open report{open.length === 1 ? "" : "s"}
                      </p>
                      <form action={clearReports}>
                        <input type="hidden" name="service_id" value={service.id} />
                        <button
                          type="submit"
                          className="text-[11px] border border-border px-2 py-1 text-mid transition-colors hover:border-border-hover"
                        >
                          clear reports
                        </button>
                      </form>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {open.map((report) => (
                        <li key={report.id} className="text-[11px] text-dim">
                          <span className="text-mid">
                            {new Date(report.created_at).toLocaleString()}
                          </span>{" "}
                          — {report.detail ?? "(no detail given)"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
