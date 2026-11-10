import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    // The React Compiler runs Babel over every file, which makes `next dev`
    // compile noticeably slower. Keep it for production builds only.
    reactCompiler: phase !== PHASE_DEVELOPMENT_SERVER,
    poweredByHeader: false,
    async headers() {
      return [
        {
          // Genre pages read ?type=&name=, which makes them render on every
          // request. Their output depends only on the URL, so let Netlify's
          // CDN keep each one for an hour. `_rsc` keeps the page's HTML and
          // its client-navigation payload apart.
          source: "/categories/:id",
          headers: [
            { key: "Netlify-CDN-Cache-Control", value: "public, durable, s-maxage=3600, stale-while-revalidate=86400" },
            { key: "Netlify-Vary", value: "query=type|name|_rsc" },
          ],
        },
      ];
    },
    serverExternalPackages: ["got-scraping", "header-generator"],
    outputFileTracingIncludes: {
      '/*': [
        'node_modules/header-generator/data_files/**/*',
      ],
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "image.tmdb.org",
          pathname: "/t/p/**",
        },
      ],
    },
    allowedDevOrigins: ["192.168.1.116", "192.168.1.116:3000", "*.local"],
  };
}
