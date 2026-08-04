import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/admin/sign-out-button";

/**
 * The dashboard is per-request by definition — it reads the caller's session
 * and, on /admin/portfolio, writes to the database on render. Declaring that
 * explicitly stops Next from trying to prerender these routes at build time,
 * where there is no session to check.
 */
export const dynamic = "force-dynamic";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/portfolio", label: "Portfolio" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/messages", label: "Messages" },
] as const;

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-3xl tracking-[0.04em] mb-4">Admin not configured</h1>
          <p className="text-[13px] text-mid leading-[1.8]">
            Set <code className="text-fg">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-fg">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable the admin
            dashboard - see <code className="text-fg">DEPLOY.md</code> for setup steps.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  // Regular site accounts (used for the messaging inbox and script
  // collaboration) share the same Supabase auth as the admin — being
  // signed in is NOT enough on its own, so check bo_admins membership too.
  const { data: adminRow } = await supabase
    .from("bo_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) redirect("/admin/login");

  return (
    <div className="min-h-screen pt-28 px-10 pb-16 max-md:px-5 max-md:pt-24">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <nav className="flex gap-6 flex-wrap" aria-label="Admin navigation">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[11px] tracking-[0.14em] uppercase text-mid no-underline transition-colors hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-dim">{user.email}</span>
          <SignOutButton />
        </div>
      </div>

      {children}
    </div>
  );
}
