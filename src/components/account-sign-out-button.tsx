"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AccountSignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      className={
        className ??
        "text-[11px] tracking-[0.14em] uppercase text-mid border border-border px-3 py-1.5 transition-colors hover:text-fg hover:border-border-hover"
      }
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
