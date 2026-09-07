import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// route's title, description and canonical live here.
export const metadata: Metadata = {
  title: "Sky Almanac",
  description:
    "Moon phase and Earth's rotation computed for right now, alongside a daily constellation, planet, astronomy fact and space quote, and InSight's archived Mars weather.",
  alternates: { canonical: "/sky" },
};

export default function SkyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
