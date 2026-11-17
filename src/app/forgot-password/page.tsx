"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QrCode, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/index";
import { requestPasswordReset } from "@/stores/auth.store";
import { ROUTES } from "@/config/app.config";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);
    try {
      // Backend always returns the same generic response whether or not the
      // email is registered — this page mirrors that on purpose, so this
      // screen itself can't be used to check which emails exist either.
      await requestPasswordReset(values.email);
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
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
          {sent ? (
            <div className="text-center">
              <div className="h-12 w-12 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-sky-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1.5">Check your email</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                If an account exists for that address, we've sent a link to reset your password.
                It expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Forgot password?</h2>
              <p className="text-slate-500 text-sm mb-6">
                Enter your account email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label className="block mb-1.5">Email</Label>
                  <Input type="email" autoFocus {...register("email")} error={errors.email?.message} />
                </div>
                {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
          <p className="text-center mt-6 pt-4 border-t border-slate-100">
            <Link href={ROUTES.operatorLogin} className="text-sky-500 text-sm font-semibold hover:underline">
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
