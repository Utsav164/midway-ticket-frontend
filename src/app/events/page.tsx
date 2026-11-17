"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";
import { CustomerNavbar } from "@/components/layout/customer-navbar";
import { Skeleton } from "@/components/ui/index";
import { getEvents } from "@/lib/api/events";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/config/app.config";
import type { Event } from "@/types";

export default function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getEvents().then((res) => { if (!cancelled) setEvents(res); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNavbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Events</h1>
        <p className="text-slate-500 mb-6">Standalone shows and gatherings — book a ticket in a tap.</p>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
            No events available right now — check back soon.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={ROUTES.event(event.id)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${event.coverGradient} flex items-center justify-center text-3xl flex-shrink-0`}>
                  {event.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{event.name}</p>
                  <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {event.venue}, {event.city}
                  </p>
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    {new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="mt-1.5 font-semibold text-sm text-slate-900">
                    {event.requiresPayment ? formatCurrency(event.pricePerTicket) : "Free"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
