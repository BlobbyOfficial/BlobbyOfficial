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

## 2. Vercel

1. Import this repository at [vercel.com/new](https://vercel.com/new).
2. Framework preset: Next.js (auto-detected).
3. Add the environment variables from `.env.example` (Project Settings →
   Environment Variables) — `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
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
