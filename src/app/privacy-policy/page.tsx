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
    title: "If you don't have an account",
    body: [
      "You can browse the whole site - portfolio, store, FAQ, everything - without giving me any personal information at all. No account is needed to read anything or to download a preset.",
      "Analytics only run if you accept them. Nothing is loaded or recorded until you press Accept on the cookie banner, and choosing Decline means no analytics scripts are requested at all. You can change your mind any time using the Cookies link in the footer.",
    ],
  },
  {
    title: "If you create an account",
    body: [
      "Accounts exist so we can keep a conversation in one place instead of scattered across DMs. Creating one stores your email address and a securely hashed password - I never see your actual password.",
      "Messages you send me through the contact page are stored against your account, along with the email address they came from, so I can reply and so you can see the thread when you come back.",
      "If you use the collaborative script editor, the scripts you write are stored so they persist between visits. Anyone you give a script link to can read and edit that script, so treat the link as the key to it.",
    ],
  },
  {
    title: "Analytics, if you accept them",
    body: [
      "Google Analytics and Microsoft Clarity collect standard aggregated usage data - pages visited, approximate location, device and browser type, and on-page behaviour like scrolling or clicks. This isn't tied to your name or email.",
      "It's used only to understand which parts of the site are actually useful, and it is never sold. Beyond the analytics providers themselves (Google, Microsoft), it isn't shared with anyone.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "You can ask me to delete your account, your message history, and your scripts at any time - message me or reach out on Discord and I'll remove them.",
      "You can ask for a copy of anything stored about you, and I'll send you what's there.",
      "You can withdraw analytics consent whenever you like via the Cookies link in the footer, or block collection with standard browser tools. Neither affects your ability to use the site.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "Store downloads and any purchases are handled entirely by Payhip under its own privacy policy - this site never sees or stores payment details.",
      "Supabase provides the database and the authentication system behind accounts, messaging and scripts. Vercel hosts the site. Both process data on this site's behalf under their own data-processing terms.",
      "A small number of older submissions from the previous contact form (name, email and message) are still stored. They're only visible to me, and they'll be deleted on request.",
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
        description="Last updated August 2026. A plain-language summary of what this site collects, when, and how it's handled."
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
