"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ScanLine, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/index";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/config/app.config";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function StaffLoginPage() {
  const router = useRouter();
  const loginAsStaff = useAuthStore(s => s.loginAsStaff);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);
    try {
      await loginAsStaff(values.email, values.password);
      router.push(ROUTES.staffScanner);
    } catch (e: any) {
      setError(e.message ?? "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0F172A 0%, #0C1C3A 100%)" }}>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-sky-400 flex items-center justify-center mx-auto mb-4">
            <ScanLine className="h-8 w-8 text-slate-900" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Staff Login</h1>
          <p className="text-slate-400 text-sm">Sign in to access your ride scanner.</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-5">
            <div><Label className="block mb-1.5">Staff Email</Label><Input type="email" {...register("email")} error={errors.email?.message} /></div>
            <div><Label className="block mb-1.5">Password</Label><Input type="password" {...register("password")} error={errors.password?.message} /></div>
            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
            <Button type="submit" size="lg" className="w-full" loading={loading}>Sign In to Scanner</Button>
          </form>
          <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2">
            <Shield className="h-4 w-4 text-sky-500 flex-shrink-0 mt-0.5" />
            <p className="text-slate-500 text-xs leading-relaxed">Staff accounts only show the QR scanner for your assigned ride.</p>
          </div>
        </div>
        <div className="text-center mt-5">
          <Link href={ROUTES.operatorLogin} className="text-slate-500 text-sm hover:text-slate-300">← Operator login</Link>
        </div>
      </div>
    </div>
  );
}
