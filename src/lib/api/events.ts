import type { Event, Ticket } from "@/types";
import { isMockMode, apiGet, apiPost, apiPatch } from "./client";
import { MOCK_API_DELAY } from "@/config/app.config";
import { sleep, generateTicketId } from "@/lib/utils";

// No mock fixture file for Events yet (new feature) — this in-memory array
// is only ever used when NEXT_PUBLIC_USE_MOCK_API=true, so an operator can
// still demo the whole flow (create → list → book → QR) without a backend.
const MOCK_EVENTS: Event[] = [];

export async function getEvents(city?: string): Promise<Event[]> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    return MOCK_EVENTS.filter((e) => e.status === "ACTIVE" && (!city || e.city.toLowerCase().includes(city.toLowerCase())));
  }
  const qs = city ? `?city=${encodeURIComponent(city)}` : "";
  return apiGet<Event[]>(`/events${qs}`);
}

export async function getEventById(id: string): Promise<Event | null> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_EVENTS.find((e) => e.id === id) ?? null; }
  return apiGet<Event>(`/events/${id}`).catch(() => null);
}

export async function getOperatorEvents(): Promise<Event[]> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_EVENTS; }
  return apiGet<Event[]>("/events/operator/mine");
}

export interface CreateEventParams {
  name: string;
  venue: string;
  city: string;
  eventDate: string;
  capacity: number;
  pricePerTicket?: number;
  requiresPayment?: boolean;
  description?: string;
  coverGradient?: string;
  emoji?: string;
}

export async function createEvent(params: CreateEventParams): Promise<Event> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    const event: Event = {
      id: `mock-event-${Date.now()}`,
      operatorId: "mock-operator-org",
      status: "ACTIVE",
      pricePerTicket: params.pricePerTicket ?? 0,
      requiresPayment: params.requiresPayment ?? false,
      description: params.description ?? "",
      coverGradient: params.coverGradient ?? "from-violet-600 to-indigo-700",
      emoji: params.emoji ?? "🎫",
      ...params,
    };
    MOCK_EVENTS.push(event);
    return event;
  }
  return apiPost<Event>("/events", params);
}

export interface UpdateEventParams {
  name?: string;
  venue?: string;
  eventDate?: string;
  capacity?: number;
  pricePerTicket?: number;
  requiresPayment?: boolean;
  status?: Event["status"];
}

export async function updateEvent(id: string, params: UpdateEventParams): Promise<Event> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    const event = MOCK_EVENTS.find((e) => e.id === id);
    if (event) Object.assign(event, params);
    return event as Event;
  }
  return apiPatch<Event>(`/events/${id}`, params);
}

// ── Booking (customer-facing) ────────────────────────────────────────────────

export interface BookEventParams {
  eventId: string;
  quantity?: number;
  customerEmail?: string;
  /** Only relevant when the event's own requiresPayment is true. */
  paymentMethod?: string;
}
export interface EventBookingResult {
  success: boolean;
  /** One entry per admission — booking quantity 5 returns 5 individually-scannable tickets. */
  tickets?: Ticket[];
  /** Present instead of `tickets` only when the event requires payment — a real Razorpay Checkout flow isn't wired up on the frontend yet, matching Ride bookings today. */
  order?: { orderId: string; amount: number; currency: string; razorpayKeyId: string };
  /** See the same field on BookingResult in lib/api/tickets.ts — the confirmation screen must check this before claiming an email was sent. */
  emailSent?: boolean;
  error?: string;
}

/**
 * Books a ticket for a standalone Event. Deliberately never sends a payment
 * method unless the event itself requires one — for a free event, this call
 * has nothing payment-shaped in it at all, on purpose.
 */
export async function bookEvent(params: BookEventParams): Promise<EventBookingResult> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    const event = MOCK_EVENTS.find((e) => e.id === params.eventId);
    const quantity = params.quantity ?? 1;
    // FIX: mock mode used to return one ticket regardless of quantity —
    // now matches the real backend, so mock mode actually exercises the
    // multi-QR confirmation screen too.
    const tickets: Ticket[] = Array.from({ length: quantity }, () => ({
      id: generateTicketId(),
      displayId: generateTicketId(),
      eventId: params.eventId,
      eventName: event?.name ?? "Event",
      eventVenue: event?.venue ?? "",
      eventEmoji: event?.emoji ?? "🎫",
      eventCoverGradient: event?.coverGradient ?? "from-violet-600 to-indigo-700",
      customerId: "mock-customer-id",
      customerName: "Demo Customer",
      customerEmail: params.customerEmail ?? "demo@example.com",
      quantity: 1,
      pricePerPerson: event?.pricePerTicket ?? 0,
      totalAmount: 0,
      paymentMethod: "Free",
      paymentStatus: "Paid",
      ticketStatus: "Valid",
      bookedAt: new Date().toISOString(),
      eventDate: event?.eventDate ?? new Date().toISOString().split("T")[0],
    }));
    return { success: true, tickets, emailSent: true };
  }

  try {
    const res = await apiPost<{ tickets?: Ticket[]; emailSent?: boolean; orderId?: string; amount?: number; currency?: string; razorpayKeyId?: string }>(
      `/events/${params.eventId}/book`,
      {
        quantity: params.quantity ?? 1,
        ...(params.customerEmail ? { customerEmail: params.customerEmail } : {}),
        ...(params.paymentMethod ? { paymentMethod: params.paymentMethod } : {}),
      },
    );
    if (res.tickets) return { success: true, tickets: res.tickets, emailSent: res.emailSent };
    return {
      success: true,
      order: {
        orderId: res.orderId!, amount: res.amount!, currency: res.currency!, razorpayKeyId: res.razorpayKeyId!,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Booking failed" };
  }
}

// ── Operator: issue a ticket without payment (QR/scanner testing) ────────────

export interface IssueTestEventTicketParams {
  eventId: string;
  quantity?: number;
  customerEmail?: string;
}

export async function issueTestEventTicket(params: IssueTestEventTicketParams): Promise<EventBookingResult> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    return bookEvent({ eventId: params.eventId, quantity: params.quantity, customerEmail: params.customerEmail });
  }
  try {
    const res = await apiPost<{ tickets: Ticket[]; emailSent: boolean }>(
      `/events/${params.eventId}/issue-test-ticket`,
      {
        quantity: params.quantity ?? 1,
        ...(params.customerEmail ? { customerEmail: params.customerEmail } : {}),
      },
    );
    return { success: true, tickets: res.tickets, emailSent: res.emailSent };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Couldn't issue the test ticket" };
  }
}
