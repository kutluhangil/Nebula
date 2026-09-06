import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// route's title, description and canonical live here.
export const metadata: Metadata = {
  title: "Favorites",
  description:
    "The astronomy images, asteroids, earthquakes and launches you saved, kept in this browser and exportable to another device.",
  alternates: { canonical: "/favorites" },
  // Favorites live in the visitor's own browser, so this page renders empty for
  // a crawler. It is deliberately absent from the sitemap for the same reason.
  robots: { index: false, follow: true },
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
