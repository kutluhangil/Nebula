import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// route's title, description and canonical live here.
export const metadata: Metadata = {
  title: "Space News",
  description:
    "Aerospace reporting from international space agencies, commercial spaceflight companies and research publications.",
  alternates: { canonical: "/news" },
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
