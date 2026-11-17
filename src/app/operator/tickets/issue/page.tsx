"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ticket as TicketIcon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/index";
import { QRCodeDisplay } from "@/components/customer/qr-display";
import { getOperatorRides } from "@/lib/api/rides";
import { getOperatorFairs } from "@/lib/api/fairs";
import { issueTestTicket } from "@/lib/api/tickets";
import { ROUTES } from "@/config/app.config";
import type { Fair, Ride, Ticket } from "@/types";

/**
 * Operator-only tool: issue a real ticket for testing without any payment
 * step — there is deliberately no payment method field anywhere on this
 * page. This exists specifically so an organizer can generate a real QR for
 * one of their own rides and confirm end-to-end that it renders correctly
 * and scans/verifies correctly at the gate, without needing a real paying
 * customer or Razorpay wired up first.
 */
export default function IssueTestTicketPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [fairs, setFairs] = useState<Fair[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rideId, setRideId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerEmail, setCustomerEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedTickets, setIssuedTickets] = useState<Ticket[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ridesRes, fairsRes] = await Promise.all([getOperatorRides(), getOperatorFairs()]);
        if (cancelled) return;
        setRides(ridesRes);
        setFairs(fairsRes);
        if (ridesRes.length > 0) setRideId(ridesRes[0].id);
      } catch {
        if (!cancelled) setLoadError("Couldn't load your rides. Refresh to try again.");
      } finally {
        if (!cancelled) setLoadingRides(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fairNameById = useMemo(
    () => Object.fromEntries(fairs.map((f) => [f.id, f.name])),
    [fairs],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rideId) return;
    setSubmitting(true);
    setError(null);
    const res = await issueTestTicket({
      rideId,
      quantity,
      customerEmail: customerEmail.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.success || !res.tickets) {
      setError(res.error ?? "Couldn't issue the test ticket.");
      return;
    }
    setIssuedTickets(res.tickets);
  }

  function issueAnother() {
    setIssuedTickets(null);
    setError(null);
  }

  return (
    <div>
      <Link
        href={ROUTES.operatorDashboard}
        className="inline-flex items-center gap-1.5 text-sky-500 text-sm mb-6 hover:gap-2.5 transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="max-w-xl">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <TicketIcon className="h-5 w-5 text-sky-500" />
            <h2 className="font-bold text-slate-900">Issue Test Ticket</h2>
          </div>
          <p className="text-slate-500 text-sm">
            Generates a real ticket with a real, scannable QR for one of your rides —
            no payment involved at all. Use this to confirm QR generation and gate
            scanning both work before you go live.
          </p>
        </div>

        {issuedTickets ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{issuedTickets[0].rideName}</p>
                <p className="text-slate-500 text-sm">{issuedTickets[0].fairName}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                Free · Test
              </span>
            </div>

            {/* One QR per ticket now — a quantity of 5 used to issue a
                single shared QR for all 5, which meant the gate scanner
                could only ever redeem the whole batch in one scan. */}
            <div className={issuedTickets.length > 1 ? "grid grid-cols-2 gap-3" : ""}>
              {issuedTickets.map((t, i) => (
                <div key={t.id} className="flex flex-col items-center gap-2.5 py-4 border border-slate-100 rounded-xl">
                  <QRCodeDisplay displayId={t.displayId} size={issuedTickets.length > 1 ? 140 : 180} />
                  <p className="font-mono text-sm text-slate-600">{t.displayId}</p>
                  {issuedTickets.length > 1 && <p className="text-xs text-slate-400">Ticket {i + 1} of {issuedTickets.length}</p>}
                </div>
              ))}
            </div>

            <div className="text-sm text-slate-600 space-y-1">
              <p>Quantity: <span className="font-medium text-slate-900">{issuedTickets.length}</span></p>
              <p>Issued to: <span className="font-medium text-slate-900">{issuedTickets[0].customerEmail || "your own account"}</span></p>
            </div>

            <p className="text-xs text-slate-400">
              Scan {issuedTickets.length > 1 ? "these" : "this"} with the staff scanner (assigned to <span className="font-medium">{issuedTickets[0].rideName}</span>)
              to confirm {issuedTickets.length > 1 ? "they verify" : "it verifies"} correctly.
            </p>

            <Button type="button" variant="secondary" className="w-full" onClick={issueAnother}>
              <RotateCcw className="h-4 w-4 mr-2" /> Issue Another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <Label className="block mb-1.5">Ride <span className="text-red-400">*</span></Label>
                {loadingRides ? (
                  <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                ) : rides.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    You don't have any rides yet — add one first from the Rides page.
                  </p>
                ) : (
                  <Select value={rideId} onChange={(e) => setRideId(e.target.value)}>
                    {rides.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} — {fairNameById[r.fairId] ?? "Unknown event"}
                      </option>
                    ))}
                  </Select>
                )}
                {loadError && <p className="text-red-500 text-xs mt-1.5">{loadError}</p>}
              </div>

              <div>
                <Label className="block mb-1.5">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                />
              </div>

              <div>
                <Label className="block mb-1.5">Customer Email (optional)</Label>
                <Input
                  type="email"
                  placeholder="Leave blank to issue to your own account"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={submitting}
              disabled={!rideId || rides.length === 0}
            >
              Issue Test Ticket
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
