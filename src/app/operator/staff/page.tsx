"use client";
import { useEffect, useState } from "react";
import { Plus, ScanLine, Users, Activity, Shield } from "lucide-react";
import Link from "next/link";
import { Badge, Skeleton } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { getStaffList, toggleStaffStatus } from "@/lib/api/staff";
import { formatTime } from "@/lib/utils";
import { ROUTES } from "@/config/app.config";
import type { StaffMember } from "@/types";

export default function StaffManagementPage() {
  const [staff, setStaff]     = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     getStaffList().then((s) => setStaff(s)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleToggle(member: StaffMember) {
    const next = member.status === "Active" ? "Inactive" : "Active";
    await toggleStaffStatus(member.id, next);
    setStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, status: next } : s));
  }

  const active = staff.filter((s) => s.status === "Active");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-500 text-sm">
          {active.length} of {staff.length} staff members active
        </p>
        <Button asChild><Link href={ROUTES.operatorStaffNew}><Plus className="h-4 w-4" /> Add Staff</Link></Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Staff",  value: staff.length,                               icon: Users,    col: "sky"    },
          { label: "Active Now",   value: active.length,                              icon: Activity, col: "green"  },
          { label: "Scans Today",  value: staff.reduce((a, s) => a + s.scansToday, 0), icon: ScanLine, col: "purple" },
        ].map(({ label, value, icon: Icon, col }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
            <div className={`h-10 w-10 rounded-xl bg-${col}-50 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-5 w-5 text-${col}-500`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">All Staff Members</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {["Staff Member","Assigned Ride","Gate","Status","Scans Today","Last Scan","Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center font-bold text-sky-600 text-sm flex-shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{s.name}</p>
                          <p className="text-slate-400 text-xs">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900 text-sm">{s.rideName}</p>
                      <p className="text-slate-400 text-xs">{s.fairName}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{s.gate}</td>
                    <td className="px-5 py-4">
                      <Badge variant={s.status.toLowerCase() as "active" | "inactive"}>{s.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-900 font-semibold text-sm">
                      {s.scansToday} <span className="text-slate-400 font-normal text-xs">scans</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm">
                      {s.lastScanAt ? formatTime(s.lastScanAt) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button className="text-sky-500 text-xs font-semibold hover:underline">View</button>
                        <button
                          onClick={() => handleToggle(s)}
                          className={`text-xs font-semibold hover:underline ${
                            s.status === "Active" ? "text-red-400" : "text-green-500"
                          }`}
                        >
                          {s.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permission note */}
      <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex gap-3 items-start">
        <Shield className="h-5 w-5 text-sky-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sky-800 text-sm">Staff Permission Model</p>
          <p className="text-sky-700 text-xs mt-0.5 leading-relaxed">
            Each staff account can only scan QR tickets for their assigned ride. Revenue, analytics,
            payment data, and other rides are not visible to scanner staff. This is a UI restriction —
            the backend enforces the same rules independently.
          </p>
        </div>
      </div>
    </div>
  );
}
