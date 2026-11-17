// ─────────────────────────────────────────────────────────────────────────────
// MidwayTicket — Mock Scanner Validation Service
//
// IMPORTANT: This is a frontend-only simulation.
// The real ticket validation MUST be performed server-side.
// The backend (NestJS) will enforce:
//   QR Scan → Ticket Exists → Payment Valid → Not Expired
//   → Not Already Used → Correct Fair → Correct Ride → Redeem
//
// When the backend is ready, replace this with:
//   POST /api/tickets/{ticketId}/redeem
//   { staffId, rideId, fairId, gate, scannedAt }
//
// The UI contract (ScanResult type) stays the same.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScanResult, ScanOutcome } from "@/types";
import { MOCK_SCAN_DELAY } from "@/config/app.config";
import { sleep } from "@/lib/utils";

const DEMO_OUTCOMES: ScanOutcome[] = [
  "VALID",
  "WRONG_RIDE",
  "ALREADY_USED",
  "INVALID",
];

let demoIndex = 0;

/**
 * Simulate a QR ticket scan against the assigned ride.
 *
 * Demo mode: cycles through VALID → WRONG_RIDE → ALREADY_USED → INVALID.
 *
 * Future: replace body with:
 *   const res = await apiClient.post(`/tickets/${qrData}/redeem`, { staffId, rideId });
 *   return res.data as ScanResult;
 */
export async function simulateScan(params: {
  qrData: string;
  staffId: string;
  assignedRideId: string;
  assignedRideName: string;
  fairId: string;
  gate: string;
}): Promise<ScanResult> {
  // Simulate network + server processing time
  await sleep(MOCK_SCAN_DELAY);

  const outcome = DEMO_OUTCOMES[demoIndex % DEMO_OUTCOMES.length];
  demoIndex++;

  return buildScanResult(outcome, params.assignedRideName);
}

function buildScanResult(outcome: ScanOutcome, assignedRideName: string): ScanResult {
  switch (outcome) {
    case "VALID":
      return {
        outcome: "VALID",
        message: "Ticket is valid. Confirm entry.",
        ticket: {
          id: "tkt-mt28491",
          displayId: "MT28491",
          fairId: "fair-001",
          fairName: "Grand City Mela",
          rideId: "ride-001",
          rideName: assignedRideName,
          rideEmoji: "🎡",
          rideCoverGradient: "from-blue-500 to-indigo-600",
          customerId: "cust-001",
          customerName: "Aman Kumar",
          customerEmail: "aman@example.com",
          quantity: 2,
          pricePerPerson: 50,
          totalAmount: 100,
          paymentMethod: "UPI",
          paymentStatus: "Paid",
          ticketStatus: "Valid",
                    bookedAt: new Date().toISOString(),
          eventDate: new Date().toISOString().split("T")[0],
        },
      };

    case "WRONG_RIDE":
      return {
        outcome: "WRONG_RIDE",
        message: "This ticket is valid but for a different ride.",
        actualRideName: "Break Dance",
        ticket: {
          id: "tkt-mt28390",
          displayId: "MT28390",
          fairId: "fair-001",
          fairName: "Grand City Mela",
          rideId: "ride-002",
          rideName: "Break Dance",
          rideEmoji: "💃",
          rideCoverGradient: "from-red-500 to-rose-600",
          customerId: "cust-002",
          customerName: "Priya Sharma",
          customerEmail: "priya@example.com",
          quantity: 1,
          pricePerPerson: 80,
          totalAmount: 80,
          paymentMethod: "Card",
          paymentStatus: "Paid",
          ticketStatus: "Valid",
                    bookedAt: new Date().toISOString(),
          eventDate: new Date().toISOString().split("T")[0],
        },
      };

    case "ALREADY_USED":
      return {
        outcome: "ALREADY_USED",
        message: "This ticket has already been redeemed.",
        redeemedAt: new Date(Date.now() - 18 * 60 * 1000).toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit",
        }),
        redeemedByStaffName: "Rahul Sharma",
        redeemedAtGate: "Gate 1",
      };

    case "INVALID":
      return {
        outcome: "INVALID",
        message: "This QR code is not a valid MidwayTicket.",
      };

    case "EXPIRED":
      return {
        outcome: "EXPIRED",
        message: "This ticket is expired and can no longer be used.",
      };

    default:
      return {
        outcome: "INVALID",
        message: "Unknown scan result.",
      };
  }
}

/**
 * Simulate marking a ticket as used (after staff confirms).
 *
 * Future: replace with:
 *   PATCH /api/tickets/{ticketId}/confirm-redemption
 */
export async function simulateConfirmRedemption(ticketId: string): Promise<void> {
  await sleep(300);
  // In real backend: ticket status flips to USED atomically in PostgreSQL
  // Redis can cache used ticket IDs for fast lookup
  console.debug(`[MOCK] Ticket ${ticketId} marked as used`);
}
