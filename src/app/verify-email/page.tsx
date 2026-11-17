"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { QrCode, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/stores/auth.store";
import { ROUTES } from "@/config/app.config";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setStatus("error"); setError("This verification link is missing its token."); return; }
    verifyEmailToken(token)
      .then(() => setStatus("success"))
      .catch((e: any) => {
        setStatus("error");
        setError(e.message ?? "This verification link is invalid or has expired.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        <Link href={ROUTES.home} className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-xl bg-sky-500 flex items-center justify-center">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">Midway<span className="text-sky-500">Ticket</span></span>
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
          {status === "checking" && (
            <>
              <Loader2 className="h-8 w-8 text-sky-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Verifying your email…</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1.5">Email verified</h2>
              <p className="text-slate-500 text-sm mb-5">Your email address has been confirmed.</p>
              <Link href={ROUTES.home}>
                <Button className="w-full">Continue</Button>
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1.5">Verification failed</h2>
              <p className="text-slate-500 text-sm">{error}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
