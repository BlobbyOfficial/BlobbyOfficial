"use server";

import { headers } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isRateLimited } from "@/lib/rate-limit";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  // Honeypot field — real users never fill a visually-hidden input.
  const honeypot = String(formData.get("company") ?? "");

  if (honeypot) {
    return { status: "success", message: "Thanks — I'll get back to you soon." };
  }

  if (!name || !email || !message) {
    return { status: "error", message: "Please fill in every field." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "That email address doesn't look right." };
  }
  if (message.length > 4000) {
    return { status: "error", message: "That message is too long — try trimming it down." };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return { status: "error", message: "Too many messages sent — please try again in a minute." };
  }

  const verified = await verifyTurnstileToken(turnstileToken, ip);
  if (!verified) {
    return { status: "error", message: "Verification failed — please try again." };
  }

  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured — contact message was not persisted:", {
      name,
      email,
      message,
    });
    return {
      status: "success",
      message: "Thanks — I'll get back to you soon.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({ name, email, message });

  if (error) {
    console.error("Failed to save contact message:", error);
    return { status: "error", message: "Something went wrong on our end — please try again." };
  }

  return { status: "success", message: "Thanks — I'll get back to you soon." };
}
