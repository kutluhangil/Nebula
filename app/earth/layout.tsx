import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// route's title, description and canonical live here.
export const metadata: Metadata = {
  title: "Earth Intelligence",
  description:
    "Live seismic monitoring from USGS with an interactive map, magnitude and depth distribution, plus NASA EONET wildfire, volcano and storm layers.",
  alternates: { canonical: "/earth" },
};

export default function EarthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
