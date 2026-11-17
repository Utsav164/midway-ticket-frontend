import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_CONFIG } from "@/config/app.config";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian rupees.
 * FIX: this crashed the whole page (`undefined.toLocaleString(...)`)
 * whenever it was called with `undefined`/`null`/`NaN` — which happened in
 * production because some backend responses omitted numeric fields the
 * frontend expected (see `ride.totalRevenue`, `fair.minTicketPrice` fixes).
 * The root cause is now fixed at the API layer too, but this is the last
 * line of defence: a formatter should never crash the page it's rendering
 * into, regardless of what a future/partial API response sends it.
 */
export function formatCurrency(amount: number | null | undefined): string {
  const n = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return `${APP_CONFIG.currency}${n.toLocaleString("en-IN")}`;
}

/** Human-readable label for a FairStatus enum value ("ACTIVE" -> "Active"). */
export function getFairStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE": return "Active";
    case "DRAFT":  return "Draft";
    case "ENDED":  return "Ended";
    default:       return status;
  }
}

/** Format large numbers with K/L suffix */
export function formatNumber(n: number): string {
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)   return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/** Format a percentage change with sign */
export function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

/** Sleep for `ms` milliseconds — used in mock API delays */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a random ticket ID */
export function generateTicketId(): string {
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `MT${digits}`;
}

/** Determine if a fair/event is active */
export function isFairActive(startDate: string, endDate: string): boolean {
  const now = new Date();
  return new Date(startDate) <= now && new Date(endDate) >= now;
}

/** Short date format: "13 Aug 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Time format: "10:42 AM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Date range string: "10 Aug – 25 Aug 2026" */
export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sStr = s.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const eStr = e.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return `${sStr} – ${eStr}`;
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Truncate a string to a max length */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}
