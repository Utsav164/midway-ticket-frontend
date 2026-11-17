"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Clock, Users, Shield, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency, clamp } from "@/lib/utils";
import { getRideById } from "@/lib/api/rides";
import { getFairById } from "@/lib/api/fairs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/index";
import { CustomerNavbar } from "@/components/layout/customer-navbar";
import { useCartStore } from "@/stores/cart.store";
import { ROUTES } from "@/config/app.config";
import type { Ride, Fair } from "@/types";

export default function RideDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const setItem  = useCartStore((s) => s.setItem);

  const [ride, setRide]       = useState<Ride | null>(null);
  const [fair, setFair]       = useState<Fair | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty]         = useState(1);

  useEffect(() => {
    getRideById(id).then(async (r) => {
      setRide(r);
      if (r) setFair(await getFairById(r.fairId));
      setLoading(false);
    });
  }, [id]);

  function handleBook() {
    if (!ride) return;
    setItem({
      rideId: ride.id,
      rideName: ride.name,
      fairId: ride.fairId,
      fairName: fair?.name ?? "",
      emoji: ride.emoji,
      coverGradient: ride.coverGradient,
      pricePerPerson: ride.pricePerPerson,
      quantity: qty,
    });
    router.push(ROUTES.checkout);
  }

  if (!loading && !ride) return <p className="p-10 text-slate-500">Ride not found.</p>;

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNavbar />
      <div className="pt-16">
        {/* Cover */}
        {loading ? (
          <Skeleton className="h-56 w-full rounded-none" />
        ) : (
          <div className={cn("h-56 bg-gradient-to-br flex items-center justify-center text-8xl", ride!.coverGradient)}>
            {ride!.emoji}
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 -mt-8 pb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <Link href={ROUTES.fairs}
              className="inline-flex items-center gap-1.5 text-sky-500 text-sm mb-5 hover:gap-2.5 transition-all">
              <ArrowLeft className="h-4 w-4" /> Back to fair
            </Link>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-2xl font-bold text-slate-900">{ride!.name}</h1>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                    {ride!.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold text-sm">{ride!.rating}</span>
                  </div>
                  <span className="text-slate-400 text-sm">({ride!.reviewCount} reviews)</span>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-5">{ride!.description}</p>

                {/* Ride specs */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl mb-6">
                  {[
                    { icon: Clock,   label: "Duration",  value: `${ride!.durationMinutes} min`    },
                    { icon: Users,   label: "Capacity",  value: `${ride!.capacity} seats`         },
                    { icon: Shield,  label: "Min Age",   value: ride!.minAge ? `${ride!.minAge}+` : "All ages" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="text-center">
                      <Icon className="h-4 w-4 text-sky-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Quantity selector */}
                <div className="mb-5">
                  <p className="font-semibold text-slate-900 mb-3 text-sm">Number of tickets</p>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <span className="text-slate-600 text-sm">Quantity</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQty((q) => clamp(q - 1, 1, 10))}
                        className="h-9 w-9 rounded-full border border-slate-300 flex items-center justify-center hover:border-sky-400 hover:text-sky-500 transition-colors"
                      ><Minus className="h-4 w-4" /></button>
                      <span className="font-bold text-slate-900 w-6 text-center text-lg">{qty}</span>
                      <button
                        onClick={() => setQty((q) => clamp(q + 1, 1, 10))}
                        className="h-9 w-9 rounded-full border border-slate-300 flex items-center justify-center hover:border-sky-400 hover:text-sky-500 transition-colors"
                      ><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 bg-sky-50 rounded-xl border border-sky-100 mb-5">
                  <span className="text-slate-600 text-sm">Total ({qty} × {formatCurrency(ride!.pricePerPerson)})</span>
                  <span className="text-2xl font-bold text-slate-900">{formatCurrency(ride!.pricePerPerson * qty)}</span>
                </div>

                <Button size="lg" className="w-full" onClick={handleBook} disabled={ride!.status !== "Active"}>
                  {ride!.status === "Active" ? "Continue to Checkout" : "Currently Unavailable"}
                </Button>

                <p className="text-center text-slate-400 text-xs mt-3 flex items-center justify-center gap-1">
                  <Shield className="h-3 w-3" /> QR ticket delivered to your email after payment
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
