"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, IndianRupee, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/index";
import { cn } from "@/lib/utils";
import { createEvent } from "@/lib/api/events";
import { ROUTES } from "@/config/app.config";

const GRADIENTS = [
  "from-violet-600 to-indigo-700",
  "from-orange-500 to-rose-600",
  "from-teal-500 to-cyan-600",
  "from-blue-500 to-indigo-600",
];

const schema = z.object({
  name:            z.string().min(2, "Enter an event name"),
  venue:            z.string().min(2, "Enter a venue"),
  city:             z.string().min(2, "Enter a city"),
  eventDate:        z.string().min(1, "Pick a date"),
  capacity:         z.coerce.number().int().positive("Enter a valid capacity"),
  pricePerTicket:   z.coerce.number().min(0).optional(),
  description:      z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewEventPage() {
  const router = useRouter();
  // The whole point of Events: this is the operator's own choice, per
  // event — defaults to free. A customer booking this event will never see
  // a payment method at all unless this is switched on.
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { capacity: 100, pricePerTicket: 0 },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);
    try {
      await createEvent({
        name: values.name,
        venue: values.venue,
        city: values.city,
        eventDate: values.eventDate,
        capacity: values.capacity,
        pricePerTicket: requiresPayment ? (values.pricePerTicket ?? 0) : 0,
        requiresPayment,
        description: values.description || undefined,
        coverGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
        emoji: "🎫",
      });
      router.push(ROUTES.operatorEvents);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't create this event. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link href={ROUTES.operatorEvents}
        className="inline-flex items-center gap-1.5 text-sky-500 text-sm mb-6 hover:gap-2.5 transition-all">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      <div className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-1">New Event</h2>
            <p className="text-slate-500 text-sm mb-4">
              A standalone event — not part of a Fair, not broken into rides.
              e.g. a college auditorium show, a single-venue gathering.
            </p>

            <div className="space-y-4">
              <div>
                <Label className="block mb-1.5">Event Name <span className="text-red-400">*</span></Label>
                <Input placeholder="e.g. Annual College Fest 2026" {...register("name")} error={errors.name?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block mb-1.5">Venue <span className="text-red-400">*</span></Label>
                  <Input placeholder="e.g. Main Auditorium" {...register("venue")} error={errors.venue?.message} />
                </div>
                <div>
                  <Label className="block mb-1.5">City <span className="text-red-400">*</span></Label>
                  <Input placeholder="e.g. Kanpur" {...register("city")} error={errors.city?.message} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block mb-1.5">Event Date <span className="text-red-400">*</span></Label>
                  <Input type="date" {...register("eventDate")} error={errors.eventDate?.message} />
                </div>
                <div>
                  <Label className="block mb-1.5">Capacity <span className="text-red-400">*</span></Label>
                  <Input type="number" min="1" step="1" {...register("capacity")} error={errors.capacity?.message} />
                </div>
              </div>
              <div>
                <Label className="block mb-1.5">Description</Label>
                <Textarea placeholder="What's this event about?" {...register("description")} />
              </div>
            </div>
          </div>

          {/* ── Payment toggle — the core of this feature ─────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <Label className="block mb-3">Ticket Payment</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRequiresPayment(false)}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-colors",
                  !requiresPayment ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <Ban className={cn("h-5 w-5 mb-2", !requiresPayment ? "text-emerald-600" : "text-slate-400")} />
                <p className={cn("font-semibold text-sm", !requiresPayment ? "text-emerald-700" : "text-slate-700")}>Free Event</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  No payment option is ever shown. Tickets + QR issue instantly.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setRequiresPayment(true)}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-colors",
                  requiresPayment ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <IndianRupee className={cn("h-5 w-5 mb-2", requiresPayment ? "text-sky-600" : "text-slate-400")} />
                <p className={cn("font-semibold text-sm", requiresPayment ? "text-sky-700" : "text-slate-700")}>Paid Event</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer picks a payment method and pays to get their ticket.
                </p>
              </button>
            </div>

            {requiresPayment && (
              <div className="mt-4">
                <Label className="block mb-1.5">Price per Ticket (₹) <span className="text-red-400">*</span></Label>
                <Input type="number" min="1" step="1" {...register("pricePerTicket")} error={errors.pricePerTicket?.message} />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-3 pb-4">
            <Button type="submit" size="lg" className="flex-1" loading={loading}>
              Create Event
            </Button>
            <Button type="button" variant="secondary" size="lg" className="flex-1" asChild>
              <Link href={ROUTES.operatorEvents}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
