"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/app/admin/(dashboard)/messages/actions";

const IDLE: ActionResult = { ok: true, error: null };

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary self-start" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * A form whose Server Action reports success or failure as a value. Same
 * reasoning as ActionButton: the messaging actions return `ActionResult` so
 * that "not authorised" or a constraint violation lands in the UI instead of
 * a blank error page.
 */
export function ActionForm({
  action,
  children,
  label,
  pendingLabel = "Saving…",
  className = "flex flex-col gap-3",
  reset = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  label: string;
  pendingLabel?: string;
  className?: string;
  /** Clear the fields after a successful submit (composers, "add" forms). */
  reset?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    async (_prev: ActionResult, formData: FormData) => action(formData),
    IDLE
  );

  useEffect(() => {
    if (reset && state.ok && state !== IDLE) formRef.current?.reset();
  }, [reset, state]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      <div className="flex items-center gap-3 flex-wrap">
        <Submit label={label} pendingLabel={pendingLabel} />
        {state.error && (
          <span className="text-[12px] text-red-400" role="alert">
            {state.error}
          </span>
        )}
        {state.ok && state.message && <span className="text-[12px] text-dim">{state.message}</span>}
      </div>
    </form>
  );
}
