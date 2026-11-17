"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js once the app has mounted. Kept as its own tiny client
 * component (not inside Providers) so it can fail silently without ever
 * affecting the rest of the app — registration errors are logged, not thrown.
 *
 * FIX: this used to only call register() once and stop. Combined with the
 * old static sw.js never changing its own content between deploys, a phone
 * could get stuck on an old cached app version indefinitely — no amount of
 * manually clearing cache/site data reliably fixed it, since re-registering
 * the exact same unchanged script just reinstalled the same worker.
 *
 * /sw.js is now served dynamically (src/app/sw.js/route.ts) and its bytes
 * differ on every deploy, so the browser's normal update algorithm will
 * correctly detect a change — but a currently-open tab or installed PWA
 * still needs to be told to actually use it. This component now:
 *   1. Proactively asks the browser to check for a new worker (on load and
 *      whenever the app is brought back to the foreground), instead of
 *      waiting for the browser's own internal check interval.
 *   2. Reloads the page exactly once, automatically, the moment a new
 *      worker takes control — so a stale install self-heals on its own
 *      next open, with nothing for the person to manually clear or retry.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // avoid caching during dev

    let refreshedOnce = false;

    // Fires when a new service worker has taken over control of this page —
    // i.e. an update was found, installed, and (via skipWaiting/clients.claim
    // in the worker itself) activated. Reload once so the page's own JS/CSS
    // matches the new worker instead of staying on whatever was already
    // loaded under the old one.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshedOnce) return;
      refreshedOnce = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for an update right away, and again whenever the PWA is
        // reopened/brought to the foreground — this is what makes a phone
        // that's been sitting on an old install actually notice the new
        // one exists, rather than waiting for the browser's own (much
        // longer, sometimes up-to-24h) internal check interval.
        registration.update().catch(() => {});

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        });
      })
      .catch((err) => console.error("SW registration failed:", err));
  }, []);

  return null;
}
