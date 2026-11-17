"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, OperatorUser, StaffUser, Customer } from "@/types";
import { isMockMode, apiPost, setToken, registerUnauthorizedHandler, ApiError } from "@/lib/api/client";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  loginAsCustomer: (email: string, password: string) => Promise<void>;
  /**
   * There is no separate customer login page in this MVP — checkout is the
   * only place a customer identity is needed (POST /bookings requires a
   * JWT). This registers a new account, or falls back to logging in if the
   * email is already registered, so checkout works in one step either way.
   */
  registerOrLoginCustomer: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginAsOperator: (email: string, password: string) => Promise<void>;
  /**
   * Operator signup — creates both the User (role OPERATOR_OWNER) and its
   * linked OperatorEntity in one call (see backend AuthService.registerOperator).
   * Without this, there was no way for a new operator to ever get an
   * account: the generic /auth/register endpoint only creates customers.
   */
  registerOperator: (name: string, email: string, password: string, businessName: string, phone?: string) => Promise<void>;
  loginAsStaff:    (email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

// Used ONLY when NEXT_PUBLIC_USE_MOCK_API=true — never referenced from a
// real-mode code path below. If you're looking at these values in a
// production screenshot, mock mode is on and needs turning off.
const MOCK_CUSTOMER: Customer = {
  id: "mock-customer-id", name: "Demo Customer", email: "demo@example.com",
  phone: "+91 90000 00000", role: "CUSTOMER", createdAt: "2026-01-01",
};
const MOCK_OPERATOR: OperatorUser = {
  id: "mock-operator-id", name: "Demo Operator", email: "demo.operator@example.com",
  phone: "+91 90000 00001", role: "OPERATOR_OWNER",
  operatorId: "mock-operator-org", operatorName: "Demo Fair Co.", createdAt: "2026-01-01",
};
const MOCK_STAFF: StaffUser = {
  id: "mock-staff-id", name: "Demo Staff", email: "demo.staff@example.com",
  phone: "+91 90000 00002", role: "SCANNER_STAFF", staffId: "mock-staff-id",
  operatorId: "mock-operator-org", assignedFairId: "mock-fair-id", assignedFairName: "Demo Fair",
  assignedRideId: "mock-ride-id", assignedRideName: "Demo Ride",
  assignedRideEmoji: "🎡", assignedRideGradient: "from-blue-500 to-indigo-600",
  gate: "Gate 1", status: "Active", createdAt: "2026-08-05",
};

// ── Real backend response shapes (see AuthService.issueTokens / loginStaff) ────
interface CustomerLoginResponse { accessToken: string; userId: string; email: string; name: string; role: string; emailVerified?: boolean; }
interface OperatorLoginResponse { accessToken: string; userId: string; email: string; name: string; role: string; operatorId: string; operatorName: string; emailVerified?: boolean; }
interface StaffLoginResponse {
  accessToken: string; staffId: string; gate: string;
  // A staff login response has EITHER assignedRide+assignedFair (Fair's
  // ride) OR assignedEvent (standalone event) — never both.
  assignedRide?: { id: string; name: string };
  assignedFair?: { id: string; name: string };
  assignedEvent?: { id: string; name: string };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      loginAsCustomer: async (email: string, password: string) => {
        if (isMockMode) { set({ user: MOCK_CUSTOMER }); return; }
        set({ isLoading: true });
        try {
          const res = await apiPost<CustomerLoginResponse>("/auth/login/customer", { email, password });
          setToken(res.accessToken);
          const user: Customer = {
            id: res.userId, name: res.name, email: res.email,
            role: "CUSTOMER", createdAt: new Date().toISOString(),
            emailVerified: res.emailVerified,
          };
          set({ user });
        } finally { set({ isLoading: false }); }
      },

      registerOrLoginCustomer: async (name: string, email: string, password: string, phone?: string) => {
        if (isMockMode) { set({ user: { ...MOCK_CUSTOMER, name, email } }); return; }
        set({ isLoading: true });
        try {
          let res: CustomerLoginResponse;
          try {
            res = await apiPost<CustomerLoginResponse>("/auth/register", { name, email, password, phone });
          } catch (err) {
            // 409 = email already registered on a previous visit — fall back
            // to logging in with the password just entered rather than
            // failing the whole checkout.
            if (err instanceof ApiError && err.status === 409) {
              res = await apiPost<CustomerLoginResponse>("/auth/login/customer", { email, password });
            } else {
              throw err;
            }
          }
          setToken(res.accessToken);
          const user: Customer = {
            id: res.userId, name: res.name, email: res.email, phone,
            role: "CUSTOMER", createdAt: new Date().toISOString(),
            emailVerified: res.emailVerified,
          };
          set({ user });
        } finally { set({ isLoading: false }); }
      },

      loginAsOperator: async (email: string, password: string) => {
        if (isMockMode) { set({ user: MOCK_OPERATOR }); return; }
        set({ isLoading: true });
        try {
          // Backend returns operatorId AND operatorName directly in the auth
          // payload — using res.name here previously showed the owner's
          // personal name instead of the actual business/fair name.
          const res = await apiPost<OperatorLoginResponse>("/auth/login/operator", { email, password });
          setToken(res.accessToken);
          const user: OperatorUser = {
            id: res.userId, name: res.name, email: res.email,
            role: "OPERATOR_OWNER",
            operatorId:   res.operatorId ?? "",
            operatorName: res.operatorName || res.name, // fallback only if somehow blank
            createdAt: new Date().toISOString(),
            emailVerified: res.emailVerified,
          };
          set({ user });
        } finally { set({ isLoading: false }); }
      },

      registerOperator: async (name: string, email: string, password: string, businessName: string, phone?: string) => {
        if (isMockMode) {
          set({ user: { ...MOCK_OPERATOR, name, email, operatorName: businessName } });
          return;
        }
        set({ isLoading: true });
        try {
          const res = await apiPost<OperatorLoginResponse>("/auth/register/operator", {
            name, email, password, phone, businessName,
          });
          setToken(res.accessToken);
          // businessName is known right here at signup time — no need to
          // guess it from a fairs lookup like loginAsOperator does, since a
          // brand-new operator has zero fairs yet.
          const user: OperatorUser = {
            id: res.userId, name: res.name, email: res.email,
            role: "OPERATOR_OWNER",
            operatorId:   res.operatorId ?? "",
            operatorName: businessName,
            createdAt: new Date().toISOString(),
            emailVerified: res.emailVerified,
          };
          set({ user });
        } finally { set({ isLoading: false }); }
      },

      loginAsStaff: async (email: string, password: string) => {
        if (isMockMode) { set({ user: MOCK_STAFF }); return; }
        set({ isLoading: true });
        try {
          const res = await apiPost<StaffLoginResponse>("/auth/login/staff", { email, password });
          setToken(res.accessToken);
          const user: StaffUser = res.assignedEvent
            ? {
                id: res.staffId, name: "", email, role: "SCANNER_STAFF",
                staffId: res.staffId,
                operatorId: "",
                assignedEventId: res.assignedEvent.id, assignedEventName: res.assignedEvent.name,
                assignedEventEmoji: "🎫", assignedEventGradient: "from-slate-500 to-slate-700",
                gate: res.gate, status: "Active", createdAt: new Date().toISOString(),
              }
            : {
                id: res.staffId, name: "", email, role: "SCANNER_STAFF",
                staffId: res.staffId,
                operatorId: "",
                assignedFairId: res.assignedFair!.id, assignedFairName: res.assignedFair!.name,
                assignedRideId: res.assignedRide!.id, assignedRideName: res.assignedRide!.name,
                assignedRideEmoji: "🎡", assignedRideGradient: "from-blue-500 to-indigo-600",
                gate: res.gate, status: "Active", createdAt: new Date().toISOString(),
              };
          set({ user });
        } finally { set({ isLoading: false }); }
      },

      logout: () => { setToken(null); set({ user: null }); },
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: "midway-auth",
      // Never persist the access token here — it already lives in
      // localStorage via setToken()/getToken() (see client.ts). Persisting
      // it a second time in this store would be one more place a leak could
      // come from for no benefit.
      partialize: (s) => ({ user: s.user }),
    }
  )
);

// Any 401 anywhere in the app clears auth state, not just the token.
registerUnauthorizedHandler(() => {
  useAuthStore.setState({ user: null });
});

export const useCurrentUser  = () => useAuthStore(s => s.user);
export const useIsOperator   = () => { const u = useAuthStore(s => s.user); return u?.role === "OPERATOR_OWNER" || u?.role === "OPERATOR_MANAGER"; };
export const useIsStaff      = () => useAuthStore(s => s.user?.role === "SCANNER_STAFF");
export const useStaffUser    = () => { const u = useAuthStore(s => s.user); return u?.role === "SCANNER_STAFF" ? u as StaffUser : null; };
export const useOperatorUser = () => { const u = useAuthStore(s => s.user); return (u?.role === "OPERATOR_OWNER" || u?.role === "OPERATOR_MANAGER") ? u as OperatorUser : null; };

// ── Email verification & password reset ─────────────────────────────────────
// Plain functions, not store actions — none of these need to touch the
// logged-in `user` state (verification/reset happen via an emailed link,
// not necessarily in an active session), so there's nothing to `set()` here.

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  if (isMockMode) return { message: "If that email is registered, a password reset link has been sent." };
  return apiPost<{ message: string }>("/auth/forgot-password", { email });
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ message: string }> {
  if (isMockMode) return { message: "Your password has been reset. Please log in with your new password." };
  return apiPost<{ message: string }>("/auth/reset-password", { token, newPassword });
}

export async function verifyEmailToken(token: string): Promise<{ verified: boolean }> {
  if (isMockMode) return { verified: true };
  return apiPost<{ verified: boolean }>("/auth/verify-email", { token });
}

export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  if (isMockMode) return { message: "If that account exists and isn't verified yet, a new verification email has been sent." };
  return apiPost<{ message: string }>("/auth/resend-verification", { email });
}
