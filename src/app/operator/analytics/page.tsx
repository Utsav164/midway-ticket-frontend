"use client";
import { useEffect, useState } from "react";
import { SalesChart, KpiCard } from "@/components/operator/charts";
import { Badge, Skeleton } from "@/components/ui/index";
import { getOperatorDashboard } from "@/lib/api/operator";
import { formatCurrency } from "@/lib/utils";
import { IndianRupee, Ticket, TrendingUp, Clock } from "lucide-react";
import type { OperatorDashboardData } from "@/types";

type Period = "Today" | "7 Days" | "30 Days";

export default function AnalyticsPage() {
  const [data, setData]       = useState<OperatorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<Period>("7 Days");

  useEffect(() => {
     getOperatorDashboard().then((d) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const chartData = period === "Today" ? data?.hourlyData ?? [] : data?.weeklyData ?? [];
  const xKey      = period === "Today" ? "time" : "day";

  // Derived KPIs — computed from the real dashboard response, never hardcoded.
  const avgTicketValue = data && data.ticketsSoldToday > 0
    ? data.revenueToday / data.ticketsSoldToday
    : 0;
  const peakHour = data?.hourlyData?.length
    ? data.hourlyData.reduce((max, p) => (p.revenue > max.revenue ? p : max), data.hourlyData[0]).time
    : "—";

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">Analytics</p>
        <div className="flex gap-2">
          {(["Today","7 Days","30 Days"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                period === p
                  ? "bg-sky-400 text-slate-900 border-sky-400"
                  : "bg-white text-slate-600 border-slate-200 hover:border-sky-400"
              }`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <KpiCard label="Total Revenue"     value={data!.revenueToday}   icon={IndianRupee}  iconColor="text-sky-500"    iconBg="bg-sky-50"    format="currency" />
            <KpiCard label="Tickets Sold"      value={data!.ticketsSoldToday} icon={Ticket}     iconColor="text-green-500"  iconBg="bg-green-50"  format="number" />
            <KpiCard label="Avg Ticket Value"  value={formatCurrency(avgTicketValue)}  icon={TrendingUp}   iconColor="text-purple-500" iconBg="bg-purple-50" />
            <KpiCard label="Peak Hour"         value={peakHour}   icon={Clock}        iconColor="text-amber-500"  iconBg="bg-amber-50" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Revenue Over Time</h3>
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <div className="h-48"><SalesChart data={chartData} xKey={xKey} /></div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Tickets by Ride</h3>
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <div className="h-48">
              <SalesChart data={data!.ridePerformance.map((r) => ({ ...r, time: r.rideName, day: r.rideName }))} type="bar" xKey="rideName" />
            </div>
          )}
        </div>
      </div>

      {/* Ride performance table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Ride Performance Breakdown</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {["Ride","Tickets","Revenue","Change","Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data!.ridePerformance.map((r) => (
                  <tr key={r.rideId} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-medium text-slate-900 text-sm">{r.rideName}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-sm">{r.tickets}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 text-sm">{formatCurrency(r.revenue)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-semibold ${
                        r.changePercent > 0 ? "text-green-500" :
                        r.changePercent < 0 ? "text-red-500" : "text-slate-400"
                      }`}>
                        {r.changePercent > 0 ? "+" : ""}{r.changePercent}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={r.status.toLowerCase() as "active" | "paused"}>{r.status}</Badge>
                    </td>
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
