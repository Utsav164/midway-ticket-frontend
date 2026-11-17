"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Ticket as TicketIcon, MapPinned, IndianRupee, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/index";
import { getOperatorEvents, updateEvent } from "@/lib/api/events";
import { ROUTES } from "@/config/app.config";
import type { Event } from "@/types";

export default function OperatorEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOperatorEvents()
      .then((res) => { if (!cancelled) setEvents(res); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // FIX: events created before this deploy may be stuck in DRAFT — the
  // create endpoint never set a status and there was no way to change it
  // afterwards, so a DRAFT event was permanently invisible on the public
  // /events page with no recovery path. New events no longer have this
  // problem (they're created ACTIVE), but this button is what lets an
  // operator fix any event that's already stuck, without needing direct
  // database access.
  async function handlePublish(id: string) {
    setPublishingId(id);
    try {
      const updated = await updateEvent(id, { status: "ACTIVE" });
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Standalone events — a single show or gathering, not tied to a Fair.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.operatorEventsNew}><Plus className="h-4 w-4 mr-1.5" /> New Event</Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <TicketIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No events yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            Create your first standalone event — e.g. a college auditorium show.
          </p>
          <Button asChild>
            <Link href={ROUTES.operatorEventsNew}><Plus className="h-4 w-4 mr-1.5" /> New Event</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${event.coverGradient} flex items-center justify-center text-2xl flex-shrink-0`}>
                {event.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900">{event.name}</p>
                  <Badge variant={event.status === "ACTIVE" ? "active" : "inactive"}>{event.status}</Badge>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${event.requiresPayment ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                    {event.requiresPayment ? "Paid" : "Free — no payment"}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
                  <MapPinned className="h-3.5 w-3.5" /> {event.venue}, {event.city}
                  <span className="mx-1">·</span>
                  {new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" /> {event.pricePerTicket || "Free"} · Capacity {event.capacity}
                </p>
                {event.status !== "ACTIVE" && (
                  <p className="text-amber-600 text-xs mt-1.5">
                    Not visible to customers until published.
                  </p>
                )}
              </div>
              {event.status !== "ACTIVE" && (
                <Button
                  size="sm"
                  onClick={() => handlePublish(event.id)}
                  loading={publishingId === event.id}
                  className="flex-shrink-0"
                >
                  <Upload className="h-3.5 w-3.5" /> Publish
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
