import type { Metadata, Viewport } from "next";
import {
  Space_Grotesk,
  Fraunces,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

// Self-hosted by next/font at build time: no render-blocking external font request.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

const frauncesItalic = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  style: ["italic"],
  display: "swap",
  variable: "--font-display-italic",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-code",
});

// Applied before paint to prevent a theme flash. Defaults to dark (deep space),
// but honours a stored choice or the OS preference.
const themeScript = `(function(){try{var t=localStorage.getItem('nebula-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export const metadata: Metadata = {
  // Resolves every relative metadata URL (Open Graph image, canonical) against
  // the real origin instead of emitting relative paths crawlers cannot follow.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NEBULA — Planet Intelligence Dashboard",
    template: "%s · NEBULA",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
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
  authors: [{ name: SITE_NAME }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "NEBULA — Planet Intelligence Dashboard",
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEBULA — Planet Intelligence Dashboard",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#05070f",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
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
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${frauncesItalic.variable} ${jetbrainsMono.variable}`}
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
        {/* Ambient mission-control backdrop: blueprint grid + nebula glow + grain.
            All three are fixed and pointer-events-none, so they never repaint
            with the scrolling content. */}
        <div className="ambient-grid" aria-hidden="true" />
        <div className="film-grain" aria-hidden="true" />
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
