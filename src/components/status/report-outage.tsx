"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { reportOutage, type ReportState } from "@/app/status/actions";
import { REPORT_THRESHOLD } from "@/lib/status";

const initialState: ReportState = { error: null, ok: false };

export type ReportableService = { id: string; label: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary self-start" disabled={pending}>
      {pending ? "Sending…" : "Send report"}
    </button>
  );
}

/**
 * The form is collapsed behind a button by default: on a page whose entire job
 * is "is it broken?", a form open on arrival reads as an invitation to report
 * things that are working.
 */
export function ReportOutage({
  services,
  disabled,
}: {
  services: ReportableService[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(reportOutage, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="mt-14 border-t border-border pt-8" aria-labelledby="report-heading">
      <h2 id="report-heading" className="text-[13px] tracking-[0.18em] uppercase text-mid mb-2">
        -- Report an outage --
      </h2>
      <p className="text-[12px] text-dim leading-[1.8] mb-5 max-w-prose">
        Something broken that&apos;s still showing green? Tell me here. Once{" "}
        {REPORT_THRESHOLD} people report the same thing it flips to{" "}
        <span className="text-amber-400">investigating</span> automatically.
      </p>

      {disabled ? (
        <p className="text-[12px] text-dim">Reporting isn&apos;t available right now.</p>
      ) : !open ? (
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          Report an issue
        </button>
      ) : (
        <form ref={formRef} action={formAction} className="flex flex-col gap-4 max-w-md">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.14em] uppercase text-mid">What&apos;s broken?</span>
            <select
              name="service_id"
              required
              defaultValue=""
              className="bg-card border border-border px-3 py-2 text-[13px] text-fg focus:border-border-hover focus:outline-none"
            >
              <option value="" disabled>
                Pick one…
              </option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.14em] uppercase text-mid">
              What happened? (optional)
            </span>
            <textarea
              name="detail"
              rows={3}
              maxLength={500}
              placeholder="e.g. the contact form throws an error when I hit send"
              className="bg-card border border-border px-3 py-2 text-[13px] text-fg placeholder:text-dim focus:border-border-hover focus:outline-none resize-y"
            />
          </label>

          <div className="flex items-center gap-4">
            <SubmitButton />
            <button
              type="button"
              className="text-[12px] text-mid hover:text-fg transition-colors"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>

          <p aria-live="polite" className="text-[12px] min-h-[1.2em]">
            {state.error ? (
              <span className="text-red-400">{state.error}</span>
            ) : state.ok ? (
              <span className="text-emerald-400">Report filed - thanks, I&apos;ll take a look.</span>
            ) : null}
          </p>
        </form>
      )}
    </section>
  );
}
