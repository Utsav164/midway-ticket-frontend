import type { Fair } from "@/types";
import { isMockMode, apiGet, apiPost, apiPatch } from "./client";
import { MOCK_FAIRS } from "@/lib/mock/data";
import { MOCK_API_DELAY } from "@/config/app.config";
import { sleep } from "@/lib/utils";

export async function getFairs(): Promise<Fair[]> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_FAIRS; }
  return apiGet<Fair[]>("/fairs");
}

export async function getFairById(id: string): Promise<Fair | null> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_FAIRS.find(f => f.id === id) ?? null; }
  return apiGet<Fair>(`/fairs/${id}`).catch(() => null);
}

export async function getActiveFairs(): Promise<Fair[]> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_FAIRS.filter(f => f.status === "ACTIVE"); }
  return apiGet<Fair[]>("/fairs");
}

export async function getOperatorFairs(): Promise<Fair[]> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_FAIRS; }
  return apiGet<Fair[]>("/fairs/operator/mine");
}

export interface CreateFairParams {
  name: string;
  location: string;
  city: string;
  startDate: string; // ISO date, e.g. "2026-03-14"
  endDate: string;
  description?: string;
  coverGradient?: string;
  emoji?: string;
}

/**
 * Matches the live backend's CreateFairDto exactly (POST /fairs). Newly
 * created fairs land in DRAFT status on the backend (FairEntity's column
 * default) — they exist and can already have rides added to them, but are
 * NOT shown on the public /fairs listing until published. Call
 * `activateFair()` afterwards to publish, or let the operator do that later
 * from the fair's settings.
 */
export async function createFair(params: CreateFairParams): Promise<Fair> {
  if (isMockMode) {
    await sleep(MOCK_API_DELAY);
    const fair: Fair = {
      id: `mock-fair-${Date.now()}`,
      name: params.name,
      location: params.location,
      city: params.city,
      startDate: params.startDate,
      endDate: params.endDate,
      description: params.description ?? "",
      coverGradient: params.coverGradient ?? "from-sky-500 to-blue-600",
      emoji: params.emoji ?? "🎪",
      status: "DRAFT",
      totalRides: 0,
      minTicketPrice: 0,
      operatorId: "mock-operator",
    };
    return fair;
  }
  return apiPost<Fair>("/fairs", params);
}

/**
 * Publishes a fair so it shows up on the public /fairs listing and can be
 * booked by customers. Sends the backend's FairStatus enum value "ACTIVE" —
 * matches `Fair['status']` exactly now that the frontend type mirrors the
 * backend's real DRAFT/ACTIVE/ENDED values (see types/index.ts).
 */
export async function activateFair(id: string): Promise<Fair> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return { ...(MOCK_FAIRS.find(f => f.id === id) ?? MOCK_FAIRS[0]), status: "ACTIVE" }; }
  return apiPatch<Fair>(`/fairs/${id}`, { status: "ACTIVE" });
}
