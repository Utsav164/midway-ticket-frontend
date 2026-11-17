import type { Ride, RideCategory } from "@/types";
import { isMockMode, apiGet, apiPost, apiPatch } from "./client";
import { MOCK_RIDES } from "@/lib/mock/data";
import { MOCK_API_DELAY } from "@/config/app.config";
import { sleep } from "@/lib/utils";
import { getOperatorFairs } from "./fairs";

export async function getRidesByFair(fairId: string): Promise<Ride[]> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_RIDES.filter(r => r.fairId === fairId); }
  return apiGet<Ride[]>(`/rides/fair/${fairId}`);
}

export async function getRideById(id: string): Promise<Ride | null> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_RIDES.find(r => r.id === id) ?? null; }
  return apiGet<Ride>(`/rides/${id}`).catch(() => null);
}

/**
 * There is no /rides/operator/all endpoint on the backend — an operator's
 * rides are scoped through their fairs. This fetches the operator's fairs
 * first, then all rides for each fair in parallel, and flattens the result.
 * Two real request round-trips instead of one, but it's the correct shape
 * of the actual backend contract rather than an invented endpoint.
 */
export async function getOperatorRides(): Promise<Ride[]> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_RIDES; }
  const fairs = await getOperatorFairs();
  const rideLists = await Promise.all(fairs.map((f) => getRidesByFair(f.id)));
  return rideLists.flat();
}

export async function updateRideStatus(rideId: string, status: Ride["status"]): Promise<Ride> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    const ride = MOCK_RIDES.find(r => r.id === rideId)!;
    return { ...ride, status };
  }
  return apiPatch<Ride>(`/rides/${rideId}`, { status });
}

/**
 * The "Edit Ride" button on the operator Rides page had no handler either
 * (same dead-button pattern as "Add Ride" before it) and nothing to call.
 * Matches the live backend's UpdateRideDto exactly — note the backend only
 * accepts `name`, `pricePerPerson`, and `status` for updates (not category,
 * description, duration, minAge, or capacity), so that's all this exposes.
 */
export interface UpdateRideParams {
  name?: string;
  pricePerPerson?: number;
  status?: Ride["status"];
}

export async function updateRide(rideId: string, params: UpdateRideParams): Promise<Ride> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    const ride = MOCK_RIDES.find(r => r.id === rideId)!;
    return { ...ride, ...params };
  }
  return apiPatch<Ride>(`/rides/${rideId}`, params);
}

export interface CreateRideParams {
  fairId: string;
  name: string;
  category: RideCategory;
  pricePerPerson: number;
  description?: string;
  emoji?: string;
  coverGradient?: string;
  durationMinutes?: number;
  minAge?: number;
  capacity?: number;
}

/**
 * This function didn't exist at all before this fix — the "Add Ride" button
 * on the operator Rides page had no handler and nothing to call. Matches
 * the live backend's CreateRideDto exactly (POST /rides/fair/:fairId).
 */
export async function createRide(params: CreateRideParams): Promise<Ride> {
  const { fairId, ...dto } = params;
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    const ride: Ride = {
      id: `mock-ride-${Date.now()}`,
      fairId,
      name: dto.name,
      description: dto.description ?? "",
      category: dto.category,
      emoji: dto.emoji ?? "🎡",
      coverGradient: dto.coverGradient ?? "from-sky-500 to-blue-600",
      pricePerPerson: dto.pricePerPerson,
      durationMinutes: dto.durationMinutes ?? 5,
      minAge: dto.minAge ?? null,
      capacity: dto.capacity ?? 1,
      rating: 0,
      reviewCount: 0,
      status: "Active",
      ticketsSoldToday: 0,
      totalRevenue: 0,
    };
    return ride;
  }
  return apiPost<Ride>(`/rides/fair/${fairId}`, dto);
}
