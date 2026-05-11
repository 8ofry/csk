import type { Metadata } from "next";

// This root layout is required by Next.js but is mostly transparent.
// All real layout (lang, dir, providers) happens in app/[locale]/layout.tsx.
export const metadata: Metadata = {
  title: "CSK Academy",
  description: "CSK Academy Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
