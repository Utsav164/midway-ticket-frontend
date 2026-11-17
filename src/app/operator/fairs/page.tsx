"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MapPin, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/index";
import { getOperatorFairs } from "@/lib/api/fairs";
import { formatDateRange, getFairStatusLabel } from "@/lib/utils";
import { ROUTES } from "@/config/app.config";
import type { Fair } from "@/types";

export default function OperatorFairsPage() {
  const [fairs, setFairs]     = useState<Fair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOperatorFairs().then(setFairs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-500 text-sm">
          {fairs.length} {fairs.length === 1 ? "fair" : "fairs"}
        </p>
        <Button asChild><Link href={ROUTES.operatorFairsNew}><Plus className="h-4 w-4" /> Create Fair</Link></Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : fairs.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
            <Ticket className="h-6 w-6 text-sky-500" />
          </div>
          <h2 className="font-bold text-slate-900 mb-1">No fairs yet</h2>
          <p className="text-slate-500 text-sm mb-5">Create your first fair to start adding rides and selling tickets.</p>
          <Button asChild size="lg">
            <Link href={ROUTES.operatorFairsNew}>Create Your First Fair</Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {fairs.map((fair) => (
            <div key={fair.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`h-24 bg-gradient-to-br ${fair.coverGradient} flex items-center justify-center text-4xl relative`}>
                {fair.emoji}
                <div className="absolute top-3 right-3">
                  <Badge variant={fair.status === "ACTIVE" ? "active" : "inactive"}>
                    {getFairStatusLabel(fair.status)}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 mb-1">{fair.name}</h3>
                <p className="flex items-center gap-1.5 text-slate-500 text-xs mb-2">
                  <MapPin className="h-3.5 w-3.5" /> {fair.location}, {fair.city}
                </p>
                <p className="text-slate-400 text-xs mb-4">{formatDateRange(fair.startDate, fair.endDate)}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" asChild>
                    <Link href={`${ROUTES.operatorRidesNew}?fairId=${fair.id}`}>Add Ride</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
