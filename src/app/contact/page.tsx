import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { SOCIALS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about freelance editing work or preset support.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        tag="Contact"
        title="Let's talk"
        subtitle="about your edit"
        ghost="@"
        description="Tell me about your footage, deadline, and what you're going for. I reply within a day."
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <div className="grid grid-cols-[1fr_1fr] gap-20 max-md:grid-cols-1 max-md:gap-12">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal>
            <h2 className="font-display text-2xl tracking-[0.06em] mb-4">Prefer to chat directly?</h2>
            <p className="text-[13px] text-mid leading-[1.8] mb-6 max-w-sm">
              For quick questions or if you&apos;d rather talk it through first, reach out on Discord.
              For preset support requests, the FAQ covers the most common issues.
            </p>
            <a
              href={SOCIALS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              Message on Discord →
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
