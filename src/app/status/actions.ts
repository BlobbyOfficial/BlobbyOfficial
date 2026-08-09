"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

export type ReportState = { error: string | null; ok: boolean };

/**
 * Reports are counted per person, so a report needs some stable identifier —
 * but keeping raw IPs for a page anyone can hit would be collecting personal
 * data to answer a yes/no question. Hashing with a server-side salt keeps the
 * "same person?" comparison working while storing nothing that can be read
 * back into an address.
 */
async function reporterHash() {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const salt = process.env.STATUS_REPORT_SALT ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function reportOutage(
  _prevState: ReportState,
  formData: FormData
): Promise<ReportState> {
  if (!isSupabaseConfigured()) {
    return { error: "Outage reports aren't configured yet.", ok: false };
  }

  const serviceId = String(formData.get("service_id") ?? "").trim();
  if (!serviceId) return { error: "Pick which thing is broken first.", ok: false };

  const detail = String(formData.get("detail") ?? "").trim();
  if (detail.length > 500) {
    return { error: "That's a bit long - 500 characters max.", ok: false };
  }

  const hash = await reporterHash();
  if (isRateLimited(`status-report:${hash}`)) {
    return { error: "Too many reports - please try again in a minute.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bo_status_reports").insert({
    service_id: serviceId,
    detail: detail || null,
    reporter_hash: hash,
  });

  if (error) {
    // 23505 is the partial unique index in migration 0010: one open report per
    // person per service. Not really a failure from the reporter's side —
    // their report is already counted.
    if (error.code === "23505") {
      return { error: "You've already reported this one - it's counted, thanks.", ok: false };
    }
    console.error("Failed to file status report:", error);
    return { error: "Something went wrong on our end - please try again.", ok: false };
  }

  revalidatePath("/status");
  return { error: null, ok: true };
}
