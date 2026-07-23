export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://blobbyofficial.com";

export const SITE_NAME = "blobbyofficial";

export const SOCIALS = {
  tiktok: "https://tiktok.com/@blobby.official",
  youtube: "https://youtube.com/@blobby.official",
  discord: "https://discord.com/users/1109378632071254086",
  payhipStore: "https://payhip.com/blobbyofficial",
} as const;

export const ANALYTICS = {
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? "G-TBHKH37GN4",
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID ?? "we5kyxb1o6",
} as const;

export const NAV_LINKS = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/store", label: "Store" },
  { href: "/scripts", label: "Scripts" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
] as const;

export const FOOTER_LINKS = [
  { href: "/store", label: "Store" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/licensing", label: "Licensing" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms-of-use", label: "Terms" },
] as const;
