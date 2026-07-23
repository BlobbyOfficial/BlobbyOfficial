"use client";

import { Suspense, useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "./actions";

const initialState: AuthState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full justify-center" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
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
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/contact";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <form action={formAction} className="w-full max-w-sm border border-border p-9 flex flex-col gap-6">
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
            className="bg-transparent border border-border px-4 py-3 text-[13px] text-fg outline-none transition-colors focus:border-border-hover"
          />
        </div>

        {state.error && (
          <p className="text-[12px] text-red-400" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton />

        <p className="text-[12px] text-mid text-center">
          Don&apos;t have an account?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-fg underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
