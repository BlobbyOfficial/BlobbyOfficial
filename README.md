# blobbyofficial

<img src="https://raw.githubusercontent.com/blobbyofficial/blobbyofficial/main/public/media/images/icons/Logo/logo_compressed.png" alt="blobbyofficial's logo" width="120" height="120" style="border-radius:50%; object-fit:cover;">

## video editor · davinci resolve · fusion presets

[![Website](https://img.shields.io/badge/blobbyofficial.com-000000?style=flat-square&logo=vercel&logoColor=white)](https://blobbyofficial.com)
[![TikTok](https://img.shields.io/badge/@blobby.official-000000?style=flat-square&logo=tiktok&logoColor=white)](https://tiktok.com/@blobby.official)
[![Payhip](https://img.shields.io/badge/Payhip-000000?style=flat-square&logo=payhip&logoColor=white)](https://payhip.com/blobbyofficial)

---

Freelance video editor working in short-form (TikTok/Reels/Shorts), sharing
free DaVinci Resolve and HandBrake presets built along the way.

Presets: [blobbyofficial.com/store](https://blobbyofficial.com/store)
Hire me: [blobbyofficial.com/contact](https://blobbyofficial.com/contact)

---

## Stack

- **Next.js** (App Router, TypeScript) — [Vercel](https://vercel.com)-hosted
- **Tailwind CSS v4**
- **Supabase** — Postgres (portfolio/product content, messaging inbox,
  real-time script collaboration) + Auth (public accounts, plus an
  admin-only allowlist gating `/admin`)
- **Vercel Cron** — pings every monitored endpoint every 10 minutes to feed
  the status page at [status.blobbyofficial.com](https://status.blobbyofficial.com)
- **Yjs** — CRDT sync for the real-time collaborative script editor at
  `/scripts`, transported over Supabase Realtime broadcast channels

Write access to content and messages is restricted to accounts listed in
`bo_admins`, enforced in row-level security *and* re-checked in every admin
server action (they're independently addressable endpoints, so the dashboard
layout's check doesn't cover them).

Google Analytics and Microsoft Clarity are consent-gated: neither script is
requested until the visitor accepts the cookie banner, and the choice can be
changed later from the Cookies link in the footer.

See [DEPLOY.md](./DEPLOY.md) for environment setup and deployment steps.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Runs at `http://localhost:3000` with static seed content even before
Supabase is configured — see `src/lib/content.ts`.

### Adding portfolio clips

Drop the `.mp4` into `public/media/videos/TikTok` (own work) or
`public/media/videos/clients` (client work) — the filename becomes the clip
title. `npm run videos:manifest` (run automatically by `dev` and `build`)
regenerates `src/lib/video-manifest.ts`, and opening `/admin/portfolio` adds
anything new to the database as a **private** clip. Nothing is uploaded or
linked from the dashboard; you rename it, add a review, and publish it there.

### Status page

`status.blobbyofficial.com` serves `/status` (rewritten by host in
`src/proxy.ts`). A Vercel cron job hits `/api/status/check` every 10 minutes,
records one row per service in `bo_status_checks` — that history is the strip
of coloured squares — and updates each service's state. Visitors can report an
outage; two open reports on a service that still looks healthy flip it to
*investigating* automatically, and `/admin/status` is where a state gets pinned
by hand or handed back to the pinger. Setup is in [DEPLOY.md](./DEPLOY.md).

## Project structure

```text
src/
  app/            routes (App Router) — pages, admin dashboard, login/signup,
                  API-less server actions for messaging, scripts, admin CRUD
  components/     shared UI (nav, hero, product card, message thread,
                  script editor, portfolio video player, context menu,
                  cookie banner, admin forms, ...)
  lib/            Supabase clients, content/data layer, site constants,
                  admin guard, analytics consent, rate limiting
supabase/
  migrations/     SQL schema + RLS policies + seed data
```

---

### Tools I use
(Affiliate links)

[![Payhip](https://img.shields.io/badge/Payhip-000000?style=flat-square&logo=shopify&logoColor=white)](https://payhip.com?fp_ref=blobbyofficial)
[![Eleven Labs](https://img.shields.io/badge/Eleven%20Labs-000000?style=flat-square&logo=googleassistant&logoColor=white)](https://try.elevenlabs.io/blobbyofficial)
[![Proton](https://img.shields.io/badge/Proton-000000?style=flat-square&logo=googleassistant&logoColor=white)](https://pr.tn/ref/XWAW73G4)
