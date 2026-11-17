"use client";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { MapPin, Calendar, ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { CustomerNavbar } from "@/components/layout/customer-navbar";
import { RideCard } from "@/components/customer/fair-ride-cards";
import { Skeleton } from "@/components/ui/index";
import { getFairById } from "@/lib/api/fairs";
import { getRidesByFair } from "@/lib/api/rides";
import { formatDateRange } from "@/lib/utils";
import { ROUTES } from "@/config/app.config";
import type { Fair, Ride, RideCategory } from "@/types";

const CATEGORIES: Array<"All" | RideCategory> = ["All", "Thrill", "Family", "Kids", "Games"];

export default function FairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [fair, setFair]       = useState<Fair | null>(null);
  const [rides, setRides]     = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat]         = useState<"All" | RideCategory>("All");

  useEffect(() => {
    Promise.all([getFairById(id), getRidesByFair(id)]).then(([f, r]) => {
      setFair(f);
      setRides(r);
      setLoading(false);
    });
  }, [id]);

  if (!loading && !fair) return notFound();

  const filtered = cat === "All" ? rides : rides.filter((r) => r.category === cat);

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNavbar />
      <div className="pt-16">
        {/* Hero */}
        {loading ? (
          <Skeleton className="h-56 w-full rounded-none" />
        ) : (
          <div className={`bg-gradient-to-br ${fair!.coverGradient} pt-10 pb-12 px-4`}>
            <div className="max-w-5xl mx-auto">
              <Link href={ROUTES.fairs}
                className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm transition-colors">
                <ArrowLeft className="h-4 w-4" /> All Fairs
              </Link>
              <div className="text-7xl mb-4">{fair!.emoji}</div>
              <h1 className="text-4xl font-bold text-white mb-2">{fair!.name}</h1>
              <div className="flex flex-wrap items-center gap-5 text-white/80 text-sm">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{fair!.city}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDateRange(fair!.startDate, fair!.endDate)}</span>
                <span className="flex items-center gap-1.5"><Package className="h-4 w-4" />{fair!.totalRides}+ Rides</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 py-10">
          {!loading && (
            <p className="text-slate-600 mb-8 max-w-2xl leading-relaxed">{fair!.description}</p>
          )}

          {/* Category filter */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  cat === c
                    ? "bg-sky-400 text-slate-900"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-sky-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white border border-slate-200">
                  <Skeleton className="h-32 w-full rounded-none" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-5">{filtered.length} ride{filtered.length !== 1 ? "s" : ""}</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((ride) => <RideCard key={ride.id} ride={ride} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
