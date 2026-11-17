// MidwayTicket — API Client
// Single integration point. Set NEXT_PUBLIC_USE_MOCK_API=true to use mock data.

import { APP_CONFIG } from "@/config/app.config";

export const isMockMode = APP_CONFIG.useMockApi;

const REQUEST_TIMEOUT_MS = 15_000;

// ── Typed API error ──────────────────────────────────────────────────────────
// Callers can check `err.status` to branch on 401/403/429/5xx without
// re-parsing anything. `err.message` is always a safe, user-facing string —
// never raw server/SQL/stack output.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | "network" | "timeout",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Token helpers ─────────────────────────────────────────────────────────────
// NOTE: localStorage is a stopgap, not the target architecture. Moving the
// access token to an HttpOnly+Secure+SameSite cookie removes it from JS
// entirely (mitigates XSS token theft) but requires the backend to set/read
// that cookie, which is a coordinated backend+frontend change — tracked
// separately, not done here. Until then: never log this value, never put it
// in a URL, and always clear it below on logout / on a 401 response.
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mt_token");
}
export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  token ? localStorage.setItem("mt_token", token) : localStorage.removeItem("mt_token");
}

// ── 401 handling ──────────────────────────────────────────────────────────────
// A request() call anywhere in the app can hit a 401 (expired/invalid token).
// Rather than every caller re-implementing "log the user out and redirect",
// register one handler once (see stores/auth.store.ts) and every 401 routes
// through it automatically.
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function registerUnauthorizedHandler(fn: UnauthorizedHandler) {
  onUnauthorized = fn;
}

async function safeJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

// ── Base fetch ────────────────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${APP_CONFIG.apiUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new ApiError("The request took too long. Please try again.", "timeout");
    }
    throw new ApiError("Can't reach the server. Check your connection and try again.", "network");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const body = await safeJson(res);
    const serverMessage = typeof body.message === "string" ? body.message : undefined;

    switch (res.status) {
      case 401:
        setToken(null);
        onUnauthorized?.();
        throw new ApiError("Your session has expired. Please log in again.", 401);
      case 403:
        throw new ApiError(
          serverMessage ?? "You don't have permission to do that.",
          403,
        );
      case 429:
        throw new ApiError("Too many requests — please wait a moment and try again.", 429);
      default:
        if (res.status >= 500) {
          throw new ApiError("Something went wrong on our end. Please try again shortly.", res.status);
        }
        // 4xx other than 401/403/429 — safe to surface the backend's own
        // validation message (already user-facing, not a stack trace).
        throw new ApiError(serverMessage ?? `Request failed (${res.status})`, res.status);
    }
  }

  const json = await safeJson(res);
  // Backend wraps: { success: true, data: T, timestamp: ... }
  return (json.data ?? json) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}
export function apiPost<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  return request<T>(path, {
    method:  "POST",
    body:    body !== undefined ? JSON.stringify(body) : undefined,
    headers,
  });
}
export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}
export function apiDelete(path: string): Promise<void> {
  return request<void>(path, { method: "DELETE" });
}
