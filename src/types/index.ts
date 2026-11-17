// ─────────────────────────────────────────────────────────────────────────────
// MidwayTicket — Domain Types
// All types form the contract between the frontend and the future NestJS backend.
// ─────────────────────────────────────────────────────────────────────────────

// ── AUTH ──────────────────────────────────────────────────────────────────────

export type UserRole = "CUSTOMER" | "OPERATOR_OWNER" | "OPERATOR_MANAGER" | "SCANNER_STAFF";

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  // Not set for StaffUser — staff accounts are created directly by an
  // operator, not self-registered, so email verification doesn't apply.
  emailVerified?: boolean;
}

export interface Customer extends BaseUser { role: "CUSTOMER" }

export interface OperatorUser extends BaseUser {
  role: "OPERATOR_OWNER" | "OPERATOR_MANAGER";
  operatorId: string;
  operatorName: string;
}

export interface StaffUser extends BaseUser {
  role: "SCANNER_STAFF";
  staffId: string;
  operatorId: string;
  // Assigned to EITHER a Fair's ride OR a standalone Event — never both.
  assignedFairId?: string;
  assignedFairName?: string;
  assignedRideId?: string;
  assignedRideName?: string;
  assignedRideEmoji?: string;
  assignedRideGradient?: string;
  assignedEventId?: string;
  assignedEventName?: string;
  assignedEventEmoji?: string;
  assignedEventGradient?: string;
  gate: string;
  status: "Active" | "Inactive";
}

export type AuthUser = Customer | OperatorUser | StaffUser;

// ── FAIR ──────────────────────────────────────────────────────────────────────

/**
 * FIX: matches the backend's real FairStatus enum values exactly
 * (DRAFT/ACTIVE/ENDED). This used to be "Active"|"Upcoming"|"Ended" — values
 * the real API never actually returns — so every `fair.status === "Active"`
 * comparison in the app was silently always false for real (non-mock) data.
 * Changing the frontend here (rather than the backend's enum/DB column) is
 * the low-risk direction: no production database migration required.
 */
export type FairStatus = "DRAFT" | "ACTIVE" | "ENDED";

export interface Fair {
  id: string;
  name: string;
  location: string;
  city: string;
  startDate: string;
  endDate: string;
  description: string;
  coverGradient: string;
  emoji: string;
  status: FairStatus;
  totalRides: number;
  minTicketPrice: number;
  operatorId: string;
}

// ── EVENT ─────────────────────────────────────────────────────────────────────
// A standalone event an operator hosts directly — NOT a Fair, NOT broken
// into Rides. e.g. a college auditorium show, a single-venue gathering.
// `requiresPayment` is the operator's own per-event choice: when false, no
// payment method is ever shown to a customer booking it — the ticket is
// issued immediately, free.

export type EventStatus = "DRAFT" | "ACTIVE" | "ENDED";

export interface Event {
  id: string;
  name: string;
  description: string;
  venue: string;
  city: string;
  eventDate: string;
  coverImageUrl?: string;
  coverGradient: string;
  emoji: string;
  capacity: number;
  pricePerTicket: number;
  requiresPayment: boolean;
  status: EventStatus;
  operatorId: string;
}

// ── RIDE ──────────────────────────────────────────────────────────────────────

export type RideCategory = "Thrill" | "Family" | "Kids" | "Games";
export type RideStatus = "Active" | "Paused" | "Maintenance";

export interface Ride {
  id: string;
  fairId: string;
  name: string;
  description: string;
  category: RideCategory;
  emoji: string;
  coverGradient: string;
  pricePerPerson: number;
  durationMinutes: number;
  minAge: number | null;
  capacity: number;
  rating: number;
  reviewCount: number;
  status: RideStatus;
  ticketsSoldToday: number;
  totalRevenue: number;
}

// ── TICKET ────────────────────────────────────────────────────────────────────

export type TicketStatus = "Valid" | "Used" | "Expired" | "Cancelled";
export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";
/**
 * FIX: this was missing "Free" — but the backend's PaymentMethod enum has
 * always included it (`PaymentMethod.FREE = "Free"`), and every ticket
 * issued while PAYMENTS_ENABLED=false (i.e. every real ticket right now)
 * already comes back with exactly that value. The type just never matched
 * what the backend actually sends.
 */
export type PaymentMethod = "UPI" | "Card" | "NetBanking" | "Wallet" | "Free";

export interface Ticket {
  id: string;
  /**
   * FIX: the live backend's toTicketDto() never returns `qrData` (removed
   * below) — it returns `displayId`, the short human-facing code (e.g.
   * "MT28491") used both on-screen and as the key for the real QR image
   * endpoint (GET /tickets/:displayId/qr). This field was missing entirely,
   * so the frontend had no way to ask the backend for a ticket's real QR —
   * every ticket screen fell back to a hardcoded decorative placeholder
   * that was identical for every ticket and encoded no real data at all.
   */
  displayId: string;
  /**
   * FIX: these were required (non-optional) — but a ticket is now for
   * EITHER a Fair's ride OR a standalone Event (see the new `Event` type
   * below), never both. An event ticket's `fairId`/`rideId`/etc. are
   * genuinely `undefined` at runtime; typing them as required silently lied
   * about that and would make any direct property access "work" by
   * TypeScript's rules while actually being undefined.
   */
  fairId?: string;
  fairName?: string;
  rideId?: string;
  rideName?: string;
  rideEmoji?: string;
  rideCoverGradient?: string;
  // Only set when this ticket is for a standalone Event instead of a ride.
  eventId?: string;
  eventName?: string;
  eventVenue?: string;
  eventEmoji?: string;
  eventCoverGradient?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  quantity: number;
  pricePerPerson: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  ticketStatus: TicketStatus;
  bookedAt: string;
  eventDate: string;
  redeemedAt?: string;
  redeemedByStaffId?: string;
  redeemedByStaffName?: string;
  redeemedAtGate?: string;
}

// ── CART ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  rideId: string;
  rideName: string;
  fairId: string;
  fairName: string;
  emoji: string;
  coverGradient: string;
  pricePerPerson: number;
  quantity: number;
}

// ── STAFF ─────────────────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  operatorId: string;
  // A staff member is assigned to EITHER a Fair's ride OR a standalone
  // Event — fairId/rideId/fairName/rideName are only set for the former,
  // eventId/eventName only for the latter.
  fairId?: string;
  fairName?: string;
  rideId?: string;
  rideName?: string;
  eventId?: string;
  eventName?: string;
  gate: string;
  status: "Active" | "Inactive";
  scansToday: number;
  scansTotal: number;
  lastScanAt: string | null;
  joinedAt: string;
}

export interface ScanHistoryEntry {
  id: string;
  ticketId: string;
  customerName: string;
  quantity: number;
  scannedAt: string;
  outcome: ScanOutcome;
}

// ── SCANNER ───────────────────────────────────────────────────────────────────

export type ScanOutcome =
  | "VALID"
  | "WRONG_RIDE"
  | "ALREADY_USED"
  | "INVALID"
  | "EXPIRED"
  | "RIDE_CLOSED";

export type ScanState =
  | "idle"
  | "scanning"
  | "valid"
  | "confirmed"
  | "wrong_ride"
  | "already_used"
  | "invalid"
  | "expired"
  // Ticket + assignment are fine, but the ride/event itself isn't
  // currently open (paused, under maintenance, fair/event ended).
  | "ride_closed"
  // A real network/timeout failure reaching the backend — distinct from a
  // business-rule rejection, which still returns a normal HTTP response.
  | "network_error";

export interface ScanResult {
  outcome: ScanOutcome;
  ticket?: Ticket;
  message: string;
  actualRideName?: string;
  redeemedAt?: string;
  redeemedByStaffName?: string;
  redeemedAtGate?: string;
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────

export interface HourlyDataPoint { time: string; tickets: number; revenue: number }
export interface DailyDataPoint  { day: string;  tickets: number; revenue: number }

export interface RidePerformance {
  rideId: string;
  rideName: string;
  tickets: number;
  revenue: number;
  status: RideStatus;
  changePercent: number;
}

export interface OperatorDashboardData {
  revenueToday: number;
  revenueTodayChange: number;
  ticketsSoldToday: number;
  ticketsSoldChange: number;
  activeRides: number;
  /**
   * FIX: the backend's EventEntity/events query for this endpoint was
   * registered (imported, added to TypeOrmModule.forFeature) but never
   * actually wired up — see analytics.module.ts. Without these fields ever
   * existing on the response, there was no data for a dashboard "Upcoming
   * Events" section to show in the first place, regardless of what UI got
   * built for it.
   */
  activeEventsCount: number;
  upcomingEvents: DashboardEventSummary[];
  visitorsToday: number;
  visitorsChange: number;
  hourlyData: HourlyDataPoint[];
  weeklyData: DailyDataPoint[];
  ridePerformance: RidePerformance[];
  recentTickets: Ticket[];
}

export interface DashboardEventSummary {
  id: string;
  name: string;
  venue: string;
  eventDate: string;
  emoji: string;
  coverGradient: string;
  capacity: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
