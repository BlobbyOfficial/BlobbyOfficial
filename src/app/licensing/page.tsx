import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Licensing",
  description: "License terms for blobbyofficial's free DaVinci Resolve and HandBrake presets.",
  alternates: { canonical: "/licensing" },
};

const SECTIONS = [
  {
    title: "What you can do",
    items: [
      "Use any preset from the store in personal, freelance, or commercial video projects, without limit on the number of projects or clients.",
      "Modify a preset for your own edits - adjust values, combine it with other effects, save your own variant for personal use.",
      "Credit is appreciated but never required.",
    ],
  },
  {
    title: "What you can't do",
    items: [
      "Repackage, resell, or redistribute the preset files themselves (as-is or lightly modified) as your own product, free or paid.",
      "Claim authorship of a preset in a course, pack, or marketplace listing.",
      "Upload the raw preset files to third-party marketplaces or bundle them into another paid pack without permission - ask first via the contact page if you have a specific use case in mind.",
    ],
  },
  {
    title: "No warranty",
    items: [
      "Presets are provided as-is, free of charge, with no guarantee they'll behave identically across every version of DaVinci Resolve or HandBrake, every OS, or every hardware configuration.",
      "You're responsible for testing a preset in your own project before relying on it for client or time-sensitive work.",
    ],
  },
];

export default function LicensingPage() {
  return (
    <>
      <PageHero
        tag="Licensing"
        title="Free to use,"
        subtitle="not free to resell"
        ghost="§"
        description="Plain-language terms covering what you can and can't do with the presets in the store."
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <div className="max-w-2xl space-y-14">
          {SECTIONS.map((section) => (
            <Reveal key={section.title} as="div">
              <h2 className="font-display text-2xl tracking-[0.06em] mb-5">{section.title}</h2>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="text-[13px] text-mid leading-[1.8] flex gap-3">
                    <span className="text-dim shrink-0">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
