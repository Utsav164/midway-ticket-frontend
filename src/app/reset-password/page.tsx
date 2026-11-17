"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/index";
import { resetPasswordWithToken } from "@/stores/auth.store";
import { ROUTES } from "@/config/app.config";

const schema = z
  .object({
    password:        z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    if (!token) { setError("This reset link is missing its token. Please request a new one."); return; }
    setLoading(true);
    setError(null);
    try {
      await resetPasswordWithToken(token, values.password);
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? "This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        <Link href={ROUTES.home} className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-xl bg-sky-500 flex items-center justify-center">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">Midway<span className="text-sky-500">Ticket</span></span>
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          {done ? (
            <div className="text-center">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1.5">Password reset</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">
                Your password has been changed. Any previously logged-in sessions have been signed out for your security.
              </p>
              <Button className="w-full" onClick={() => router.push(ROUTES.operatorLogin)}>
                Continue to Login
              </Button>
            </div>
          ) : !token ? (
            <div className="text-center">
              <p className="text-slate-700 font-semibold mb-1.5">Invalid link</p>
              <p className="text-slate-500 text-sm mb-5">
                This reset link is missing its token. Please request a new one.
              </p>
              <Link href={ROUTES.forgotPassword}>
                <Button className="w-full">Request New Link</Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Set a new password</h2>
              <p className="text-slate-500 text-sm mb-6">Choose a new password for your account.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label className="block mb-1.5">New Password</Label>
                  <Input type="password" autoFocus {...register("password")} error={errors.password?.message} />
                </div>
                <div>
                  <Label className="block mb-1.5">Confirm Password</Label>
                  <Input type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
                </div>
                {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
