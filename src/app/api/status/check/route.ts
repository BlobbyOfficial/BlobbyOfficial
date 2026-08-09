import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { CHECK_TIMEOUT_MS, DEGRADED_AFTER_MS, HISTORY_LENGTH } from "@/lib/status";
import type { Database, StatusCheck, StatusService } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Keep a little more history than the page draws, for context when debugging. */
const HISTORY_KEEP = HISTORY_LENGTH * 4;

/**
 * Pings every monitored service and records the result.
 *
 * Writes go through the service-role key rather than the anon key: the whole
 * point of the RLS in migration 0010 is that no visitor can write check
 * history or move a service's state, so the thing that legitimately does both
 * has to sit outside RLS. That key must never be exposed to the browser —
 * it's read from a non-NEXT_PUBLIC_ variable for exactly that reason.
 *
 * Called by Vercel Cron (see vercel.json). Vercel signs its cron requests with
 * CRON_SECRET; when that's set we require it, so the endpoint can't be used by
 * anyone else to hammer the monitored sites.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Status checks need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: services, error } = await supabase
    .from("bo_status_services")
    .select("*")
    .eq("published", true);

  if (error) {
    console.error("Status check: failed to load services:", error);
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }

  const checkable = (services ?? []).filter((service) => service.check_url);
  const results = await Promise.all(checkable.map((service) => probe(service)));

  if (results.length > 0) {
    const { error: insertError } = await supabase.from("bo_status_checks").insert(results);
    if (insertError) console.error("Status check: failed to record results:", insertError);
  }

  // A service the admin pinned by hand, or one currently escalated by
  // reports, keeps the state it was given — a passing ping doesn't prove the
  // thing people are reporting is fixed, only that the URL answers.
  await Promise.all(
    results
      .map((result, index) => ({ result, service: checkable[index] }))
      .filter(({ service }) => service.state_source === "auto")
      .map(({ result, service }) =>
        supabase
          .from("bo_status_services")
          .update({ state: result.state, updated_at: new Date().toISOString() })
          .eq("id", service.id)
          .eq("state_source", "auto")
      )
  );

  await prune(supabase, checkable);

  return NextResponse.json({
    checked: results.length,
    at: new Date().toISOString(),
    results: results.map((result, index) => ({
      service: `${checkable[index].group_label} / ${checkable[index].name}`,
      state: result.state,
      status_code: result.status_code,
      latency_ms: result.latency_ms,
    })),
  });
}

type Probe = Omit<StatusCheck, "id" | "checked_at">;

async function probe(service: StatusService): Promise<Probe> {
  const started = Date.now();

  try {
    const response = await fetch(service.check_url!, {
      // HEAD is refused or mishandled by enough hosts that it produces false
      // reds; a GET that ignores the body is the reliable check.
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      headers: { "user-agent": "blobbyofficial-status/1.0" },
    });

    const latency = Date.now() - started;
    return {
      service_id: service.id,
      state: !response.ok ? "down" : latency > DEGRADED_AFTER_MS ? "degraded" : "up",
      status_code: response.status,
      latency_ms: latency,
    };
  } catch {
    // Timeout, DNS failure, TLS failure, connection refused — from a
    // visitor's point of view these are all just "it didn't load".
    return {
      service_id: service.id,
      state: "down",
      status_code: null,
      latency_ms: Date.now() - started,
    };
  }
}

/** Drops history past HISTORY_KEEP so the table doesn't grow without bound. */
async function prune(
  supabase: ReturnType<typeof createClient<Database>>,
  services: StatusService[]
) {
  await Promise.all(
    services.map(async (service) => {
      const { data: oldest } = await supabase
        .from("bo_status_checks")
        .select("checked_at")
        .eq("service_id", service.id)
        .order("checked_at", { ascending: false })
        .range(HISTORY_KEEP, HISTORY_KEEP);

      const cutoff = oldest?.[0]?.checked_at;
      if (!cutoff) return;

      await supabase
        .from("bo_status_checks")
        .delete()
        .eq("service_id", service.id)
        .lte("checked_at", cutoff);
    })
  );
}
