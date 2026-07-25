import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How blobbyofficial collects, stores, and uses data from this website.",
  alternates: { canonical: "/privacy-policy" },
};

const SECTIONS = [
  {
    title: "What's collected",
    body: [
      "Analytics: Google Analytics and Microsoft Clarity collect standard, aggregated usage data - pages visited, approximate location, device/browser type, and on-page behavior like scrolling or clicks. This data isn't tied to your name or email.",
      "Contact form: if you submit the contact form, your name, email address, and message are stored so I can respond to you. This is the only place personal information you provide is stored.",
    ],
  },
  {
    title: "How it's used",
    body: [
      "Analytics data is used only to understand how the site is used and to improve it - it is never sold or shared with third parties beyond the analytics providers themselves (Google, Microsoft).",
      "Contact form submissions are used solely to respond to your enquiry. They are not added to a mailing list or shared with anyone else.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "You can ask for any contact-form data linked to your email to be deleted at any time - use the contact form itself or reach out via Discord.",
      "You can block analytics collection entirely using standard browser tools (ad blockers, tracking protection, or disabling JavaScript), without affecting your ability to use the site.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "Store purchases and downloads are handled entirely by Payhip under its own privacy policy - this site never sees or stores your payment details.",
      "Hosting infrastructure (Vercel) and the database used for the contact form and site content (Supabase) process data on this site's behalf under their own respective data-processing terms.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        tag="Privacy Policy"
        title="What's collected,"
        subtitle="and why"
        ghost="P"
        description="Last updated 2026. A plain-language summary of what data this site collects and how it's handled."
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <div className="max-w-2xl space-y-12">
          {SECTIONS.map((section) => (
            <Reveal key={section.title} as="div">
              <h2 className="font-display text-2xl tracking-[0.06em] mb-4">{section.title}</h2>
              <div className="space-y-3">
                {section.body.map((p) => (
                  <p key={p} className="text-[13px] text-mid leading-[1.8]">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
