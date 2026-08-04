import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about presets, licensing, and hiring blobbyofficial.",
  alternates: { canonical: "/faq" },
};

/**
 * Answers carry a `plain` string alongside the rendered node so the
 * structured data below can be generated from the same source as the visible
 * copy — schema that drifts from the page is worse than no schema at all.
 */
const FAQS: { q: string; a: React.ReactNode; plain: string }[] = [
  {
    q: "Are the presets actually free?",
    a: "Yes. Every preset in the store is free to download and use - there's no paywall or trial version. If you want to support the work, the best way is hiring me for an edit or sharing the presets with someone who'd use them.",
    plain:
      "Yes. Every preset in the store is free to download and use - there's no paywall or trial version. If you want to support the work, the best way is hiring me for an edit or sharing the presets with someone who'd use them.",
  },
  {
    q: "What software do I need?",
    a: "Edge Reflect and Halo Blur are built for DaVinci Resolve (free or Studio). The HandBrake preset is a compression profile for HandBrake, the free open-source video transcoder - it's not a Resolve plugin.",
    plain:
      "Edge Reflect and Halo Blur are built for DaVinci Resolve (free or Studio). The HandBrake preset is a compression profile for HandBrake, the free open-source video transcoder - it's not a Resolve plugin.",
  },
  {
    q: "Can I use these presets in commercial or client work?",
    a: (
      <>
        Yes. Personal and commercial use are both fine. What isn&apos;t allowed is repackaging or
        reselling the presets themselves as your own product - see the{" "}
        <Link href="/licensing" className="text-fg underline underline-offset-2">
          licensing page
        </Link>{" "}
        for the full terms.
      </>
    ),
    plain:
      "Yes. Personal and commercial use are both fine. What isn't allowed is repackaging or reselling the presets themselves as your own product - see the licensing page for the full terms.",
  },
  {
    q: "A preset isn't working - what do I check first?",
    a: (
      <>
        Confirm you&apos;re on a recent version of DaVinci Resolve (the presets are tested against
        the last two major releases) and that the .setting/.drfx file was imported into the correct
        panel - Edit page effects for .setting files, Effects Library for .drfx. If it&apos;s still
        not working,{" "}
        <Link href="/contact" className="text-fg underline underline-offset-2">
          message me
        </Link>{" "}
        or DM me on Discord and describe exactly what you&apos;re seeing.
      </>
    ),
    plain:
      "Confirm you're on a recent version of DaVinci Resolve (the presets are tested against the last two major releases) and that the .setting/.drfx file was imported into the correct panel - Edit page effects for .setting files, Effects Library for .drfx. If it's still not working, message me or DM me on Discord and describe exactly what you're seeing.",
  },
  {
    q: "How much do you charge for freelance editing?",
    a: (
      <>
        It depends on footage length, turnaround, and how much direction you can give me up front,
        so every project is quoted individually.{" "}
        <Link href="/contact" className="text-fg underline underline-offset-2">
          Send me the details
        </Link>{" "}
        and I&apos;ll come back with a price before any work starts - scope and cost are agreed in
        writing first, so there are no surprises on either side.
      </>
    ),
    plain:
      "It depends on footage length, turnaround, and how much direction you can give me up front, so every project is quoted individually. Send me the details and I'll come back with a price before any work starts - scope and cost are agreed in writing first, so there are no surprises on either side.",
  },
  {
    q: "What's your turnaround time?",
    a: "Most short-form edits (under 3 minutes of raw footage) are turned around in 1-2 days. Longer or more involved projects can get a specific timeline quoted up front.",
    plain:
      "Most short-form edits (under 3 minutes of raw footage) are turned around in 1-2 days. Longer or more involved projects can get a specific timeline quoted up front.",
  },
  {
    q: "Do you take revisions?",
    a: "Yes - every project includes a round of revisions based on your notes before final delivery. Scope for revisions is agreed before I start editing so there are no surprises on either side. Any additional rounds of revisions are also agreed up front and may incur a fee depending on the scope.",
    plain:
      "Yes - every project includes a round of revisions based on your notes before final delivery. Scope for revisions is agreed before I start editing so there are no surprises on either side. Any additional rounds of revisions are also agreed up front and may incur a fee depending on the scope.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.plain },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageHero
        tag="FAQ"
        title="Questions,"
        subtitle="answered"
        ghost="?"
        description="The most common questions about presets, licensing, and freelance work - in one place."
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <div className="max-w-3xl divide-y divide-border border-t border-b border-border">
          {FAQS.map((item) => (
            <Reveal key={item.q} as="div" className="py-7">
              <h2 className="font-display text-xl tracking-[0.04em] mb-3">{item.q}</h2>
              <p className="text-[13px] text-mid leading-[1.8]">{item.a}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 text-[12px] text-mid">
          Didn&apos;t find your answer?{" "}
          <Link href="/contact" className="text-fg underline underline-offset-2">
            Ask directly
          </Link>
          .
        </Reveal>
      </section>
    </>
  );
}
