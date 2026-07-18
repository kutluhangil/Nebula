import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { StarsBackground } from "@/components/ui/stars-background";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: "NEBULA — Planet Intelligence Dashboard",
  description:
    "A premium, AI-powered science dashboard combining live space exploration, astronomy, Earth events, and scientific discoveries into one immersive experience.",
  keywords: [
    "space",
    "astronomy",
    "NASA",
    "SpaceX",
    "earthquakes",
    "ISS",
    "asteroids",
    "solar",
    "science",
    "dashboard",
  ],
  authors: [{ name: "NEBULA" }],
  openGraph: {
    title: "NEBULA — Planet Intelligence Dashboard",
    description:
      "Live space exploration, astronomy, Earth events & AI-generated daily planet reports.",
    type: "website",
    siteName: "NEBULA",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEBULA — Planet Intelligence Dashboard",
    description:
      "Live space exploration, astronomy, Earth events & AI-generated daily planet reports.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "NEBULA",
              description:
                "Planet Intelligence Dashboard — Live space & Earth data",
              applicationCategory: "Science",
              operatingSystem: "Web Browser",
            }),
          }}
        />
      </head>
      <body>
        <StarsBackground />
        <Providers>
          <Navigation />
          <main className="relative z-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
