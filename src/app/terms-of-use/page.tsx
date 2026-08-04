import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of the blobbyofficial website and freelance editing services.",
  alternates: { canonical: "/terms-of-use" },
};

const SECTIONS = [
  {
    title: "Using this site",
    body: "This site is provided as-is. I've made a reasonable effort to keep it accurate and available, but I don't guarantee uninterrupted uptime or that every link (including outbound links to Payhip, Discord, TikTok, or YouTube) will always resolve.",
  },
  {
    title: "Presets",
    body: (
      <>
        Free presets are provided without warranty of any kind - see the{" "}
        <Link href="/licensing" className="text-fg underline underline-offset-2">
          licensing page
        </Link>{" "}
        for usage terms and the FAQ for compatibility notes. You use them at your own risk and
        are responsible for testing them before relying on them for time-sensitive work.
      </>
    ),
  },
  {
    title: "Accounts, messages and scripts",
    body: (
      <>
        Creating an account is optional and only needed to message me or use the script editor. Keep
        your password to yourself, and don&apos;t use the messaging or script features for spam,
        harassment, or anything unlawful - I can remove an account that does. Anyone you share a
        script link with can read and edit that script, so only send it to people you want editing
        it. See the{" "}
        <Link href="/privacy-policy" className="text-fg underline underline-offset-2">
          privacy policy
        </Link>{" "}
        for what&apos;s stored and how to have it deleted.
      </>
    ),
  },
  {
    title: "Freelance editing services",
    body: "Any paid editing work is agreed separately, project by project, via the contact page or Discord - scope, price, and turnaround are confirmed in writing before work begins. These website terms don't override whatever is separately agreed for a specific project.",
  },
  {
    title: "External links",
    body: "Purchases are processed by Payhip under its own terms. This site links out to third-party platforms (TikTok, YouTube, Discord, Google Drive) that are outside my control - I'm not responsible for their content, availability, or policies.",
  },
  {
    title: "Changes",
    body: "These terms may be updated as the site or services change. Continued use of the site after an update means you accept the current version.",
  },
];

export default function TermsOfUsePage() {
  return (
    <>
      <PageHero
        tag="Terms of Use"
        title="The rules of"
        subtitle="the road"
        ghost="T"
        description="Last updated August 2026. Straightforward terms for using this site and its services."
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <div className="max-w-2xl space-y-10">
          {SECTIONS.map((section) => (
            <Reveal key={section.title} as="div">
              <h2 className="font-display text-2xl tracking-[0.06em] mb-3">{section.title}</h2>
              <p className="text-[13px] text-mid leading-[1.8]">{section.body}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
