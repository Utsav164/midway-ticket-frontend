"use client";
import { useEffect, useState } from "react";
import {
  IndianRupee, Ticket, Activity, Users,
  ChevronRight, Calendar, Plus, MapPin,
} from "lucide-react";
import Link from "next/link";
import { KpiCard, SalesChart } from "@/components/operator/charts";
import { Badge, Skeleton } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { getOperatorDashboard } from "@/lib/api/operator";
import { formatCurrency, formatNumber, formatTime } from "@/lib/utils";
import { useOperatorUser } from "@/stores/auth.store";
import { ROUTES } from "@/config/app.config";
import type { OperatorDashboardData } from "@/types";

type Period = "Today" | "7 Days";

export default function OperatorDashboardPage() {
  const operator = useOperatorUser();
  const [data, setData]       = useState<OperatorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [period, setPeriod]   = useState<Period>("Today");

  useEffect(() => {
    getOperatorDashboard()
      .then((d) => setData(d))
      .catch((err) => setError(err?.message ?? "Couldn't load dashboard data."))
      .finally(() => setLoading(false));

  }, []);

  // Defensive fallbacks even though the backend now always returns these as
  // arrays (never undefined) — this is the last line of defence so a future
  // API change or a partial/malformed response can't crash the page again.
  const hourlyData      = data?.hourlyData ?? [];
  const weeklyData      = data?.weeklyData ?? [];
  const ridePerformance = data?.ridePerformance ?? [];
  const recentTickets   = data?.recentTickets ?? [];
  const upcomingEvents  = data?.upcomingEvents ?? [];

  const chartData  = period === "Today" ? hourlyData : weeklyData;
  const chartXKey  = period === "Today" ? "time" : "day";

  const greeting = new Date().getHours() < 12 ? "Good morning" :
                   new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5">
      {/* Header greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {greeting}, {operator?.name?.split(" ")[0] ?? "Rajesh"} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Here's how <span className="font-medium">{operator?.operatorName}</span> is performing today.
          </p>
        </div>
        <div className="flex gap-2">
          {(["Today", "7 Days"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                period === p
                  ? "bg-sky-400 text-slate-900 border-sky-400"
                  : "bg-white text-slate-600 border-slate-200 hover:border-sky-400"
              }`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Error state — data stays null on failure; render this instead of
          crashing on data!.xxx like before. */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          Couldn't load dashboard: {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : error ? null : (
          <>
            <KpiCard label="Today's Revenue" value={data?.revenueToday ?? 0} change={data?.revenueTodayChange ?? 0}
              icon={IndianRupee} iconColor="text-sky-500" iconBg="bg-sky-50" format="currency" />
            <KpiCard label="Tickets Sold"    value={data?.ticketsSoldToday ?? 0} change={data?.ticketsSoldChange ?? 0}
              icon={Ticket}      iconColor="text-green-500" iconBg="bg-green-50" format="number" />
            <KpiCard label="Active Rides"    value={data?.activeRides ?? 0}
              icon={Activity}    iconColor="text-purple-500" iconBg="bg-purple-50" />
            <KpiCard label="Visitors Today"  value={data?.visitorsToday ?? 0} change={data?.visitorsChange ?? 0}
              icon={Users}       iconColor="text-amber-500" iconBg="bg-amber-50" format="number" />
          </>
        )}
      </div>

      {/* Upcoming Events — was missing from the dashboard entirely; the
          backend was already tracking these, this section is what actually
          surfaces them here. */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-500" />
            <h3 className="font-bold text-slate-900">Upcoming Events</h3>
            {!loading && !error && (
              <span className="text-slate-400 text-sm font-medium">({data?.activeEventsCount ?? 0})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={ROUTES.operatorEventsNew}>
              <Button variant="ghost" size="sm"><Plus className="h-3.5 w-3.5" /> New Event</Button>
            </Link>
            <Link href={ROUTES.operatorEvents}>
              <Button variant="link" size="sm">View all <ChevronRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : error ? null : upcomingEvents.length === 0 ? (
          <div className="py-10 px-5 text-center">
            <p className="text-slate-400 text-sm mb-3">No upcoming events yet.</p>
            <Link href={ROUTES.operatorEventsNew}>
              <Button size="sm"><Plus className="h-3.5 w-3.5" /> Create your first event</Button>
            </Link>
          </div>
        ) : (
          <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingEvents.map((ev) => (
              <Link
                key={ev.id}
                href={ROUTES.operatorEvents}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/40 transition-colors"
              >
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${ev.coverGradient} flex items-center justify-center text-lg flex-shrink-0`}>
                  {ev.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{ev.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 flex-shrink-0" /> {ev.venue}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(ev.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {" · "}{formatNumber(ev.capacity)} capacity
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Chart + ride performance */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Sales chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Ticket Sales</h3>
            <div className="flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400 inline-block" /> Tickets
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" /> Revenue
              </span>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="h-48">
              <SalesChart data={chartData} xKey={chartXKey} />
            </div>
          )}
        </div>

        {/* Ride performance mini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Ride Performance</h3>
            <Button variant="link" size="sm">View all</Button>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : ridePerformance.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No ride activity yet today.</p>
          ) : (
            <div className="space-y-3">
              {ridePerformance.slice(0, 4).map((r) => (
                <div key={r.rideId} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.rideName}</p>
                    <p className="text-xs text-slate-500">{r.tickets} tickets</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(r.revenue)}</p>
                    <p className={`text-xs font-semibold ${
                      r.changePercent > 0 ? "text-green-500" :
                      r.changePercent < 0 ? "text-red-500" : "text-slate-400"
                    }`}>
                      {r.changePercent > 0 ? "+" : ""}{r.changePercent}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Recent Transactions</h3>
          <Button variant="link" size="sm">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : recentTickets.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {["Ticket ID","Customer","Ride","Amount","Method","Status","Time"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-sky-500 text-sm font-semibold">#{tx.id}</td>
                    <td className="px-5 py-3.5 text-slate-900 text-sm font-medium">{tx.customerName}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-sm">{tx.rideName}</td>
                    <td className="px-5 py-3.5 text-slate-900 text-sm font-semibold">{formatCurrency(tx.totalAmount)}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-sm">{tx.paymentMethod}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={tx.paymentStatus.toLowerCase() as "paid" | "pending" | "failed"}>
                        {tx.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{formatTime(tx.bookedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
