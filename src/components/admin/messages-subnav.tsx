import Link from "next/link";

const TABS = [
  { key: "inbox", href: "/admin/messages", label: "Inbox" },
  { key: "blocks", href: "/admin/messages/blocks", label: "Blocked" },
  { key: "settings", href: "/admin/messages/settings", label: "Settings & tools" },
] as const;

export function MessagesSubnav({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav className="flex gap-6 flex-wrap mb-6" aria-label="Messaging sections">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`text-[11px] tracking-[0.14em] uppercase no-underline transition-colors ${
            tab.key === active ? "text-fg" : "text-mid hover:text-fg"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
