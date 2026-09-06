import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// route's title, description and canonical live here.
export const metadata: Metadata = {
  title: "Planet Intelligence",
  description:
    "Live dashboard for Earth and space: astronomy picture of the day, ISS telemetry, earthquakes, near-Earth objects, launches and solar weather.",
  alternates: { canonical: "/dashboard" },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
