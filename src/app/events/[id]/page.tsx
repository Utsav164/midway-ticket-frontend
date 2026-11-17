"use client";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Users as UsersIcon, Mail } from "lucide-react";
import { CustomerNavbar } from "@/components/layout/customer-navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/index";
import { QRCodeDisplay } from "@/components/customer/qr-display";
import { getEventById, bookEvent } from "@/lib/api/events";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/stores/auth.store";
import { ROUTES } from "@/config/app.config";
import type { Event, PaymentMethod, Ticket } from "@/types";

const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Card", "NetBanking", "Wallet"];

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const customer = useCurrentUser();

  const [event, setEvent]     = useState<Event | null | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  // FIX: this page used to silently send the logged-in user's own account
  // email with no way to see or change it — there was no email field on
  // the page at all. Tickets are what actually get emailed out, so someone
  // booking for a friend, or from a shared/family account, had no way to
  // direct delivery anywhere else. Pre-filled from the account for
  // convenience, but now a real, editable field.
  const [email, setEmail] = useState(customer?.email ?? "");
  // Only ever touched when event.requiresPayment is true — for a free
  // event this state is simply never read anywhere in the booking call.
  const [payMethod, setPayMethod] = useState<PaymentMethod>("UPI");

  const [booking, setBooking] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [emailSent, setEmailSent] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getEventById(id).then((res) => { if (!cancelled) setEvent(res); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (customer?.email && !email) setEmail(customer.email);
  }, [customer?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  if (event === null) notFound();

  async function handleBook() {
    if (!event) return;
    if (!email.trim()) { setError("Enter an email to send the ticket(s) to."); return; }
    setBooking(true);
    setError(null);
    const res = await bookEvent({
      eventId: event.id,
      quantity,
      customerEmail: email.trim(),
      // Deliberately omitted entirely for a free event — nothing
      // payment-shaped goes out on the wire when requiresPayment is false.
      ...(event.requiresPayment ? { paymentMethod: payMethod } : {}),
    });
    setBooking(false);
    if (!res.success) { setError(res.error ?? "Booking failed"); return; }
    if (res.tickets) {
      setTickets(res.tickets);
      // FIX: this used to be assumed true unconditionally — the booking
      // response now reports whether the email genuinely went out, so the
      // confirmation screen can tell the truth instead of claiming success
      // for an email that was actually never sent (Redis-queue outage).
      setEmailSent(res.emailSent ?? false);
      return;
    }
    // A real order came back (paid event) — Razorpay Checkout isn't wired
    // up on the frontend yet, same current limitation as ride bookings.
    setPaymentPending(true);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNavbar />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <Link href={ROUTES.events} className="inline-flex items-center gap-1.5 text-sky-500 text-sm mb-4 sm:mb-6 hover:gap-2.5 transition-all">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>

        {event === undefined ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : tickets ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div>
              <p className="font-bold text-slate-900 text-lg">{tickets[0].eventName}</p>
              <p className="text-slate-500 text-sm">{tickets[0].eventVenue}</p>
            </div>

            {/* FIX: a booking of N tickets used to return (and show) exactly
                one QR code no matter what N was — one shared code for a
                group of 5 meant the gate could only ever scan "all 5 at
                once". Every ticket is now its own row with its own QR, so
                this renders one block per admission. */}
            <p className="text-center text-emerald-600 text-sm font-semibold">
              🎉 You're in! {tickets.length > 1 ? `Show each of these ${tickets.length} QR codes at the gate — one per person.` : "Show this QR at the gate."}
            </p>
            <div className={tickets.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
              {tickets.map((ticket, i) => (
                <div key={ticket.id} className="flex flex-col items-center gap-2.5 py-4 border border-slate-100 rounded-xl">
                  <QRCodeDisplay displayId={ticket.displayId} size={tickets.length > 1 ? 150 : 200} />
                  <p className="font-mono text-sm text-slate-600">{ticket.displayId}</p>
                  {tickets.length > 1 && <p className="text-xs text-slate-400">Ticket {i + 1} of {tickets.length}</p>}
                </div>
              ))}
            </div>
            {emailSent ? (
              <p className="text-center text-slate-400 text-xs">
                Also emailed to {email} — {tickets.length > 1 ? "all tickets are in that one email." : "keep it handy at the gate."}
              </p>
            ) : (
              // FIX: the "Also emailed to X" line used to show unconditionally
              // on every successful booking — even when the email itself had
              // silently failed to send (a Redis-queue outage on the backend).
              // The ticket/QR above is still completely real and valid either
              // way; only the email delivery is in question, so say that
              // plainly instead of the confirmation lying about it.
              <p className="text-center text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg py-2 px-3">
                ⚠️ Couldn't send the confirmation email right now. Your {tickets.length > 1 ? "tickets are" : "ticket is"} still valid —
                {" "}screenshot {tickets.length > 1 ? "these QR codes" : "this QR code"} now, or find {tickets.length > 1 ? "them" : "it"} anytime under My Tickets.
              </p>
            )}
            <Button asChild className="w-full" size="lg">
              <Link href={ROUTES.tickets}>View My Tickets</Link>
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`h-28 sm:h-32 bg-gradient-to-br ${event!.coverGradient} flex items-center justify-center text-4xl sm:text-5xl`}>
              {event!.emoji}
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{event!.name}</h1>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" /> {event!.venue}, {event!.city}
                </p>
                <p className="text-slate-500 text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  {new Date(event!.eventDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p className="text-slate-500 text-sm flex items-center gap-1">
                  <UsersIcon className="h-4 w-4 flex-shrink-0" /> {event!.capacity} seats
                </p>
              </div>

              {event!.description && <p className="text-slate-600 text-sm">{event!.description}</p>}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500 text-sm">Price per ticket</span>
                <span className="font-bold text-slate-900">
                  {event!.requiresPayment ? formatCurrency(event!.pricePerTicket) : "Free"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600 block mb-1.5">Quantity</label>
                  <input
                    type="number" min={1} max={10} value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-600 block mb-1.5">
                  Email {quantity > 1 ? `(all ${quantity} tickets go here)` : "(ticket goes here)"}
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-sky-400 outline-none"
                  />
                </div>
              </div>

              {/* Payment method is ONLY ever rendered when the operator has
                  switched requiresPayment on for this specific event — for
                  a free event there is nothing payment-shaped on this page
                  at all. */}
              {event!.requiresPayment && (
                <div>
                  <label className="text-sm text-slate-600 block mb-1.5">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayMethod(m)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                          payMethod === m ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentPending && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
                  This event requires payment and the checkout integration isn't wired up on the frontend yet — same limitation as paid rides today.
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <Button size="lg" className="w-full" loading={booking} onClick={handleBook}>
                {event!.requiresPayment ? `Pay & Book · ${formatCurrency(event!.pricePerTicket * quantity)}` : "Book Ticket"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
