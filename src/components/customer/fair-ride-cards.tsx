"use client";
import Link from "next/link";
import { MapPin, Calendar, ChevronRight, Star, Clock, Users } from "lucide-react";
import { cn, formatDateRange, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/app.config";
import type { Fair, Ride } from "@/types";

// ── FAIR CARD ─────────────────────────────────────────────────────────────────

interface FairCardProps {
  fair: Fair;
  className?: string;
}

export function FairCard({ fair, className }: FairCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group",
        className
      )}
    >
      {/* Cover */}
      <div className={cn("h-44 bg-gradient-to-br flex items-center justify-center relative", fair.coverGradient)}>
        <span className="text-6xl drop-shadow-sm">{fair.emoji}</span>
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-sm text-white">
            {fair.totalRides}+ Rides
          </span>
          {fair.status === "ACTIVE" && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500 text-white">
              Open Now
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-sky-600 transition-colors">
          {fair.name}
        </h3>
        <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{fair.city}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{formatDateRange(fair.startDate, fair.endDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">From</span>
            <span className="font-bold text-slate-900 ml-1">{formatCurrency(fair.minTicketPrice)}</span>
          </div>
          <Button size="sm" asChild>
            <Link href={ROUTES.fair(fair.id)}>
              Book Now <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── RIDE CARD ─────────────────────────────────────────────────────────────────

interface RideCardProps {
  ride: Ride;
  className?: string;
}

export function RideCard({ ride, className }: RideCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
        ride.status !== "Active" && "opacity-75",
        className
      )}
    >
      {/* Cover */}
      <div className={cn("h-32 bg-gradient-to-br flex items-center justify-center relative", ride.coverGradient)}>
        <span className="text-4xl">{ride.emoji}</span>
        {ride.status !== "Active" && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-sm font-bold bg-black/40 px-3 py-1 rounded-full">
              {ride.status}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-slate-900">{ride.name}</h3>
          <Badge variant={ride.category.toLowerCase() as "thrill" | "family" | "kids" | "games"}>
            {ride.category}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-amber-500 text-sm mb-3">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="font-semibold">{ride.rating}</span>
          <span className="text-slate-400">({ride.reviewCount})</span>
        </div>

        <div className="flex gap-3 text-slate-500 text-xs mb-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {ride.durationMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {ride.capacity} seats
          </span>
          {ride.minAge && <span>Age {ride.minAge}+</span>}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 text-lg">
              {formatCurrency(ride.pricePerPerson)}
            </span>
            <span className="text-slate-400 text-xs">/person</span>
          </div>
          {ride.status === "Active" ? (
            <Button size="sm" asChild>
              <Link href={ROUTES.ride(ride.id)}>Book Now</Link>
            </Button>
          ) : (
            <Button size="sm" variant="ghost" disabled>
              Unavailable
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
