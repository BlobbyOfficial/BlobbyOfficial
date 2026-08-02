"use client";

import { Suspense, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "./actions";
import { resendVerification, type AuthState as SignupState } from "../signup/actions";

const initialState: AuthState = { error: null };
const initialResendState: SignupState = { error: null };

const fieldClass =
  "bg-transparent border border-border px-4 py-3 text-[13px] text-fg outline-none transition-colors focus:border-border-hover";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full justify-center" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-[12px] text-fg underline underline-offset-2 disabled:opacity-50"
    >
      {pending ? "Sending…" : "Resend verification email"}
    </button>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialState);
  const [resendState, resendAction] = useActionState(resendVerification, initialResendState);
  const [email, setEmail] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/contact";
  const notice = searchParams.get("reset") === "1" ? "Password updated - sign in with it below." : null;
  const linkError =
    searchParams.get("error") === "link-expired"
      ? "That link has expired or has already been used."
      : searchParams.get("error") === "auth-unavailable"
        ? "Accounts aren't configured yet."
        : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <div className="w-full max-w-sm border border-border p-9 flex flex-col gap-6">
        <form action={formAction} className="flex flex-col gap-6">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-mid mb-2">Account</p>
            <h1 className="font-display text-3xl tracking-[0.04em]">Sign in</h1>
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
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="password" className="text-[10px] tracking-[0.14em] uppercase text-mid">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-mid underline underline-offset-2 transition-colors hover:text-fg"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={fieldClass}
            />
          </div>

          {notice && <p className="text-[12px] text-mid">{notice}</p>}
          {(state.error || linkError) && (
            <p className="text-[12px] text-red-400" role="alert">
              {state.error ?? linkError}
            </p>
          )}

          <SubmitButton />
        </form>

        {state.needsVerification && (
          <form action={resendAction} className="flex flex-col gap-2 items-center">
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="email" value={email} />
            <ResendButton />
            {resendState.error && (
              <p className="text-[12px] text-red-400" role="alert">
                {resendState.error}
              </p>
            )}
            {resendState.info && <p className="text-[12px] text-mid">{resendState.info}</p>}
          </form>
        )}

        <p className="text-[12px] text-mid text-center">
          Don&apos;t have an account?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-fg underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
