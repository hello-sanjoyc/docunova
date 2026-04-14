import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your DocuNova AI account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
