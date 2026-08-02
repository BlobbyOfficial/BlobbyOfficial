"use client";

import { Suspense, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp, resendVerification, type AuthState } from "./actions";

const initialState: AuthState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full justify-center" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const [state, formAction] = useActionState(signUp, initialState);
  const [resendState, resendAction] = useActionState(resendVerification, initialState);
  const [email, setEmail] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/contact";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <form action={formAction} className="w-full max-w-sm border border-border p-9 flex flex-col gap-6">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-mid mb-2">Account</p>
          <h1 className="font-display text-3xl tracking-[0.04em]">Create an account</h1>
        </div>

        <input type="hidden" name="next" value={next} />

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[10px] tracking-[0.14em] uppercase text-mid">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="bg-transparent border border-border px-4 py-3 text-[13px] text-fg outline-none transition-colors focus:border-border-hover"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-[10px] tracking-[0.14em] uppercase text-mid">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="bg-transparent border border-border px-4 py-3 text-[13px] text-fg outline-none transition-colors focus:border-border-hover"
          />
        </div>

        {state.error && (
          <p className="text-[12px] text-red-400" role="alert">
            {state.error}
          </p>
        )}
        {state.info && <p className="text-[12px] text-mid">{state.info}</p>}

        <SubmitButton />

        {state.info && (
          <div className="flex flex-col gap-2 items-center">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next} />
            <button formAction={resendAction} className="text-[12px] text-fg underline underline-offset-2">
              Didn&apos;t get it? Resend the email
            </button>
            {resendState.error && (
              <p className="text-[12px] text-red-400" role="alert">
                {resendState.error}
              </p>
            )}
            {resendState.info && <p className="text-[12px] text-mid">{resendState.info}</p>}
          </div>
        )}

        <p className="text-[12px] text-mid text-center">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-fg underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
