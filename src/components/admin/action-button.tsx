"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/app/admin/(dashboard)/messages/actions";

/**
 * Fires a Server Action from a button and shows whatever it says back.
 *
 * The messaging actions return an `ActionResult` rather than throwing, so a
 * plain `<form action={…}>` can't be used directly (form actions must resolve
 * to void) and, more importantly, a refusal from `requireAdmin` would be
 * invisible. This renders the error next to the control that caused it.
 */
export function ActionButton({
  action,
  label,
  pendingLabel,
  confirm,
  className = "text-[10px] tracking-[0.08em] uppercase text-mid transition-colors hover:text-fg",
}: {
  action: () => Promise<ActionResult>;
  label: string;
  pendingLabel?: string;
  confirm?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className={`${className} disabled:opacity-40`}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setFeedback(null);
          startTransition(async () => {
            const result = await action();
            setFeedback(result.ok ? (result.message ?? null) : result.error);
          });
        }}
      >
        {pending ? (pendingLabel ?? "Working…") : label}
      </button>
      {feedback && <span className="text-[10px] text-dim">{feedback}</span>}
    </span>
  );
}
