import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// route's title, description and canonical live here.
export const metadata: Metadata = {
  title: "Unified Timeline",
  description:
    "Earthquakes, launches and astronomy events from every feed, placed on one chronological timeline.",
  alternates: { canonical: "/timeline" },
};

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
