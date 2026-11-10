import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Geist for both body text and headings
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gedatv.netlify.app"),
  title: {
    default: "GedaTv",
    template: "%s | GedaTv"
  },
  description: "Unlimited movies and TV shows for free. GedaTv offers a premium streaming experience.",
  keywords: ["movies", "tv shows", "streaming", "free movies", "watch online", "gedatv"],
  authors: [{ name: "GedaTv" }],
  creator: "GedaTv",
  publisher: "GedaTv",
  referrer: "origin",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gedatv.netlify.app",
    siteName: "GedaTv",
    title: "GedaTv | Stream Unlimited Movies & TV Shows Online Free",
    description: "Unlimited movies and TV shows for free. Premium streaming experience with no ads.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "GedaTv Cinema",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GedaTv | Stream Unlimited Movies & TV Shows Online Free",
    description: "Unlimited movies and TV shows for free. Premium streaming experience.",
    images: ["/icon-512.png"],
    
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GedaTv Cinema",
  },
  formatDetection: {
    telephone: false,
  },
  robots: { index: false, follow: false },
};

import PageTransition from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.variable} style={{ ["--font-heading" as string]: "var(--font-geist)" }}>
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        {/* Runs while the page is still parsing. First it removes stray text
            nodes from <head>: Netlify inserts "\n<!-- … -->" after
            <meta charset>, and React treats any text node in <head> as a
            hydration mismatch, which made it discard the server HTML and
            re-render every page in the browser. Then it applies the saved
            theme/accent before anything paints. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var h=document.head,n=h.childNodes;for(var i=n.length-1;i>=0;i--){if(n[i].nodeType===3)h.removeChild(n[i]);}}catch(e){}try{var p=JSON.parse(localStorage.getItem("gedatv_prefs")||"{}");if(p.theme==="light"||(p.theme==="system"&&window.matchMedia("(prefers-color-scheme: light)").matches)){document.documentElement.dataset.theme="light";}else{document.documentElement.dataset.theme="dark";}if(p.accent){document.documentElement.dataset.accent=p.accent;}}catch(e){}})();`,
          }}
        />
      </head>

      <body className="font-sans antialiased flex flex-col min-h-screen bg-ink text-white relative">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <Navbar />
        <div id="main-content" className="flex-grow relative z-10">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
        <Footer />
      </body>
    </html>
  );
}

