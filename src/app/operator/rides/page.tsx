"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Settings, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/index";
import { getOperatorRides, updateRideStatus } from "@/lib/api/rides";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/config/app.config";
import type { Ride } from "@/types";

export default function OperatorRidesPage() {
  const [rides, setRides]     = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOperatorRides().then((r) => setRides(r)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function toggleStatus(ride: Ride) {
    const next = ride.status === "Active" ? "Paused" : "Active";
    const updated = await updateRideStatus(ride.id, next);
    setRides((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-500 text-sm">
            {rides.filter((r) => r.status === "Active").length} of {rides.length} rides active
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.operatorRidesNew}><Plus className="h-4 w-4" /> Add Ride</Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rides.map((ride) => (
            <div key={ride.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Cover */}
              <div className={`h-28 bg-gradient-to-br ${ride.coverGradient} flex items-center justify-center text-4xl relative`}>
                {ride.emoji}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => toggleStatus(ride)}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                      ride.status === "Active"
                        ? "bg-green-500 text-white hover:bg-green-400"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {ride.status}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-900">{ride.name}</h3>
                  <span className="font-bold text-sky-500">{formatCurrency(ride.pricePerPerson)}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={ride.category.toLowerCase() as "thrill" | "family" | "kids" | "games"}>
                    {ride.category}
                  </Badge>
                  <span className="flex items-center gap-1 text-amber-500 text-xs">
                    <Star className="h-3 w-3 fill-current" /> {ride.rating}
                  </span>
                  <span className="text-slate-400 text-xs">{ride.durationMinutes} min</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold text-slate-900">{ride.ticketsSoldToday}</p>
                    <p className="text-xs text-slate-500">Tickets today</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(ride.totalRevenue)}</p>
                    <p className="text-xs text-slate-500">Revenue</p>
                  </div>
                </div>

                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href={`${ROUTES.operatorRides}/${ride.id}/edit`}>
                    <Settings className="h-3.5 w-3.5" /> Edit Ride
                  </Link>
                </Button>
              </div>
            </div>
          ))}

          {/* Add new ride card */}
          <Link
            href={ROUTES.operatorRidesNew}
            className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 transition-all group min-h-[240px]"
          >
            <div className="h-12 w-12 rounded-2xl bg-slate-200 group-hover:bg-sky-400 flex items-center justify-center mb-3 transition-colors">
              <Plus className="h-6 w-6 text-slate-500 group-hover:text-slate-900" />
            </div>
            <p className="font-semibold text-slate-600 group-hover:text-slate-900">Add New Ride</p>
            <p className="text-slate-400 text-sm mt-1">Set price, duration, capacity</p>
          </Link>
        </div>
      )}
    </div>
  );
}
