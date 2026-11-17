"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Shield, MapPin, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Skeleton } from "@/components/ui/index";
import { cn } from "@/lib/utils";
import { createStaff } from "@/lib/api/staff";
import { getOperatorFairs } from "@/lib/api/fairs";
import { getRidesByFair } from "@/lib/api/rides";
import { getOperatorEvents } from "@/lib/api/events";
import { ROUTES } from "@/config/app.config";
import type { Fair, Ride, Event } from "@/types";

const schema = z.object({
  name:    z.string().min(2, "Enter full name"),
  email:   z.string().email("Enter a valid work email"),
  phone:   z.string().min(10, "Enter a valid mobile number"),
  password: z.string().min(8, "At least 8 characters"),
  // Only one of these pairs is actually required, depending on
  // `assignmentType` below — validated by hand in onSubmit, not here,
  // since which fields are required flips based on that toggle.
  fairId:  z.string().optional(),
  rideId:  z.string().optional(),
  eventId: z.string().optional(),
  gate:    z.string().min(1, "Select a gate"),
});
type FormValues = z.infer<typeof schema>;

const GATES = ["Gate 1","Gate 2","Gate 3","Gate 4","Gate 5","Gate 6"];

export default function NewStaffPage() {
  const router = useRouter();
  // A staff member is assigned to EITHER a Fair's ride OR a standalone
  // Event — never both. This toggle decides which fields below apply.
  const [assignmentType, setAssignmentType] = useState<"ride" | "event">("ride");

  const [loading, setLoading]         = useState(false);
  const [fairsLoading, setFairsLoading] = useState(true);
  const [fairs, setFairs]             = useState<Fair[]>([]);
  const [rides, setRides]             = useState<Ride[]>([]);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [events, setEvents]           = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { gate: "Gate 1", fairId: "", rideId: "", eventId: "" },
  });

  useEffect(() => {
    getOperatorFairs()
      .then((f) => {
        setFairs(f);
        if (f.length === 1) setValue("fairId", f[0].id);
      })
      .catch(() => setError("Couldn't load your fairs. Please refresh and try again."))
      .finally(() => setFairsLoading(false));

    getOperatorEvents()
      .then(setEvents)
      .catch(() => {/* non-fatal — Ride assignment still works fine without this */})
      .finally(() => setEventsLoading(false));
  }, [setValue]);

  const selectedFairId = watch("fairId");

  useEffect(() => {
    if (!selectedFairId) { setRides([]); return; }
    setRidesLoading(true);
    getRidesByFair(selectedFairId)
      .then(setRides)
      .catch(() => setError("Couldn't load rides for this fair."))
      .finally(() => setRidesLoading(false));
  }, [selectedFairId]);

  const selectedRideId  = watch("rideId");
  const selectedRide    = rides.find((r) => r.id === selectedRideId);
  const selectedFair    = fairs.find((f) => f.id === selectedFairId);
  const selectedEventId = watch("eventId");
  const selectedEvent   = events.find((e) => e.id === selectedEventId);
  const staffName       = watch("name");

  async function onSubmit(values: FormValues) {
    setError(null);
    if (assignmentType === "ride" && (!values.fairId || !values.rideId)) {
      setError("Select a fair and a ride to assign this staff member to.");
      return;
    }
    if (assignmentType === "event" && !values.eventId) {
      setError("Select an event to assign this staff member to.");
      return;
    }

    setLoading(true);
    try {
      await createStaff({
        name: values.name, email: values.email, phone: values.phone,
        password: values.password, gate: values.gate,
        ...(assignmentType === "event"
          ? { eventId: values.eventId }
          : { rideId: values.rideId, fairId: values.fairId }),
      });
      router.push(ROUTES.operatorStaff);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't create staff account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link href={ROUTES.operatorStaff}
        className="inline-flex items-center gap-1.5 text-sky-500 text-sm mb-6 hover:gap-2.5 transition-all">
        <ArrowLeft className="h-4 w-4" /> Back to Staff Management
      </Link>

      <div className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <Label className="block mb-1.5">Full Name <span className="text-red-400">*</span></Label>
                <Input placeholder="e.g. Priya Nair" {...register("name")} error={errors.name?.message} />
              </div>
              <div>
                <Label className="block mb-1.5">Work Email <span className="text-red-400">*</span></Label>
                <Input type="email" placeholder="name@yourcompany.in" {...register("email")} error={errors.email?.message} />
              </div>
              <div>
                <Label className="block mb-1.5">Mobile Number</Label>
                <Input type="tel" placeholder="+91 98765 43210" {...register("phone")} error={errors.phone?.message} />
              </div>
              <div>
                <Label className="block mb-1.5">Temporary Password</Label>
                <Input type="password" placeholder="Staff will use this to log in" {...register("password")} error={errors.password?.message} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-1">Assignment</h2>
            <p className="text-slate-500 text-sm mb-4">
              Each staff member is assigned to exactly one ride or one standalone event,
              and can only scan tickets for that assignment.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setAssignmentType("ride")}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition-colors",
                  assignmentType === "ride" ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <MapPin className={cn("h-4 w-4 mb-1.5", assignmentType === "ride" ? "text-sky-600" : "text-slate-400")} />
                <p className={cn("font-semibold text-sm", assignmentType === "ride" ? "text-sky-700" : "text-slate-700")}>Fair's Ride</p>
              </button>
              <button
                type="button"
                onClick={() => setAssignmentType("event")}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition-colors",
                  assignmentType === "event" ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <TicketIcon className={cn("h-4 w-4 mb-1.5", assignmentType === "event" ? "text-violet-600" : "text-slate-400")} />
                <p className={cn("font-semibold text-sm", assignmentType === "event" ? "text-violet-700" : "text-slate-700")}>Standalone Event</p>
              </button>
            </div>

            {assignmentType === "ride" ? (
              fairsLoading ? (
                <Skeleton className="h-11 w-full rounded-xl" />
              ) : fairs.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  You don't have any fairs yet. Create a fair first before adding staff.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="block mb-1.5">Fair <span className="text-red-400">*</span></Label>
                    <Select {...register("fairId")} error={errors.fairId?.message}>
                      <option value="">Select a fair...</option>
                      {fairs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label className="block mb-1.5">Assigned Ride <span className="text-red-400">*</span></Label>
                    {ridesLoading ? (
                      <Skeleton className="h-11 w-full rounded-xl" />
                    ) : (
                      <Select {...register("rideId")} error={errors.rideId?.message} disabled={!selectedFairId}>
                        <option value="">{selectedFairId ? "Select a ride to assign..." : "Select a fair first"}</option>
                        {rides.map((r) => (
                          <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>
                        ))}
                      </Select>
                    )}
                  </div>
                </div>
              )
            ) : (
              eventsLoading ? (
                <Skeleton className="h-11 w-full rounded-xl" />
              ) : events.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  You don't have any events yet. Create an event first before adding staff.
                </p>
              ) : (
                <div>
                  <Label className="block mb-1.5">Event <span className="text-red-400">*</span></Label>
                  <Select {...register("eventId")} error={errors.eventId?.message}>
                    <option value="">Select an event...</option>
                    {events.map((e) => <option key={e.id} value={e.id}>{e.emoji} {e.name}</option>)}
                  </Select>
                </div>
              )
            )}

            <div className="mt-4">
              <Label className="block mb-1.5">Gate</Label>
              <Select {...register("gate")} error={errors.gate?.message}>
                {GATES.map((g) => <option key={g}>{g}</option>)}
              </Select>
            </div>

            {assignmentType === "ride" && selectedRide && selectedFair && (
              <div className="mt-4 p-4 rounded-xl border border-sky-200 bg-sky-50">
                <p className="text-xs font-bold text-sky-600 mb-0.5 tracking-wider">ASSIGNMENT PREVIEW</p>
                <p className="font-semibold text-slate-900 text-sm">
                  {staffName || "New Staff"}{" "}
                  <span className="text-slate-400 font-normal">→</span>{" "}
                  {selectedRide.emoji} {selectedRide.name}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {watch("gate")} · {selectedFair.name} · QR Scanner only
                </p>
              </div>
            )}
            {assignmentType === "event" && selectedEvent && (
              <div className="mt-4 p-4 rounded-xl border border-violet-200 bg-violet-50">
                <p className="text-xs font-bold text-violet-600 mb-0.5 tracking-wider">ASSIGNMENT PREVIEW</p>
                <p className="font-semibold text-slate-900 text-sm">
                  {staffName || "New Staff"}{" "}
                  <span className="text-slate-400 font-normal">→</span>{" "}
                  {selectedEvent.emoji} {selectedEvent.name}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {watch("gate")} · Standalone Event · QR Scanner only
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex gap-3 items-start">
            <Shield className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Restricted Access Account</p>
              <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                This staff account will only have access to the QR scanner for the assigned ride or event.
                Revenue, analytics, payment data, and everything else will NOT be accessible to this account.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pb-4">
            <Button
              type="submit" size="lg" className="flex-1" loading={loading}
              disabled={assignmentType === "ride" ? fairs.length === 0 : events.length === 0}
            >
              Create Staff Account
            </Button>
            <Button type="button" variant="secondary" size="lg" className="flex-1" asChild>
              <Link href={ROUTES.operatorStaff}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
