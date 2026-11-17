"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { CheckCircle, XCircle, ScanLine, Shield, AlertTriangle, Camera, Keyboard, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { redeemTicket, redeemEventTicket } from "@/lib/api/tickets";
import { ApiError } from "@/lib/api/client";
import { APP_CONFIG } from "@/config/app.config";
import type { ScanState, ScanResult, StaffUser } from "@/types";

// The worker script is what actually decodes frames off the main thread.
// qr-scanner ships it as a separate file rather than bundling it inline —
// it's already sitting in /public (Next.js serves that directory at the
// site root), so this just needs to point at it by absolute path.
if (typeof window !== "undefined") {
  QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";
}


interface ScannerUIProps {
  staff: StaffUser;
}

export function ScannerUI({ staff }: ScannerUIProps) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult]       = useState<ScanResult | null>(null);
  const [scansToday, setScansToday] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // ── Camera scanning ─────────────────────────────────────────────────────
  // "camera" is the default/primary mode. Falls back to "manual" either by
  // user choice (Keyboard button) or automatically if the camera can't be
  // started at all (no camera, permission denied, insecure context, etc).
  const [scanMode, setScanMode]         = useState<"camera" | "manual">("camera");
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError]   = useState<string | null>(null);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const qrScannerRef  = useRef<QrScanner | null>(null);
  // Synchronous guard against a burst of decode callbacks for the same
  // still-visible QR code firing multiple redeem requests before React
  // state (scanState) has actually re-rendered to "scanning".
  const isProcessingRef = useRef(false);

  // A staff member is assigned to EITHER a Fair's ride OR a standalone
  // Event — never both. These four names cover every display spot below so
  // the JSX doesn't need an `if` at every usage.
  const isEventAssignment = Boolean(staff.assignedEventId);
  const assignedName      = staff.assignedEventName ?? staff.assignedRideName ?? "";
  const assignedSubtitle  = isEventAssignment ? "Standalone Event" : staff.assignedFairName;
  const assignedEmoji     = staff.assignedEventEmoji ?? staff.assignedRideEmoji;
  const assignedGradient  = staff.assignedEventGradient ?? staff.assignedRideGradient;
  const assignedLabel     = isEventAssignment ? "ASSIGNED EVENT" : "ASSIGNED RIDE";

  const handleScan = useCallback(async (qrToken: string) => {
    if (!qrToken.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScanState("scanning");
    setResult(null);
    setScanError(null);
    try {
      const res = isEventAssignment
        ? await redeemEventTicket(qrToken.trim(), staff.assignedEventId!)
        : await redeemTicket(qrToken.trim(), staff.assignedRideId!);
      setResult(res);
      setScanState(outcomeToState(res.outcome));
    } catch (err: any) {
      isProcessingRef.current = false;
      // A genuine network/timeout failure (no response from the backend at
      // all) gets its own full-screen state with a clear retry action —
      // distinct from a normal business-rule rejection, which already came
      // back as a proper (if unwelcome) answer from the server.
      if (err instanceof ApiError && (err.status === "network" || err.status === "timeout")) {
        setScanError(err.message);
        setScanState("network_error");
      } else {
        setScanError(err?.message ?? "Couldn't reach the server. Try again.");
        setScanState("idle"); // camera/manual entry resumes immediately for a retry
      }
    }
  }, [isEventAssignment, staff.assignedEventId, staff.assignedRideId]);

  // Keep manual hardware-scanner / keyboard input focused whenever it's the
  // active mode and we're ready for a new scan (unchanged from before —
  // some gates still use a physical keyboard-wedge scanner alongside phones).
  useEffect(() => {
    if (scanMode === "manual" && scanState === "idle") qrInputRef.current?.focus();
  }, [scanMode, scanState]);

  // ── Camera lifecycle ─────────────────────────────────────────────────────
  // Starts the camera ONLY while actually waiting for a scan (mode is
  // "camera" AND state is "idle"), and stops+destroys it the instant that
  // stops being true — whether because a code was found (state moves to
  // "scanning"), the user switched to manual entry, or the component
  // unmounted (navigating away from the scanner screen entirely). This is
  // also what makes the browser only prompt for camera permission the first
  // time scanning actually starts, not on page load.
  useEffect(() => {
    if (scanMode !== "camera" || scanState !== "idle") {
      qrScannerRef.current?.stop();
      return;
    }
    if (!videoRef.current) return;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera isn't supported on this browser. Use manual entry below.");
      setScanMode("manual");
      return;
    }

    let cancelled = false;
    setCameraStarting(true);
    setCameraError(null);

    const scanner = new QrScanner(
      videoRef.current,
      (result) => handleScan(typeof result === "string" ? result : result.data),
      {
        preferredCamera:      "environment", // rear camera — this is a gate scanner, not a selfie camera
        highlightScanRegion:  true,
        highlightCodeOutline: true,
        maxScansPerSecond:    5,
      },
    );
    qrScannerRef.current = scanner;

    scanner
      .start()
      .then(() => { if (!cancelled) setCameraStarting(false); })
      .catch((err: any) => {
        if (cancelled) return;
        setCameraStarting(false);
        const name = err?.name ?? "";
        setCameraError(
          name === "NotAllowedError"
            ? "Camera permission denied. Allow camera access in your browser settings, or use manual entry below."
            : name === "NotFoundError"
              ? "No camera found on this device. Use manual entry below."
              : name === "NotReadableError"
                ? "Camera is already in use by another app. Use manual entry below."
                : "Couldn't start the camera. Use manual entry below.",
        );
        setScanMode("manual");
      });

    return () => {
      cancelled = true;
      scanner.stop();
      scanner.destroy();
      qrScannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleScan is
    // stable for the life of a given staff assignment; re-running this
    // effect on every render would restart the camera constantly.
  }, [scanMode, scanState]);

  const handleConfirm = useCallback(() => {
    // Redemption already happened server-side inside POST /tickets/redeem —
    // there is no separate "confirm" call. This just advances the local UI
    // and bumps the on-screen counter (staff.scansToday is refreshed from
    // the backend on next login/page load, this is just immediate feedback).
    setScansToday((n) => n + 1);
    setScanState("confirmed");
  }, []);

  const handleReset = useCallback(() => {
    isProcessingRef.current = false;
    setScanState("idle");
    setResult(null);
    setScanError(null);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <header className="bg-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-400 flex items-center justify-center font-bold text-slate-900 text-sm">
            {staff.name.charAt(0) || "S"}
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">{staff.name || "Staff"}</p>
            <p className="text-slate-400 text-xs">{staff.gate} · Scanner Staff</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sky-400 text-xs font-bold tracking-wider">SCANS TODAY</p>
          <p className="text-white font-bold text-xl leading-tight">{scansToday}</p>
        </div>
      </header>

      <div className="mx-4 mt-3 rounded-2xl bg-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-semibold tracking-widest mb-0.5">{assignedLabel}</p>
          <p className="text-white font-bold text-lg leading-tight">{assignedName}</p>
          <p className="text-slate-400 text-xs">{assignedSubtitle} · {staff.gate}</p>
        </div>
        <div className={cn("h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0", assignedGradient)}>
          {assignedEmoji}
        </div>
      </div>

      <div className="flex-1 mx-4 mt-3 mb-0 flex flex-col min-h-[320px]">
        <div className={cn(
          "flex-1 rounded-3xl overflow-hidden flex flex-col transition-colors duration-300",
          scanState === "valid" && "ring-2 ring-green-500/50",
          scanState === "confirmed" && "ring-2 ring-green-500/50",
          scanState === "wrong_ride" && "ring-2 ring-amber-500/50",
          scanState === "ride_closed" && "ring-2 ring-amber-500/50",
          scanState === "already_used" && "ring-2 ring-slate-500/50",
          scanState === "invalid" && "ring-2 ring-red-500/50",
          scanState === "network_error" && "ring-2 ring-slate-500/50",
        )} style={{ background: "#080E1A" }}>

          {scanState === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center py-6 px-6">
              <div className="relative w-64 h-64 mb-4 rounded-2xl overflow-hidden bg-black">
                {scanMode === "camera" ? (
                  <>
                    {/* qr-scanner attaches directly to this <video> element and
                        streams the live camera feed into it — this is the
                        actual camera preview, not a decoration. */}
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                    {cameraStarting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="h-8 w-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine className="h-14 w-14 text-slate-700" />
                  </div>
                )}
                {/* Corner-bracket scan guide, overlaid on either the live
                    camera feed or the manual-entry placeholder. */}
                {(["top-0 left-0 border-t-2 border-l-2","top-0 right-0 border-t-2 border-r-2",
                   "bottom-0 left-0 border-b-2 border-l-2","bottom-0 right-0 border-b-2 border-r-2"] as const)
                  .map((cls, i) => (
                  <div key={i} className={`absolute ${cls} w-10 h-10 border-sky-400 rounded-sm pointer-events-none`} />
                ))}
              </div>

              <p className="text-slate-400 text-sm text-center">
                {scanMode === "camera" ? "Point the camera at the ticket's QR code" : "Type the ticket code below"}
              </p>
              <p className="text-slate-600 text-xs mt-1.5 text-center">
                Only <span className="text-sky-400 font-semibold">{assignedName}</span> tickets accepted
              </p>

              {cameraError && (
                <p className="text-amber-400 text-xs mt-3 text-center max-w-xs">{cameraError}</p>
              )}

              {scanMode === "manual" && (
                <form
                  className="mt-4 w-full max-w-xs"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = qrInputRef.current?.value ?? "";
                    handleScan(value);
                    if (qrInputRef.current) qrInputRef.current.value = "";
                  }}
                >
                  <input
                    ref={qrInputRef}
                    autoFocus
                    className="w-full bg-slate-800 text-white text-sm rounded-xl px-4 py-3 border border-slate-700 focus:border-sky-400 outline-none placeholder:text-slate-600"
                    placeholder="Waiting for scan… or type ticket code"
                  />
                </form>
              )}

              {/* Manual entry is always reachable as a fallback — this just
                  toggles which one is primary. Switching to "camera" here
                  re-triggers the lifecycle effect above and asks for camera
                  permission again if it was never granted. */}
              <button
                type="button"
                onClick={() => { setCameraError(null); setScanMode(scanMode === "camera" ? "manual" : "camera"); }}
                className="mt-4 inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-semibold"
              >
                {scanMode === "camera" ? (<><Keyboard className="h-3.5 w-3.5" /> Use manual entry instead</>)
                                       : (<><Camera className="h-3.5 w-3.5" /> Try camera again</>)}
              </button>

              {scanError && (
                <p className="text-red-400 text-xs mt-3 text-center">{scanError}</p>
              )}
            </div>
          )}

          {scanState === "scanning" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-16 w-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sky-400 font-semibold">Validating ticket...</p>
              </div>
            </div>
          )}

          {scanState === "valid" && result?.ticket && (
            <div className="flex-1 flex flex-col" style={{ background: "rgba(34,197,94,0.04)" }}>
              <div className="flex items-center gap-2 justify-center py-4"
                style={{ borderBottom: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.08)" }}>
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-bold text-lg">Ticket Valid</span>
              </div>
              <div className="flex-1 p-4">
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(34,197,94,0.2)", background: "#0A1A0A" }}>
                  <div className="px-4 py-2.5 flex items-center justify-between"
                    style={{ borderBottom: "1px solid rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.08)" }}>
                    <span className="text-green-400 text-xs font-bold">{assignedName} · {assignedSubtitle}</span>
                    <span className="text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full">✓ {isEventAssignment ? "CORRECT EVENT" : "CORRECT RIDE"}</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {[
                      ["Ticket ID", `#${result.ticket.id}`],
                      ["Customer", result.ticket.customerName],
                      ["Tickets", `${result.ticket.quantity} person${result.ticket.quantity > 1 ? "s" : ""}`],
                      ["Payment", `${result.ticket.paymentMethod} · ₹${result.ticket.totalAmount}`],
                    ].map(([l, v]) => (
                      <div key={l}><p className="text-slate-500 text-xs">{l}</p><p className="text-white font-semibold text-sm mt-0.5">{v}</p></div>
                    ))}
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl"
                      style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <Shield className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <p className="text-green-400 text-xs">Verified by server · First-time scan · Not expired</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {scanState === "confirmed" && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center"
              style={{ background: "rgba(34,197,94,0.03)" }}>
              <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center mb-4 shadow-2xl"
                style={{ boxShadow: "0 0 40px rgba(34,197,94,0.35)" }}>
                <CheckCircle className="h-11 w-11 text-white" />
              </div>
              <p className="text-green-400 font-bold text-2xl mb-1">Ticket Redeemed!</p>
              <p className="text-slate-400 text-sm text-center mb-4">
                Customer granted entry to <span className="text-white font-semibold">{assignedName}</span>.
              </p>
              <div className="px-4 py-2.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <p className="text-green-400 text-xs font-semibold">
                  #{result?.ticket?.id} · Marked as Used · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          )}

          {scanState === "wrong_ride" && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-500 flex items-center justify-center mb-4">
                <AlertTriangle className="h-9 w-9 text-white" />
              </div>
              <p className="text-amber-400 font-bold text-2xl mb-1">{isEventAssignment ? "Wrong Event" : "Wrong Ride"}</p>
              <p className="text-slate-400 text-sm mb-5">This ticket cannot be used here.</p>
              <div className="w-full max-w-xs rounded-2xl p-4 text-left space-y-3"
                style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Ticket valid for:</span>
                  <span className="text-amber-400 font-bold">{result?.actualRideName ?? (isEventAssignment ? "another event" : "another ride")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Current scanner:</span>
                  <span className="text-white font-semibold">{assignedName}</span>
                </div>
                <div className="pt-2 border-t border-amber-500/20">
                  <p className="text-amber-500 text-xs font-bold">DO NOT allow entry. Redirect customer to the correct {isEventAssignment ? "event" : "ride"}.</p>
                </div>
              </div>
            </div>
          )}

          {scanState === "ride_closed" && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-500 flex items-center justify-center mb-4">
                <AlertTriangle className="h-9 w-9 text-white" />
              </div>
              <p className="text-amber-400 font-bold text-2xl mb-1">{isEventAssignment ? "Event Closed" : "Ride Closed"}</p>
              <p className="text-slate-400 text-sm mb-5">{result?.message ?? "This isn't currently open for entry."}</p>
              <div className="w-full max-w-xs rounded-2xl p-3 text-center"
                style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <p className="text-amber-500 text-xs font-bold">DO NOT allow entry.</p>
              </div>
            </div>
          )}

          {scanState === "already_used" && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-600 flex items-center justify-center mb-4">
                <XCircle className="h-9 w-9 text-white" />
              </div>
              <p className="text-slate-200 font-bold text-2xl mb-1">Already Used</p>
              <p className="text-slate-400 text-sm mb-5">This ticket was previously redeemed.</p>
              <div className="w-full max-w-xs rounded-2xl p-4 text-left space-y-2.5"
                style={{ background: "rgba(71,85,105,0.2)", border: "1px solid rgba(71,85,105,0.3)" }}>
                {[
                  ["Redeemed at", result?.redeemedAt ?? "Earlier today"],
                  ["Redeemed by", result?.redeemedByStaffName ?? "Staff"],
                  ["At gate", result?.redeemedAtGate ?? "—"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-slate-400">{l}</span>
                    <span className="text-slate-200 font-semibold">{v}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-600">
                  <p className="text-red-400 text-xs font-bold">DO NOT allow re-entry.</p>
                </div>
              </div>
            </div>
          )}

          {(scanState === "invalid" || scanState === "expired") && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-red-500 flex items-center justify-center mb-4"
                style={{ boxShadow: "0 0 24px rgba(239,68,68,0.3)" }}>
                <XCircle className="h-9 w-9 text-white" />
              </div>
              <p className="text-red-400 font-bold text-2xl mb-1">
                {scanState === "expired" ? "Ticket Expired" : "Invalid Ticket"}
              </p>
              <p className="text-slate-400 text-sm mb-4">
                {scanState === "expired" ? "This ticket is no longer valid for entry." : "This QR code is not a valid MidwayTicket."}
              </p>
              <div className="px-4 py-2.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <p className="text-red-400 text-xs font-bold">DO NOT allow entry. Report if suspicious.</p>
              </div>
            </div>
          )}

          {scanState === "network_error" && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-600 flex items-center justify-center mb-4">
                <WifiOff className="h-9 w-9 text-white" />
              </div>
              <p className="text-slate-200 font-bold text-2xl mb-1">Connection Problem</p>
              <p className="text-slate-400 text-sm mb-5">{scanError ?? "Couldn't reach the server. Check your connection."}</p>
              <div className="w-full max-w-xs rounded-2xl p-3 text-center"
                style={{ background: "rgba(71,85,105,0.2)", border: "1px solid rgba(71,85,105,0.3)" }}>
                <p className="text-slate-300 text-xs font-semibold">The ticket has NOT been marked as used — nothing was lost, just retry.</p>
              </div>
            </div>
          )}
        </div>

        <div className="py-4 space-y-3">
          {scanState === "valid" && (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="success" size="lg" onClick={handleConfirm}>
                <CheckCircle className="h-4 w-4" /> Mark as Used
              </Button>
              <Button variant="ghost-dark" size="lg" onClick={handleReset}>Cancel</Button>
            </div>
          )}
          {["confirmed","wrong_ride","ride_closed","already_used","invalid","expired","network_error"].includes(scanState) && (
            <Button size="lg" className="w-full" onClick={handleReset}>
              <ScanLine className="h-4 w-4" /> {scanState === "network_error" ? "Try Again" : "Scan Next Ticket"}
            </Button>
          )}
          {APP_CONFIG.useMockApi && (
            <p className="text-center text-slate-700 text-xs">
              Mock mode: type anything and submit to cycle through outcomes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function outcomeToState(outcome: string): ScanState {
  switch (outcome) {
    case "VALID":        return "valid";
    case "WRONG_RIDE":   return "wrong_ride";
    case "RIDE_CLOSED":  return "ride_closed";
    case "ALREADY_USED": return "already_used";
    case "EXPIRED":      return "expired";
    default:             return "invalid";
  }
}
