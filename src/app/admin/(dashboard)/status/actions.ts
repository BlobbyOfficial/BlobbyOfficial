"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import type { StatusState } from "@/lib/types";

const STATES: StatusState[] = ["up", "degraded", "investigating", "down"];

function revalidateStatusPages() {
  revalidatePath("/admin/status");
  revalidatePath("/status");
}

/**
 * Pins a service's state by hand. `state_source` moves to 'manual', which is
 * what stops the cron pinger (and the report threshold) overwriting the call
 * the admin just made — see migration 0010.
 */
export async function setServiceState(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("service_id") ?? "");
  const state = String(formData.get("state") ?? "");
  if (!id || !STATES.includes(state as StatusState)) return;

  await supabase
    .from("bo_status_services")
    .update({
      state: state as StatusState,
      state_source: "manual",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidateStatusPages();
}

/** Hands the service back to the pinger, which will correct it on its next run. */
export async function resumeAutoState(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("service_id") ?? "");
  if (!id) return;

  await supabase
    .from("bo_status_services")
    .update({ state_source: "auto", updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidateStatusPages();
}

/**
 * Closes every open report on a service. The trigger recalculates the count
 * and, if the service was only orange because of those reports, drops it back
 * to green.
 */
export async function clearReports(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("service_id") ?? "");
  if (!id) return;

  await supabase
    .from("bo_status_reports")
    .update({ resolved: true })
    .eq("service_id", id)
    .eq("resolved", false);

  revalidateStatusPages();
}
