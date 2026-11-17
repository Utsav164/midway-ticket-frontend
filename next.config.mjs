/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  // PWA + CDN: tell any CDN/edge cache in front of this app (Vercel Edge,
  // Cloudflare, etc.) that these paths are safe to cache aggressively.
  // - _next/static/* is content-hashed by Next.js, so "immutable" is safe.
  // - /icons/* and manifest.json rarely change; a shorter but still long TTL.
  // sw.js is served dynamically from src/app/sw.js/route.ts (not a static
  // file here) and sets its own no-cache header directly in that route,
  // since browsers must be able to pick up a new service worker quickly
  // after every deploy.
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};
export default nextConfig;
