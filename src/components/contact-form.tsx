"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitContactForm, type ContactFormState } from "@/app/contact/actions";
import { TurnstileWidget } from "@/components/turnstile-widget";

const initialState: ContactFormState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary self-start" disabled={pending}>
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, initialState);

  if (state.status === "success") {
    return (
      <div className="border border-border p-9 max-md:p-6">
        <p className="font-display text-2xl tracking-[0.04em] mb-2">Message sent</p>
        <p className="text-[13px] text-mid leading-[1.7]">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6 max-w-lg">
      {/* Honeypot — hidden from real users, catches simple bots that fill every field. */}
      <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input type="text" id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-[10px] tracking-[0.14em] uppercase text-mid">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={200}
          className="bg-transparent border border-border px-4 py-3 text-[13px] text-fg outline-none transition-colors focus:border-border-hover"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-[10px] tracking-[0.14em] uppercase text-mid">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          className="bg-transparent border border-border px-4 py-3 text-[13px] text-fg outline-none transition-colors focus:border-border-hover"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-[10px] tracking-[0.14em] uppercase text-mid">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          className="bg-transparent border border-border px-4 py-3 text-[13px] text-fg outline-none transition-colors focus:border-border-hover resize-y"
        />
      </div>

      <TurnstileWidget />

      {state.status === "error" && (
        <p className="text-[12px] text-red-400" role="alert">
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
