"use client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatCurrency, formatNumber, formatChange } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HourlyDataPoint, DailyDataPoint } from "@/types";

// ── KPI CARD ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  format?: "currency" | "number" | "raw";
}

export function KpiCard({
  label, value, change, icon: Icon, iconColor, iconBg, format = "raw",
}: KpiCardProps) {
  const displayValue =
    format === "currency" ? formatCurrency(Number(value))
    : format === "number"  ? formatNumber(Number(value))
    : String(value);

  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{displayValue}</p>
      {change !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs font-semibold", isPositive ? "text-green-500" : "text-red-500")}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{formatChange(Math.abs(change))} vs yesterday</span>
        </div>
      )}
    </div>
  );
}

// ── SALES CHART ───────────────────────────────────────────────────────────────

interface SalesChartProps {
  data: HourlyDataPoint[] | DailyDataPoint[];
  type?: "area" | "bar";
  xKey?: string;
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500 capitalize">{p.dataKey}:</span>
          <span className="font-bold text-slate-900">
            {p.dataKey === "revenue" ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function SalesChart({ data, type = "area", xKey = "time" }: SalesChartProps) {
  const commonProps = {
    data,
    margin: { top: 5, right: 10, bottom: 5, left: -15 },
  };
  const axisProps = {
    tick: { fontSize: 11, fill: "#94A3B8" },
    axisLine: false as const,
    tickLine: false as const,
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === "area" ? (
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip content={<CUSTOM_TOOLTIP />} />
          <Area type="monotone" dataKey="tickets" stroke="#38BDF8" strokeWidth={2} fill="url(#skyGrad)" dot={false} />
          <Area type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} fill="url(#greenGrad)" dot={false} />
        </AreaChart>
      ) : (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip content={<CUSTOM_TOOLTIP />} />
          <Bar dataKey="tickets" fill="#38BDF8" radius={[6, 6, 0, 0]} />
          <Bar dataKey="revenue" fill="#22C55E" radius={[6, 6, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
