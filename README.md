# blobbyofficial

<img src="https://raw.githubusercontent.com/blobbyofficial/blobbyofficial/main/public/media/images/icons/Logo/logo_compressed.png" alt="blobbyofficial's logo" width="120" height="120" style="border-radius:50%; object-fit:cover;">

## video editor · davinci resolve · fusion presets

[![Website](https://img.shields.io/badge/blobbyofficial.com-000000?style=flat-square&logo=vercel&logoColor=white)](https://blobbyofficial.com)
[![TikTok](https://img.shields.io/badge/@blobby.official-000000?style=flat-square&logo=tiktok&logoColor=white)](https://tiktok.com/@blobby.official)
[![Payhip](https://img.shields.io/badge/Payhip-000000?style=flat-square&logo=payhip&logoColor=white)](https://payhip.com/blobbyofficial)

---

Freelance video editor working in short-form (TikTok/Reels/Shorts), sharing
the free DaVinci Resolve and HandBrake presets built along the way.

Presets: [blobbyofficial.com/store](https://blobbyofficial.com/store)
Hire me: [blobbyofficial.com/contact](https://blobbyofficial.com/contact)

---

## Stack

- **Next.js** (App Router, TypeScript) — [Vercel](https://vercel.com)-hosted
- **Tailwind CSS v4**
- **Supabase** — Postgres (portfolio/product content, contact messages) +
  Auth (single admin account gating `/admin`)
- **Cloudflare Turnstile** — server-verified spam protection on the contact
  form

See [DEPLOY.md](./DEPLOY.md) for environment setup and deployment steps.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Runs at `http://localhost:3000` with static seed content even before
Supabase is configured — see `src/lib/content.ts`.

## Project structure

```text
src/
  app/            routes (App Router) — pages, admin dashboard, API-less
                  server actions for the contact form and admin CRUD
  components/     shared UI (nav, hero, product card, admin forms, ...)
  lib/            Supabase clients, content/data layer, site constants,
                  Turnstile verification, rate limiting
supabase/
  migrations/     SQL schema + RLS policies + seed data
```

---

### Tools I use
(Affiliate links)

[![Payhip](https://img.shields.io/badge/Payhip-000000?style=flat-square&logo=shopify&logoColor=white)](https://payhip.com?fp_ref=blobbyofficial)
[![Eleven Labs](https://img.shields.io/badge/Eleven%20Labs-000000?style=flat-square&logo=googleassistant&logoColor=white)](https://try.elevenlabs.io/blobbyofficial)
[![Proton](https://img.shields.io/badge/Proton-000000?style=flat-square&logo=googleassistant&logoColor=white)](https://pr.tn/ref/XWAW73G4)
