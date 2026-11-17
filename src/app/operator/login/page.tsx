"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { QrCode, BarChart2, Ticket, ScanLine, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/index";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/config/app.config";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});
type FormValues = z.infer<typeof schema>;

const FEATURES = [
  { icon: BarChart2, text: "Real-time revenue & sales dashboard" },
  { icon: Ticket,    text: "QR ticket management for all rides"  },
  { icon: ScanLine,  text: "Staff scanner accounts per ride"     },
  { icon: Shield,    text: "Role-based access control"           },
];

export default function OperatorLoginPage() {
  const router  = useRouter();
  const loginAsOperator = useAuthStore(s => s.loginAsOperator);
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
      await loginAsOperator(values.email, values.password);
      router.push(ROUTES.operatorDashboard);
    } catch (e: any) {
      setError(e.message ?? "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16">
        <Link href={ROUTES.home} className="flex items-center gap-2.5 mb-12">
          <div className="h-9 w-9 rounded-xl bg-sky-400 flex items-center justify-center">
            <QrCode className="h-5 w-5 text-slate-900" />
          </div>
          <span className="font-bold text-xl text-white">Midway<span className="text-sky-400">Ticket</span></span>
        </Link>
        <h1 className="text-4xl font-bold text-white mb-3 leading-tight">Run your fair<br /><span className="text-sky-400">smarter.</span></h1>
        <p className="text-slate-400 text-lg mb-10 max-w-sm leading-relaxed">Every ticket, every ride, every rupee — tracked in real time.</p>
        <div className="space-y-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-sky-400/15 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-sky-400" />
              </div>
              <span className="text-slate-300 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Operator Login</h2>
            <p className="text-slate-500 text-sm mb-6">Sign in to your operator account.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div><Label className="block mb-1.5">Email</Label><Input {...register("email")} error={errors.email?.message} /></div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Password</Label>
                  <Link href={ROUTES.forgotPassword} className="text-sky-500 text-xs font-semibold hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input type="password" {...register("password")} error={errors.password?.message} />
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
              <Button type="submit" size="lg" className="w-full" loading={loading}>Sign In to Dashboard</Button>
            </form>
            <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-2">
              <p className="text-slate-500 text-xs">
                New operator? <Link href={ROUTES.operatorSignup} className="text-sky-500 font-semibold hover:underline">Create an account</Link>
              </p>
              <Link href={ROUTES.staffLogin} className="text-sky-500 text-xs hover:underline block">Scanner Staff login →</Link>
            </div>
          </div>
          <p className="text-center mt-4">
            <Link href={ROUTES.home} className="text-slate-500 text-sm hover:text-slate-300">← Back to MidwayTicket</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
