# Deploying blobbyofficial

This app is built with Next.js (App Router) and Supabase. It runs fully without
Supabase set up — the site falls back to static seed content and `/admin`,
`/contact`, and `/scripts` are simply unreachable — but you'll want it
configured for messaging, the admin dashboard, script collaboration, and
dynamic content to work in production.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run every file under `supabase/migrations/` in order
   (`0001` through the latest). These create the `portfolio_clips`,
   `products`, `contact_messages` (legacy), `bo_admins`, `bo_messages`, and
   `bo_scripts` tables, their row-level security policies, and seed the
   products/clips that were on the original static site.

   **`0009` is not optional.** The policies written in `0001` predate public
   signup and let any signed-up account edit content and read the legacy
   contact messages; `0009` moves them onto `bo_admins`. A deployment that
   stops at `0008` is wide open to anyone who registers.
3. Create your admin account: **Authentication → Users → Add user**. Then,
   in the SQL Editor, add that user's id to `bo_admins`:

   ```sql
   insert into public.bo_admins (user_id) values ('<the user id>');
   ```

   Sign in at `/admin/login`. Any other visitor can create a normal account
   (via `/signup`) to message you or use the script editor, but only rows in
   `bo_admins` can reach `/admin`.
4. Copy **Project Settings → API → Project URL** and **anon public key**
   into `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Auth emails** (email verification + forgot password). Under
   **Authentication → URL Configuration**:
   - Set **Site URL** to `https://www.blobbyofficial.com` (the apex domain
     308-redirects to `www`, so `www` is the origin auth links come back to).
   - Add these **Redirect URLs**: `https://www.blobbyofficial.com/auth/callback`,
     `https://blobbyofficial.com/auth/callback`,
     `http://localhost:3000/auth/callback`, and (for Vercel previews)
     `https://*.vercel.app/auth/callback`.

   Every link the app sends — the signup confirmation and the password reset —
   comes back to `/auth/callback`, which exchanges the one-time code for a
   session and forwards the user on (`/reset-password` for a recovery link).
   Supabase's built-in SMTP is heavily rate-limited, so for anything beyond
   testing set up your own SMTP under **Authentication → Emails → SMTP
   Settings**. Leave **Confirm email** enabled under **Authentication →
   Sign In / Providers** if you want addresses verified before sign-in — the
   sign-in page detects unconfirmed accounts and offers a resend button.
6. **Recommended**: turn on **Leaked password protection** under
   **Authentication → Policies**. Signup is open to the public, so this
   costs nothing and stops people reusing a password that already appears in
   a known breach.

## 2. Vercel

1. Import this repository at [vercel.com/new](https://vercel.com/new).
2. Framework preset: Next.js (auto-detected).
3. Add the environment variables from `.env.example` (Project Settings →
   Environment Variables) — `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

   `NEXT_PUBLIC_SITE_URL` must be the host you actually serve, including
   `www` if the apex redirects to it. It's the origin used for canonical
   URLs, the sitemap and Open Graph tags, so pointing it at a host that
   redirects makes every canonical resolve somewhere other than the page.
4. Deploy.
5. **Domain**: Project Settings → Domains → add `blobbyofficial.com`, then
   point its DNS at Vercel per the instructions Vercel shows you. This
   replaces the previous GitHub Pages + Cloudflare setup — once the domain
   is verified on Vercel, remove the old `CNAME`-style DNS records pointing
   at GitHub Pages.

## 3. Status page (`status.blobbyofficial.com`)

Optional — the rest of the site works without it, and `/status` renders with
every row "unknown" until checks are running.

1. Run `supabase/migrations/0010_status_page.sql`. It creates
   `bo_status_services`, `bo_status_checks` and `bo_status_reports`, and seeds
   the services listed in `src/lib/status.ts`. Add, rename or remove services
   from `/admin/status` (or straight in the table) afterwards — each row is one
   line on the page, grouped under `group_label`.
2. Add `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → `service_role`) to
   the Vercel project's environment variables. The cron route writes check
   history and service states, which row-level security forbids for the anon
   key. **Never expose this key to the browser** — it must not be prefixed
   `NEXT_PUBLIC_`.
3. Optionally set `STATUS_REPORT_SALT` to a long random string. It salts the
   hash of each reporter's IP (no IP is ever stored) that de-duplicates
   reports.
4. `vercel.json` registers the cron job (`/api/status/check`, every 10
   minutes). Vercel sets `CRON_SECRET` itself; when it's present the route
   requires it as a bearer token, so nobody else can trigger the pings. You can
   run a check by hand from Vercel → Project → Cron Jobs → Run.
5. **Domain**: Project Settings → Domains → add `status.blobbyofficial.com`,
   and point a CNAME at Vercel. No separate project is needed — `src/proxy.ts`
   rewrites any request on a `status.` host to `/status`.

How a state gets set:

- **auto** — whatever the last ping said (non-2xx or a failure is *down*, over
  2.5s is *degraded*).
- **reports** — two or more open visitor reports on a healthy service flip it
  to *investigating* (orange). Clearing the reports in `/admin/status` puts it
  back.
- **manual** — a state you set in `/admin/status`. Neither the pinger nor the
  report threshold overwrites it until you hit **resume auto**.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values above
npm run dev
```

The site renders with seed content even with an empty `.env.local` — fill in
Supabase to manage content from `/admin` instead of editing
`src/lib/content.ts`.
