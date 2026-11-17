// Production-safe: missing NEXT_PUBLIC_USE_MOCK_API now means MOCK IS OFF.
// Previously `!== "false"` meant a missing/misconfigured env var silently
// enabled mock mode in production — the opposite of safe-by-default.
function resolveApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Set it in Vercel → Project → Settings → " +
      "Environment Variables (Production) to the live backend's /api/v1 base URL."
    );
  }
  // NOTE: the live backend has URI versioning enabled (main.ts →
  // enableVersioning), so every route except /health is under /api/v1, not
  // /api. Don't "fix" this back to /api without first confirming the
  // backend's versioning has actually been removed — check main.ts.
  return "http://localhost:3001/api/v1";
}

export const APP_CONFIG = {
  name: "MidwayTicket",
  tagline: "Every Ride. One Ticket.",
  description: "Skip the queue. Book ride tickets digitally.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiUrl: resolveApiUrl(),
  useMockApi: process.env.NEXT_PUBLIC_USE_MOCK_API === "true",
  currency: "₹",
  currencyCode: "INR",
  supportEmail: "support@midwayticket.in",
} as const;

export const ROUTES = {
  home: "/",
  fairs: "/fairs",
  fair: (id: string) => `/fairs/${id}`,
  ride: (id: string) => `/rides/${id}`,
  events: "/events",
  event: (id: string) => `/events/${id}`,
  checkout: "/checkout",
  tickets: "/tickets",
  ticket: (id: string) => `/tickets/${id}`,
  profile: "/profile",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  operatorLogin: "/operator/login",
  operatorSignup: "/operator/signup",
  operatorDashboard: "/operator/dashboard",
  operatorFairs: "/operator/fairs",
  operatorFairsNew: "/operator/fairs/new",
  operatorEvents: "/operator/events",
  operatorEventsNew: "/operator/events/new",
  operatorRides: "/operator/rides",
  operatorRidesNew: "/operator/rides/new",
  operatorStaff: "/operator/staff",
  operatorStaffNew: "/operator/staff/new",
  operatorIssueTicket: "/operator/tickets/issue",
  operatorAnalytics: "/operator/analytics",
  operatorSettings: "/operator/settings",
  staffLogin: "/staff/login",
  staffScanner: "/staff/scanner",
} as const;

export const RIDE_CATEGORIES = ["All", "Thrill", "Family", "Kids", "Games"] as const;
export const PAYMENT_METHODS = [
  { id: "UPI",        label: "UPI / PhonePe / GPay", icon: "📲" },
  { id: "Card",       label: "Debit / Credit Card",   icon: "💳" },
  { id: "NetBanking", label: "Net Banking",            icon: "🏦" },
] as const;
export const MOCK_API_DELAY   = 400;
export const MOCK_SCAN_DELAY  = 1600;
export const MOCK_PAYMENT_DELAY = 2000;
