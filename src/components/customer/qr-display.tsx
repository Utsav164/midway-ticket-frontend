"use client";
// MidwayTicket — QR Code Display
//
// FIX: this component used to render a single hardcoded 19x19 pixel pattern
// with no props connecting it to any real ticket — every ticket on every
// screen (My Tickets, ticket detail) showed the exact same fake image, and
// the real backend endpoint that generates a proper per-ticket QR
// (GET /tickets/:displayId/qr, via the `qrcode` package server-side) was
// never called from the frontend at all. Scanning that old image at a gate
// would not decode to anything meaningful.
//
// Now: pass `displayId` for a REAL ticket and this component fetches and
// displays that ticket's actual QR image, with a loading skeleton and a
// retry affordance if the fetch fails (e.g. offline, backend hiccup).
// Omit `displayId` (as the marketing mockup on the home page does) and it
// falls back to the old decorative placeholder — intentional, since that
// card isn't a real ticket.

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTicketQr } from "@/lib/api/tickets";

const QR_PATTERN = [
  [1,1,1,1,1,1,1,0,0,1,0,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,0,0,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,1,1,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
  [1,0,1,1,0,0,1,1,0,0,1,1,0,1,0,1,1,0,1],
  [0,1,0,0,1,0,0,1,1,0,0,1,1,0,1,0,0,1,0],
  [1,1,1,0,0,1,0,0,0,1,0,0,1,1,0,0,1,1,0],
  [0,0,0,0,0,0,0,0,1,0,1,0,0,1,0,1,0,0,1],
  [1,1,1,1,1,1,1,0,0,1,0,1,0,0,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0],
  [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0],
  [1,0,1,1,1,0,1,0,0,1,0,1,0,0,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,1,0,1,0],
  [1,1,1,1,1,1,1,0,0,1,0,0,0,1,0,0,1,0,1],
];

function DecorativePattern({ size, dark }: { size: number; dark: boolean }) {
  const cellSize = size / 19;
  const fg = dark ? "#FFFFFF" : "#0F172A";
  const bg = dark ? "#0F172A" : "#FFFFFF";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg" aria-hidden="true">
      <rect width={size} height={size} fill={bg} rx="4" />
      {QR_PATTERN.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect key={`${r}-${c}`} x={c * cellSize + 0.5} y={r * cellSize + 0.5}
              width={cellSize - 0.5} height={cellSize - 0.5} fill={fg} rx="0.8" />
          ) : null
        )
      )}
    </svg>
  );
}

interface QRCodeDisplayProps {
  size?: number;
  className?: string;
  dark?: boolean;
  /** Real ticket's display code (e.g. "MT28491"). Omit for decorative-only use. */
  displayId?: string;
}

export function QRCodeDisplay({ size = 140, className, dark = false, displayId }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [state, setState]         = useState<"idle" | "loading" | "error" | "done">(
    displayId ? "loading" : "idle",
  );
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!displayId) { setState("idle"); return; }

    let cancelled = false;
    setState("loading");

    getTicketQr(displayId)
      .then((res) => {
        if (cancelled) return;
        // Validate we actually got a usable image before trusting it — an
        // empty or malformed response should show the retry state, not a
        // broken <img> icon at the gate.
        if (!res?.qrDataUrl || !res.qrDataUrl.startsWith("data:image")) {
          setState("error");
          return;
        }
        setQrDataUrl(res.qrDataUrl);
        setState("done");
      })
      .catch(() => { if (!cancelled) setState("error"); });

    return () => { cancelled = true; };
  }, [displayId, retryCount]);

  // No real ticket attached — decorative use (e.g. home page marketing mockup).
  if (!displayId) {
    return <DecorativePattern size={size} dark={dark} />;
  }

  if (state === "loading") {
    return (
      <div
        className={cn("animate-pulse rounded-lg bg-slate-200", className)}
        style={{ width: size, height: size }}
        role="status"
        aria-label="Loading QR code"
      />
    );
  }

  if (state === "error") {
    return (
      <button
        type="button"
        onClick={() => setRetryCount((c) => c + 1)}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <RefreshCw className="h-4 w-4" />
        <span className="text-[10px] font-medium leading-tight text-center px-1">Tap to retry</span>
      </button>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data: URL, not a static asset Next can optimize
    <img
      src={qrDataUrl!}
      width={size}
      height={size}
      alt={`QR code for ticket ${displayId}`}
      className={cn("rounded-lg", className)}
    />
  );
}
