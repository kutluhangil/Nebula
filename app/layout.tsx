import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

// Self-hosted by next/font at build time: no render-blocking request to
// fonts.googleapis.com, and the exact families globals.css asks for.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
});

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
