import type { Metadata } from "next";

/**
 * The page itself is a client component and can't export metadata, so the
 * segment layout carries it. Account pages are deliberately noindex: they're
 * thin, they're behind a form, and without this they inherited the root
 * layout's metadata and reported themselves as duplicates of the homepage.
 */
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your blobbyofficial account to message me or use the script editor.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
