"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = { error: null, info: null };

const fieldClass =
  "bg-transparent border border-border px-4 py-3 text-[13px] text-fg outline-none transition-colors focus:border-border-hover";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full justify-center" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <form action={formAction} className="w-full max-w-sm border border-border p-9 flex flex-col gap-6">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-mid mb-2">Account</p>
          <h1 className="font-display text-3xl tracking-[0.04em]">Reset password</h1>
          <p className="text-[12px] text-mid leading-[1.7] mt-3">
            Enter your email and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[10px] tracking-[0.14em] uppercase text-mid">
            Email
          </label>
          <input id="email" name="email" type="email" required className={fieldClass} />
        </div>

        {state.error && (
          <p className="text-[12px] text-red-400" role="alert">
            {state.error}
          </p>
        )}
        {state.info && <p className="text-[12px] text-mid">{state.info}</p>}

        <SubmitButton />

        <p className="text-[12px] text-mid text-center">
          Remembered it?{" "}
          <Link href="/login" className="text-fg underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
