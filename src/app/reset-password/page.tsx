"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { updatePassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = { error: null };

const fieldClass =
  "bg-transparent border border-border px-4 py-3 text-[13px] text-fg outline-none transition-colors focus:border-border-hover";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full justify-center" disabled={pending}>
      {pending ? "Saving…" : "Set new password"}
    </button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <form action={formAction} className="w-full max-w-sm border border-border p-9 flex flex-col gap-6">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-mid mb-2">Account</p>
          <h1 className="font-display text-3xl tracking-[0.04em]">New password</h1>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-[10px] tracking-[0.14em] uppercase text-mid">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirm_password" className="text-[10px] tracking-[0.14em] uppercase text-mid">
            Confirm password
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={fieldClass}
          />
        </div>

        {state.error && (
          <p className="text-[12px] text-red-400" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton />

        <p className="text-[12px] text-mid text-center">
          Link expired?{" "}
          <Link href="/forgot-password" className="text-fg underline underline-offset-2">
            Send a new one
          </Link>
        </p>
      </form>
    </div>
  );
}
