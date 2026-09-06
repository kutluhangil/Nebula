import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// route's title, description and canonical live here.
export const metadata: Metadata = {
  title: "Space Observatory",
  description:
    "NASA's astronomy picture of the day, near-Earth asteroids, live ISS position and NOAA solar activity in one view.",
  alternates: { canonical: "/space" },
};

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
