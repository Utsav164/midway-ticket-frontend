"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScannerUI } from "@/components/staff/scanner-ui";
import { useAuthStore, useStaffUser } from "@/stores/auth.store";
import { ROUTES } from "@/config/app.config";

// NOTE: This page enforces UI-level access control only.
// The real backend (NestJS) must independently verify:
//   - Valid staff JWT token
//   - Staff account is Active
//   - Requested ticket belongs to the staff's assigned ride
// Never rely solely on frontend guards for security.

export default function StaffScannerPage() {
  const router    = useRouter();
  const staffUser = useStaffUser();
  const user      = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || user.role !== "SCANNER_STAFF") {
      router.replace(ROUTES.staffLogin);
    }
  }, [user, router]);

  if (!staffUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Staff accounts go DIRECTLY to the scanner — no other navigation available
  return <ScannerUI staff={staffUser} />;
}
