import type { Metadata } from "next";
import { Bebas_Neue, DM_Mono, Cormorant, Monsieur_La_Doulaise } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Grain } from "@/components/grain";
import { Cursor } from "@/components/cursor";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ANALYTICS, SITE_NAME, SITE_URL, SOCIALS } from "@/lib/site";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

const cormorant = Cormorant({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const monsieurLaDoulaise = Monsieur_La_Doulaise({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-monsieur-la-doulaise",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Free Editing Presets`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "High quality, free editing presets for video editors.",
  keywords: [
    "Video editing presets",
    "TikTok",
    "Video Editor",
    "Tiktok Editor",
    "blobbyofficial",
  ],
  authors: [{ name: "BlobbyOfficial" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} | High quality, free editing presets for video editors.`,
    description: "High quality, free editing presets for video editors.",
    type: "website",
    url: SITE_URL,
    images: ["/preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | High quality, free editing presets for video editors.`,
    description: "High quality, free editing presets for video editors.",
    images: ["/preview.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/media/images/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/media/images/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/media/images/favicon/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "BlobbyOfficial",
  url: SITE_URL,
  sameAs: [SOCIALS.tiktok, SOCIALS.youtube, SOCIALS.discordProfile],
  jobTitle: "Video Editor",
  knowsAbout: ["Video Editor", "DaVinci Resolve", "Editing Presets", "After Effects", "TikTok"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${bebasNeue.variable} ${dmMono.variable} ${cormorant.variable} ${monsieurLaDoulaise.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />

        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <Grain />
        <Cursor />
        <SiteNav />

        <main id="main-content">{children}</main>

        <SiteFooter />

        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              id="clarity-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${ANALYTICS.clarityId}");`,
              }}
            />
            <Script
              id="ga-loader"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.gaId}`}
            />
            <Script
              id="ga-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${ANALYTICS.gaId}');`,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
