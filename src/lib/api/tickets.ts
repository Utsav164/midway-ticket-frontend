import type { Ticket, CartItem, PaymentMethod, ScanResult } from "@/types";
import { isMockMode, apiGet, apiPost } from "./client";
import { MOCK_TICKETS, MOCK_RIDES } from "@/lib/mock/data";
import { MOCK_API_DELAY, MOCK_PAYMENT_DELAY } from "@/config/app.config";
import { sleep, generateTicketId } from "@/lib/utils";

export async function getMyTickets(): Promise<Ticket[]> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_TICKETS; }
  return apiGet<Ticket[]>("/tickets/mine");
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_TICKETS.find(t => t.id === id) ?? null; }
  return apiGet<Ticket>(`/tickets/${id}`).catch(() => null);
}

/** Real backend: GET /tickets/:displayId/qr — never construct QR data on the client. */
export async function getTicketQr(displayId: string): Promise<{ qrDataUrl: string }> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    // Dev-only placeholder — a real ticket-shaped QR square so mock mode
    // doesn't render a blank image where a QR code should be.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/><rect x="10" y="10" width="80" height="80" fill="#0F172A"/><rect x="20" y="20" width="60" height="60" fill="#fff"/><rect x="30" y="30" width="40" height="40" fill="#0F172A"/></svg>`;
    return { qrDataUrl: `data:image/svg+xml;base64,${btoa(svg)}` };
  }
  return apiGet<{ qrDataUrl: string }>(`/tickets/${displayId}/qr`);
}

/**
 * Scanner staff only. Backend is the sole authority on the outcome
 * (VALID / WRONG_RIDE / ALREADY_USED / INVALID / EXPIRED) — the frontend
 * never decides validity itself, it only renders whatever the backend says.
 */
export async function redeemTicket(qrToken: string, rideId: string): Promise<ScanResult> {
  if (isMockMode) {
    // Mock mode intentionally lives in src/lib/mock/scanner.ts, kept for
    // local demoing only — never reachable when NEXT_PUBLIC_USE_MOCK_API
    // is not exactly "true".
    const { simulateScan } = await import("@/lib/mock/scanner");
    return simulateScan({ qrData: qrToken, staffId: "", assignedRideId: rideId, assignedRideName: "", fairId: "", gate: "" });
  }
  return apiPost<ScanResult>("/tickets/redeem", { qrToken, rideId });
}

/** Same as redeemTicket(), for staff assigned to a standalone Event instead of a ride. */
export async function redeemEventTicket(qrToken: string, eventId: string): Promise<ScanResult> {
  if (isMockMode) {
    const { simulateScan } = await import("@/lib/mock/scanner");
    return simulateScan({ qrData: qrToken, staffId: "", assignedRideId: eventId, assignedRideName: "", fairId: "", gate: "" });
  }
  return apiPost<ScanResult>("/tickets/redeem-event", { qrToken, eventId });
}

export interface CreateBookingParams {
  item: CartItem;
  customerEmail: string;
  paymentMethod?: PaymentMethod;
}
export interface BookingResult {
  success: boolean;
  /** One entry per admission — a booking of quantity 5 returns 5 individually-scannable tickets, not one ticket with quantity=5. */
  tickets?: Ticket[];
  /**
   * FIX: the confirmation screen used to unconditionally claim "Also
   * emailed to X" the moment a booking succeeded — even though the actual
   * send happened on a Redis-backed queue that's been unreachable in
   * production, so the email silently never went anywhere. The backend now
   * sends directly and reports the real outcome here; the UI must check
   * this before claiming an email was sent.
   */
  emailSent?: boolean;
  error?: string;
}

/**
 * Matches the live backend's CreateBookingDto exactly: { rideId, quantity,
 * paymentMethod?, customerEmail? }. PAYMENTS_ENABLED=false on the backend
 * right now, so POST /bookings issues the ticket directly (no Razorpay step) —
 * the response is { ticket, paymentId }, not a payment order. Do not add a
 * fake "payment succeeded" step here; there is no payment to fake yet.
 */
export async function createBooking(params: CreateBookingParams): Promise<BookingResult> {
  if (isMockMode) {
    await sleep(MOCK_PAYMENT_DELAY);
    if (Math.random() < 0.05) return { success: false, error: "Booking failed. Please try again." };
    // FIX: mock mode used to return one ticket regardless of quantity —
    // now matches the real backend's one-row-per-admission behaviour, so
    // testing in mock mode actually exercises the multi-QR UI.
    const tickets: Ticket[] = Array.from({ length: params.item.quantity }, (_, i) => ({
      id: generateTicketId(),
      displayId: generateTicketId(),
      fairId: params.item.fairId,
      fairName: params.item.fairName,
      rideId: params.item.rideId,
      rideName: params.item.rideName,
      rideEmoji: params.item.emoji,
      rideCoverGradient: params.item.coverGradient,
      customerId: "mock-customer",
      customerName: "Mock Customer",
      customerEmail: params.customerEmail,
      quantity: 1,
      pricePerPerson: params.item.pricePerPerson,
      totalAmount: params.item.pricePerPerson,
      paymentMethod: params.paymentMethod ?? "UPI",
      paymentStatus: "Paid",
      ticketStatus: "Valid",
      bookedAt: new Date().toISOString(),
      eventDate: new Date().toISOString().split("T")[0],
    }));
    return { success: true, tickets, emailSent: true }; // mock mode: pretend it always sends
  }

  try {
    // FIX: the backend supports an `Idempotency-Key` header specifically to
    // stop a double-tap on "Pay Now" (or a retried request) from creating
    // two tickets — but this call was never sending one, so that protection
    // was silently dead in production. Generate one UUID per booking attempt
    // (stable across the browser's own fetch retries within this call,
    // since it's created once before the request goes out) and send it.
    const idempotencyKey = crypto.randomUUID();
    const res = await apiPost<{ tickets: Ticket[]; paymentId: string; emailSent: boolean }>(
      "/bookings",
      {
        rideId: params.item.rideId,
        quantity: params.item.quantity,
        customerEmail: params.customerEmail,
        ...(params.paymentMethod ? { paymentMethod: params.paymentMethod } : {}),
      },
      { "Idempotency-Key": idempotencyKey },
    );
    return { success: true, tickets: res.tickets, emailSent: res.emailSent };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Booking failed" };
  }
}

// ── Operator: issue a ticket without payment (QR/scanner testing) ────────────

export interface IssueTestTicketParams {
  rideId: string;
  quantity?: number;
  /** Leave blank to issue to your own (operator) account. */
  customerEmail?: string;
}

/**
 * Operator-only. Deliberately has no `paymentMethod` field anywhere in its
 * signature — this path never shows or accepts a payment option, by design.
 * Matches POST /bookings/operator/issue-test-ticket, which reuses the same
 * seat-locking + issuance logic as a real free booking, just with the
 * ownership check and zeroed amount baked in server-side.
 */
export async function issueTestTicket(params: IssueTestTicketParams): Promise<BookingResult> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    const ride = MOCK_RIDES.find((r) => r.id === params.rideId);
    const quantity = params.quantity ?? 1;
    const tickets: Ticket[] = Array.from({ length: quantity }, () => ({
      id: generateTicketId(),
      displayId: generateTicketId(),
      fairId: ride?.fairId ?? "mock-fair",
      fairName: "Test Event",
      rideId: params.rideId,
      rideName: ride?.name ?? "Test Ride",
      rideEmoji: ride?.emoji ?? "🎫",
      rideCoverGradient: ride?.coverGradient ?? "from-slate-500 to-slate-700",
      customerId: "mock-operator",
      customerName: "Test Ticket",
      customerEmail: params.customerEmail ?? "",
      quantity: 1,
      pricePerPerson: ride?.pricePerPerson ?? 0,
      totalAmount: 0,
      paymentMethod: "Free",
      paymentStatus: "Paid",
      ticketStatus: "Valid",
      bookedAt: new Date().toISOString(),
      eventDate: new Date().toISOString().split("T")[0],
    }));
    return { success: true, tickets, emailSent: true };
  }

  try {
    const res = await apiPost<{ tickets: Ticket[]; paymentId: string; emailSent: boolean }>(
      "/bookings/operator/issue-test-ticket",
      {
        rideId: params.rideId,
        quantity: params.quantity ?? 1,
        ...(params.customerEmail ? { customerEmail: params.customerEmail } : {}),
      },
    );
    return { success: true, tickets: res.tickets, emailSent: res.emailSent };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Couldn't issue the test ticket" };
  }
}
