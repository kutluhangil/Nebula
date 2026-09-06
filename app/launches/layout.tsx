import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// route's title, description and canonical live here.
export const metadata: Metadata = {
  title: "SpaceX Launches",
  description:
    "The next SpaceX launch with a live countdown, the upcoming manifest and the most recent flight, read from Launch Library 2.",
  alternates: { canonical: "/launches" },
};

export default function LaunchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
