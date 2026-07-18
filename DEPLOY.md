# Deploying blobbyofficial

This app is built with Next.js (App Router) and Supabase. It runs fully without
either of the two set up below — the site falls back to static seed content
and `/admin` is simply unreachable — but you'll want both configured for the
contact form, admin dashboard, and dynamic content to work in production.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/migrations/0001_init.sql`. This creates
   the `portfolio_clips`, `products`, and `contact_messages` tables, their
   row-level security policies, and seeds the products/clips that were on
   the original static site.
3. Create your admin account: **Authentication → Users → Add user**. Use
   the email/password you'll sign in with at `/admin/login`. There's no
   public sign-up — this is the one account that manages content.
4. Copy **Project Settings → API → Project URL** and **anon public key**
   into `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Cloudflare Turnstile (contact form spam protection)

1. Create a widget at [dash.cloudflare.com → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile).
2. Add your production domain (and `localhost` for local testing).
3. Copy the **Site Key** into `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the
   **Secret Key** into `TURNSTILE_SECRET_KEY`.

Without these set, the contact form still works, but skips bot verification
(a warning is logged server-side) — fine for local dev, not for production.

## 3. Vercel

1. Import this repository at [vercel.com/new](https://vercel.com/new).
2. Framework preset: Next.js (auto-detected).
3. Add the environment variables from `.env.example` (Project Settings →
   Environment Variables) — `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
4. Deploy.
5. **Domain**: Project Settings → Domains → add `blobbyofficial.com`, then
   point its DNS at Vercel per the instructions Vercel shows you. This
   replaces the previous GitHub Pages + Cloudflare setup — once the domain
   is verified on Vercel, remove the old `CNAME`-style DNS records pointing
   at GitHub Pages.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values above
npm run dev
```

The site renders with seed content even with an empty `.env.local` — fill in
Supabase to manage content from `/admin` instead of editing
`src/lib/content.ts`.
