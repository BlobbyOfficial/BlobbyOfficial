import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free blobbyofficial account to message me about editing work.",
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
