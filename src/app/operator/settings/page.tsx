"use client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/index";
import { useOperatorUser } from "@/stores/auth.store";

export default function OperatorSettingsPage() {
  const operator = useOperatorUser();

  return (
    <div className="max-w-2xl space-y-5">
      {/* Account */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4">Account Details</h2>
        <div className="space-y-4">
          {[
            ["Fair / Business Name", operator?.operatorName ?? ""],
            ["Owner Name",           operator?.name ?? ""],
            ["Email",                operator?.email ?? ""],
            ["Mobile",               operator?.phone ?? ""],
          ].map(([label, val]) => (
            <div key={label}>
              <Label className="block mb-1.5">{label}</Label>
              <Input defaultValue={val} />
            </div>
          ))}
        </div>
        <Button className="mt-5">Save Changes</Button>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-1">Subscription Plan</h2>
        <p className="text-slate-500 text-sm mb-4">You are currently on the Growth plan.</p>
        <div className="flex items-center justify-between p-4 bg-sky-50 rounded-xl border border-sky-100 mb-4">
          <div>
            <p className="font-bold text-slate-900">Growth Plan</p>
            <p className="text-slate-500 text-sm">Up to 10 rides · Multiple staff accounts · Full analytics</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-sky-500 text-lg">₹999<span className="text-sm font-normal text-slate-400">/mo</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Upgrade to Enterprise</Button>
          <Button variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50">Cancel Plan</Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <h2 className="font-bold text-red-800 mb-1">Danger Zone</h2>
        <p className="text-red-600 text-sm mb-4">These actions are permanent and cannot be undone.</p>
        <Button variant="destructive" size="sm">Delete Operator Account</Button>
      </div>
    </div>
  );
}
