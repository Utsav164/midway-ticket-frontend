// MidwayTicket PWA — Service Worker (served dynamically)
//
// FIX: this used to be a static file at public/sw.js with a hardcoded
// `CACHE_VERSION = "mwt-v1"` that never changed between deploys. Per the
// Service Worker spec, a browser only installs a "new" worker when the
// script's BYTES differ from what's already installed — if this file is
// byte-identical release after release, the browser correctly (from its
// point of view) concludes there's nothing to update, and a phone that
// installed the PWA early on keeps running that same old worker — and
// therefore the same old cached app shell — forever. That's exactly what
// was happening: one phone stuck on an old version no amount of manual
// cache-clearing fixed, while a phone installing fresh always got the
// latest build.
//
// Serving this from a Route Handler instead of a static file means its
// body is generated fresh on every request, embedding Vercel's own
// per-deployment git commit SHA. That guarantees the file's bytes are
// different on every single deploy, automatically, with nothing for
// anyone to remember to bump by hand ever again.
export const dynamic = "force-dynamic";

const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now());

function buildServiceWorkerScript(buildId: string): string {
  return `
// Auto-generated per deploy — build ${buildId}
const CACHE_VERSION = "mwt-${buildId}";
const STATIC_CACHE = \`\${CACHE_VERSION}-static\`;
const SHELL_CACHE = \`\${CACHE_VERSION}-shell\`;

const APP_SHELL = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json"
  );
}

function isSensitivePage(url) {
  return ["/tickets", "/bookings", "/payments", "/staff", "/analytics", "/auth", "/operator"]
    .some((p) => url.pathname.startsWith(p));
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request)),
    );
    return;
  }

  if (isSensitivePage(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match("/"))),
  );
});
`.trim();
}

export async function GET() {
  return new Response(buildServiceWorkerScript(BUILD_ID), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Must never be cached — the whole point is that the browser fetches
      // this fresh (or at least conditionally revalidates) on every check,
      // so a content change here is actually seen.
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
