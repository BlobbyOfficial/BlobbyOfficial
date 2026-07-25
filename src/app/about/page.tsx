import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "BlobbyOfficial is a freelance video editor specializing in TikTok-native edits and DaVinci Resolve presets.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        tag="About"
        title="Editing that"
        subtitle="respects the scroll"
        ghost="01"
        description="I'm blobbyofficial - a freelance video editor working almost exclusively in short-form: TikTok, Reels, and Shorts."
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <div className="grid grid-cols-[1fr_1fr] gap-16 max-w-4xl max-md:grid-cols-1 max-md:gap-10">
          <Reveal>
            <h2 className="font-display text-2xl tracking-[0.06em] mb-4">What I do</h2>
            <p className="text-[13px] text-mid leading-[1.8] mb-4">
              I cut fast-paced, high-retention edits built for the platforms that punish
              slow starts and reward pattern interrupts. That means tight pacing, deliberate
              sound design, and cuts timed to hold attention through the first three seconds
              - the part most edits lose.
            </p>
            <p className="text-[13px] text-mid leading-[1.8]">
              Everything is finished in DaVinci Resolve, which is also where the free presets
              in the <Link href="/store" className="text-fg underline underline-offset-2">store</Link> come
              from - they&apos;re the exact tools I built to solve problems in my own edits, cleaned
              up and shared for anyone else doing the same kind of work.
            </p>
          </Reveal>

          <Reveal>
            <h2 className="font-display text-2xl tracking-[0.06em] mb-4">Why free presets</h2>
            <p className="text-[13px] text-mid leading-[1.8] mb-4">
              Most editors starting out don&apos;t need another paid pack - they need to see how a
              specific problem was actually solved. Edge Reflect, Halo Blur, and the HandBrake
              compression settings each exist because I hit a wall in a real edit and built my
              way out of it.
            </p>
            <p className="text-[13px] text-mid leading-[1.8]">
              Sharing them costs me nothing and saves someone else a night of trial and error.
              If that&apos;s useful to you, the best way to say thanks is to hire me for paid work
              or pass the link to someone who needs it.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-16 border border-border p-9 flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-6 max-md:p-6">
          <div>
            <h2 className="font-display text-2xl tracking-[0.06em] mb-2">Need an editor?</h2>
            <p className="text-[13px] text-mid max-w-md leading-[1.7]">
              I take on a limited number of freelance edits at a time to keep turnaround fast.
              Tell me about your footage and deadline and I&apos;ll get back to you within a day.
            </p>
          </div>
          <Link href="/contact" className="btn-primary shrink-0">
            Get in touch
          </Link>
        </Reveal>
      </section>
    </>
  );
}
