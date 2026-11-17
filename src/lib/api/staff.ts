import type { StaffMember, ScanHistoryEntry, StaffUser } from "@/types";
import { isMockMode, apiGet, apiPost, apiPatch, apiDelete } from "./client";
import { MOCK_STAFF, MOCK_SCAN_HISTORY, MOCK_RIDES } from "@/lib/mock/data";
import { MOCK_API_DELAY } from "@/config/app.config";
import { sleep } from "@/lib/utils";

export async function getStaffList(): Promise<StaffMember[]> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_STAFF; }
  return apiGet<StaffMember[]>("/staff");
}

export async function getStaffById(id: string): Promise<StaffMember | null> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_STAFF.find(s => s.id === id) ?? null; }
  return apiGet<StaffMember>(`/staff/${id}`).catch(() => null);
}

export async function getStaffScanHistory(staffId: string): Promise<ScanHistoryEntry[]> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_SCAN_HISTORY; }
  return apiGet<ScanHistoryEntry[]>(`/staff/${staffId}/scans`);
}

export interface CreateStaffParams {
  name: string; email: string; phone: string;
  password: string; gate: string;
  // Assign to EITHER a Fair's ride (rideId + fairId together) OR a
  // standalone Event (eventId alone) — never both.
  rideId?: string; fairId?: string;
  eventId?: string;
}

export async function createStaff(params: CreateStaffParams): Promise<StaffMember> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    const ride = MOCK_RIDES.find(r => r.id === params.rideId);
    return {
      id: `S${Date.now()}`, name: params.name, email: params.email, phone: params.phone,
      operatorId: "op-001",
      ...(params.eventId
        ? { eventId: params.eventId, eventName: "Test Event" }
        : {
            fairId: params.fairId, fairName: "Grand City Mela",
            rideId: params.rideId, rideName: ride?.name ?? "",
          }),
      gate: params.gate,
      status: "Active", scansToday: 0, scansTotal: 0, lastScanAt: null,
      joinedAt: new Date().toISOString().split("T")[0],
    };
  }
  return apiPost<StaffMember>("/staff", params);
}

export async function toggleStaffStatus(staffId: string, status: "Active" | "Inactive"): Promise<void> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return; }
  await apiPatch(`/staff/${staffId}`, { isActive: status === "Active" });
}

export async function getStaffSession(): Promise<StaffUser | null> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    const m = MOCK_STAFF[0];
    const ride = MOCK_RIDES.find(r => r.id === m.rideId);
    return {
      id: m.id, name: m.name, email: m.email, role: "SCANNER_STAFF",
      staffId: m.id, operatorId: m.operatorId,
      assignedFairId: m.fairId, assignedFairName: m.fairName,
      assignedRideId: m.rideId, assignedRideName: m.rideName,
      assignedRideEmoji: ride?.emoji ?? "🎡",
      assignedRideGradient: ride?.coverGradient ?? "from-blue-500 to-indigo-600",
      gate: m.gate, status: m.status, createdAt: m.joinedAt,
    };
  }
  return apiGet<StaffUser>("/staff/me/assignment");
}
