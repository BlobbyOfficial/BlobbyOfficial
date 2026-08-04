import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a password reset link for your blobbyofficial account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
