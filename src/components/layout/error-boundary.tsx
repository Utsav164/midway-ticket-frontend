"use client";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * FIX: there was no error boundary anywhere in this app. If any error is
 * thrown while a page (or anything it imports) first renders — most
 * notably app.config.ts's resolveApiUrl(), which deliberately throws in
 * production when NEXT_PUBLIC_API_URL isn't set on Vercel, rather than
 * silently falling back to localhost — the *entire app* goes blank with
 * nothing on screen and nothing in Vercel's build/runtime logs, since this
 * is a client-side-only failure that never makes it into server logs at
 * all. That silent-blank-page failure mode is exactly what "the backend
 * won't connect" looks like from the outside: no requests ever reach
 * Railway, because the app crashes before it gets anywhere near a fetch
 * call.
 *
 * This doesn't remove that deliberate throw (failing loudly beats quietly
 * pointing every request at localhost in production) — it just makes the
 * failure visible and actionable instead of an unexplained blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("App crashed during render:", error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isConfigError = error.message.includes("NEXT_PUBLIC_API_URL");

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0F172A", padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: "#1E293B",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 24,
          }}>
            ⚠️
          </div>
          <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {isConfigError ? "Configuration missing" : "Something went wrong"}
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            {isConfigError
              ? "This deployment is missing NEXT_PUBLIC_API_URL, so the app has no backend to talk to. Set it in Vercel → Project → Settings → Environment Variables (Production) to the live backend's /api/v1 base URL, then redeploy."
              : "The app hit an unexpected error while loading. Reloading usually fixes it — if it keeps happening, this is worth reporting."}
          </p>
          {!isConfigError && (
            <pre style={{
              background: "#1E293B", color: "#F87171", fontSize: 12, padding: 12,
              borderRadius: 8, textAlign: "left", overflow: "auto", marginBottom: 20,
            }}>
              {error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#38BDF8", color: "#0F172A", border: "none",
              borderRadius: 10, padding: "10px 20px", fontWeight: 600,
              fontSize: 14, cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
