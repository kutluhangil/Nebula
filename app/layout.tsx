import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

// Applied before paint to prevent a theme flash. Defaults to dark (deep space),
// but honours a stored choice or the OS preference.
const themeScript = `(function(){try{var t=localStorage.getItem('nebula-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,300;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500&display=swap"
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
      <body className="antialiased w-full overflow-x-hidden">
        {/* Ambient mission-control backdrop: blueprint grid + nebula glow + noise + scanline */}
        <div className="ambient-grid" aria-hidden="true" />
        <div className="film-grain" aria-hidden="true" />
        <div className="radar-scanline" aria-hidden="true" />
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none w-full" aria-hidden="true">
          <div className="glow-blob glow-blue w-[700px] h-[700px] top-[-250px] left-[-150px]" />
          <div className="glow-blob glow-violet w-[600px] h-[600px] bottom-[-200px] right-[-150px]" />
        </div>

        <Providers>
          <div className="relative z-10 min-h-screen flex flex-col w-full">
            <Navigation />
            <main className="flex-1 w-full flex flex-col items-center">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
