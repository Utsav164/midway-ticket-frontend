"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  Eye,
  Download,
  Share2,
  CheckCircle,
} from "lucide-react";
import { CustomerNavbar } from "@/components/layout/customer-navbar";
import { QRCodeDisplay } from "@/components/customer/qr-display";
import { Badge, Skeleton } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { getMyTickets } from "@/lib/api/tickets";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/config/app.config";
import type { Ticket as TicketData } from "@/types";

const TABS = ["Upcoming", "Completed"] as const;
type Tab = (typeof TABS)[number];

function MyTicketsContent() {
  const searchParams = useSearchParams();
  const justBooked = searchParams.get("success") === "true";

  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [selected, setSelected] = useState<TicketData | null>(null);
  const [emailSent, setEmailSent] = useState(true);

  useEffect(() => {
    getMyTickets()
      .then((data) => setTickets(data))
      .catch(() => {})
      .finally(() => setLoading(false));

    // FIX: was "lastTicket" (singular) — a purchase of N now issues N
    // separate tickets, so this optimistically prepends the whole batch,
    // not just one, while GET /tickets/mine catches up in the background.
    const raw = sessionStorage.getItem("lastTickets");
    const emailSentRaw = sessionStorage.getItem("lastTicketsEmailSent");

    if (raw && justBooked) {
      const newTickets = JSON.parse(raw) as TicketData[];
      const newIds = new Set(newTickets.map((t) => t.id));

      setTickets((prev) => [
        ...newTickets,
        ...prev.filter((x) => !newIds.has(x.id)),
      ]);

      // FIX: was assumed true unconditionally — see checkout/page.tsx,
      // which now stores the real outcome alongside the tickets.
      if (emailSentRaw !== null) setEmailSent(JSON.parse(emailSentRaw));

      setLoading(false);
    }
  }, [justBooked]);

  const filtered = tickets.filter((t) =>
    tab === "Upcoming"
      ? t.ticketStatus === "Valid"
      : t.ticketStatus === "Used"
  );

  if (selected) {
    return (
      <TicketDetailView
        ticket={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <CustomerNavbar />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {justBooked && (
          <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">
                Ticket booked successfully!
              </p>
              {/* FIX: used to say this unconditionally regardless of whether
                  the confirmation email actually sent — the ticket itself
                  is real either way, this just stops promising an email
                  that may never have gone out. */}
              <p className="text-xs">
                {emailSent
                  ? "Check your email for the QR ticket."
                  : "Couldn't send the confirmation email — your ticket is right here below, or open it anytime from this page."}
              </p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          My Tickets
        </h1>

        <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-sky-400 text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-32" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600 mb-1">
              No {tab.toLowerCase()} tickets
            </p>
            <p className="text-slate-400 text-sm mb-5">
              Book a ride to get started.
            </p>
            <Button asChild>
              <Link href={ROUTES.fairs}>Explore Fairs</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="flex">
                  <div
                    className={`w-1.5 ${
                      ticket.ticketStatus === "Valid"
                        ? "bg-green-500"
                        : "bg-slate-300"
                    }`}
                  />

                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900">
                          {ticket.rideName}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {ticket.fairName}
                        </p>
                      </div>

                      <Badge
                        variant={
                          ticket.ticketStatus.toLowerCase() as
                            | "valid"
                            | "used"
                        }
                      >
                        {ticket.ticketStatus}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(ticket.eventDate)}
                      </span>

                      <span className="flex items-center gap-1">
                        <Ticket className="h-3.5 w-3.5" />
                        {ticket.quantity} ticket
                        {ticket.quantity > 1 ? "s" : ""}
                      </span>

                      <span className="font-medium text-slate-900">
                        {formatCurrency(ticket.totalAmount)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={
                          ticket.ticketStatus === "Valid"
                            ? "default"
                            : "secondary"
                        }
                        onClick={() => setSelected(ticket)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Ticket
                      </Button>

                      <Button size="sm" variant="ghost">
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketDetailView({
  ticket,
  onBack,
}: {
  ticket: TicketData;
  onBack: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 pt-20"
      style={{
        background: "linear-gradient(135deg, #0F172A, #1E293B)",
      }}
    >
      <CustomerNavbar />

      <button
        onClick={onBack}
        className="self-start max-w-sm w-full flex items-center gap-1 text-sky-400 text-sm mb-6 hover:gap-2 transition-all"
      >
        ← Back to tickets
      </button>

      <div className="w-full max-w-sm">
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: "#1E293B",
            border: "1px solid rgba(56,189,248,0.15)",
          }}
        >
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-sky-400 flex items-center justify-center">
                <span className="text-slate-900 text-xs font-bold">
                  MT
                </span>
              </div>

              <span className="text-sky-400 font-bold text-xs tracking-widest">
                MIDWAYTICKET
              </span>
            </div>

            <Badge
              variant={
                ticket.ticketStatus.toLowerCase() as
                  | "valid"
                  | "used"
              }
            >
              {ticket.ticketStatus}
            </Badge>
          </div>

          <div
            className={`h-36 bg-gradient-to-br ${ticket.rideCoverGradient} flex items-center justify-center text-5xl`}
          >
            {ticket.rideEmoji}
          </div>

          <div className="p-5">
            <h2 className="text-white font-bold text-2xl mb-0.5">
              {ticket.rideName}
            </h2>

            <p className="text-slate-400 text-sm mb-5">
              {ticket.fairName}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                ["Date", formatDate(ticket.eventDate)],
                [
                  "Tickets",
                  `${ticket.quantity} person${
                    ticket.quantity > 1 ? "s" : ""
                  }`,
                ],
                ["Amount", formatCurrency(ticket.totalAmount)],
                ["Payment", ticket.paymentMethod],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-slate-500 text-xs mb-0.5">
                    {l}
                  </p>

                  <p className="text-white font-semibold text-sm">
                    {v}
                  </p>
                </div>
              ))}
            </div>

            <div className="ticket-perforation-dark -mx-5 mb-5" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">
                  Ticket ID
                </p>

                <p className="text-white font-bold">
                  #{ticket.displayId}
                </p>

                <p className="text-slate-500 text-xs mt-2">
                  Show at ride entrance
                </p>
              </div>

              <div className="bg-white rounded-2xl p-2">
                <QRCodeDisplay size={100} displayId={ticket.displayId} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            Download
          </Button>

          <Button
            variant="ghost-dark"
            className="border border-slate-600"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense fallback={null}>
      <MyTicketsContent />
    </Suspense>
  );
}
