"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Share2, CheckCircle } from "lucide-react";
import { CustomerNavbar } from "@/components/layout/customer-navbar";
import { QRCodeDisplay } from "@/components/customer/qr-display";
import { Badge, Skeleton } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { getTicketById } from "@/lib/api/tickets";
import { formatDate, formatCurrency, formatTime } from "@/lib/utils";
import { ROUTES } from "@/config/app.config";
import type { Ticket } from "@/types";

export default function TicketDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [ticket, setTicket]   = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTicketById(id).then((t) => { setTicket(t); setLoading(false); });
  }, [id]);

  if (!loading && !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🎟️</p>
          <p className="font-bold text-slate-900 mb-2">Ticket not found</p>
          <Button onClick={() => router.push(ROUTES.tickets)}>My Tickets</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 pt-20"
      style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
      <CustomerNavbar />

      <div className="w-full max-w-sm">
        <button onClick={() => router.push(ROUTES.tickets)}
          className="flex items-center gap-1.5 text-sky-400 text-sm mb-6 hover:gap-2.5 transition-all">
          <ArrowLeft className="h-4 w-4" /> My Tickets
        </button>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-3xl" style={{ backgroundColor: "#1E293B" }} />
            <Skeleton className="h-10 rounded-xl" style={{ backgroundColor: "#1E293B" }} />
          </div>
        ) : ticket && (
          <>
            {/* Ticket card */}
            <div className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: "#1E293B", border: "1px solid rgba(56,189,248,0.15)" }}>

              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(56,189,248,0.1)" }}>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-sky-400 flex items-center justify-center">
                    <span className="text-slate-900 text-[10px] font-black">MT</span>
                  </div>
                  <span className="text-sky-400 font-bold text-xs tracking-widest">MIDWAYTICKET</span>
                </div>
                <Badge variant={ticket.ticketStatus.toLowerCase() as "valid" | "used"}>
                  {ticket.ticketStatus}
                </Badge>
              </div>

              {/* Ride image */}
              <div className={`h-36 bg-gradient-to-br ${ticket.rideCoverGradient} flex items-center justify-center text-5xl`}>
                {ticket.rideEmoji}
              </div>

              {/* Ticket body */}
              <div className="p-5">
                <h2 className="text-white font-bold text-2xl mb-0.5">{ticket.rideName}</h2>
                <p className="text-slate-400 text-sm mb-5">{ticket.fairName}</p>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  {[
                    ["Date",    formatDate(ticket.eventDate)],
                    ["Booked",  formatTime(ticket.bookedAt)],
                    ["Tickets", `${ticket.quantity} person${ticket.quantity > 1 ? "s" : ""}`],
                    ["Amount",  formatCurrency(ticket.totalAmount)],
                    ["Payment", ticket.paymentMethod],
                    ["Status",  ticket.paymentStatus],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-slate-500 text-xs mb-0.5">{l}</p>
                      <p className="text-white font-semibold text-sm">{v}</p>
                    </div>
                  ))}
                </div>

                {/* Redemption info for used tickets */}
                {ticket.ticketStatus === "Used" && ticket.redeemedAt && (
                  <div className="mb-5 p-3 rounded-xl"
                    style={{ background: "rgba(100,116,139,0.15)", border: "1px solid rgba(100,116,139,0.3)" }}>
                    <p className="text-slate-400 text-xs font-semibold mb-1">REDEMPTION RECORD</p>
                    <p className="text-slate-300 text-xs">
                      Used at {formatTime(ticket.redeemedAt)} by {ticket.redeemedByStaffName} · {ticket.redeemedAtGate}
                    </p>
                  </div>
                )}

                {/* Perforation */}
                <div className="ticket-perforation-dark -mx-5 mb-5" />

                {/* QR section */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Ticket ID</p>
                    <p className="text-white font-bold text-lg">#{ticket.displayId}</p>
                    {ticket.ticketStatus === "Valid" && (
                      <p className="text-slate-500 text-xs mt-2">Show this at the ride entrance</p>
                    )}
                  </div>
                  <div className={`rounded-2xl p-2 ${ticket.ticketStatus === "Used" ? "opacity-40 grayscale" : ""}`}
                    style={{ background: "#fff" }}>
                    <QRCodeDisplay size={100} displayId={ticket.displayId} />
                  </div>
                </div>

                {ticket.ticketStatus === "Valid" && (
                  <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <p className="text-green-400 text-xs">
                      Payment confirmed · Not yet redeemed · Valid for entry
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="secondary">
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="ghost-dark" className="border border-slate-600">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
