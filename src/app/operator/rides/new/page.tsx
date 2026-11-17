"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/index";
import { createRide } from "@/lib/api/rides";
import { ROUTES } from "@/config/app.config";
import type { RideCategory } from "@/types";

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-orange-500 to-rose-600",
  "from-teal-500 to-cyan-600",
  "from-pink-500 to-fuchsia-600",
  "from-violet-600 to-indigo-700",
];

const CATEGORY_EMOJI: Record<RideCategory, string> = {
  Thrill: "🎢",
  Family: "🎡",
  Kids:   "🎠",
  Games:  "🎯",
};

const schema = z.object({
  name:            z.string().min(2, "Enter a ride name"),
  category:        z.enum(["Thrill", "Family", "Kids", "Games"]),
  pricePerPerson:  z.coerce.number().positive("Enter a valid price"),
  durationMinutes: z.coerce.number().int().positive("Enter a valid duration").optional(),
  minAge:          z.coerce.number().int().min(0, "Enter a valid age").optional(),
  capacity:        z.coerce.number().int().positive("Enter a valid capacity").optional(),
  description:     z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function NewRideForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fairId = searchParams.get("fairId");

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "Family" },
  });

  async function onSubmit(values: FormValues) {
    if (!fairId) {
      setError("No fair selected. Go back to Fairs and add the ride from there.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createRide({
        fairId,
        name: values.name,
        category: values.category as RideCategory,
        pricePerPerson: values.pricePerPerson,
        description: values.description || undefined,
        durationMinutes: values.durationMinutes,
        minAge: values.minAge,
        capacity: values.capacity,
        emoji: CATEGORY_EMOJI[values.category as RideCategory],
        coverGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
      });
      router.push(ROUTES.operatorRides);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't create this ride. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link href={ROUTES.operatorRides}
        className="inline-flex items-center gap-1.5 text-sky-500 text-sm mb-6 hover:gap-2.5 transition-all">
        <ArrowLeft className="h-4 w-4" /> Back to Rides
      </Link>

      <div className="max-w-xl">
        {!fairId && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-4">
            No fair selected — go back to Fairs and click "Add Ride" on the fair you want this ride added to.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-1">Add a New Ride</h2>
            <p className="text-slate-500 text-sm mb-4">
              Set up the ride's details — customers will see this on the fair page.
            </p>
            <div className="space-y-4">
              <div>
                <Label className="block mb-1.5">Ride Name <span className="text-red-400">*</span></Label>
                <Input placeholder="e.g. Giant Wheel" {...register("name")} error={errors.name?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block mb-1.5">Category <span className="text-red-400">*</span></Label>
                  <Select {...register("category")} error={errors.category?.message}>
                    <option value="Thrill">Thrill</option>
                    <option value="Family">Family</option>
                    <option value="Kids">Kids</option>
                    <option value="Games">Games</option>
                  </Select>
                </div>
                <div>
                  <Label className="block mb-1.5">Price per Person (₹) <span className="text-red-400">*</span></Label>
                  <Input type="number" min="1" step="1" {...register("pricePerPerson")} error={errors.pricePerPerson?.message} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="block mb-1.5">Duration (min)</Label>
                  <Input type="number" min="1" step="1" placeholder="5" {...register("durationMinutes")} error={errors.durationMinutes?.message} />
                </div>
                <div>
                  <Label className="block mb-1.5">Min Age</Label>
                  <Input type="number" min="0" step="1" placeholder="5" {...register("minAge")} error={errors.minAge?.message} />
                </div>
                <div>
                  <Label className="block mb-1.5">Capacity</Label>
                  <Input type="number" min="1" step="1" placeholder="4" {...register("capacity")} error={errors.capacity?.message} />
                </div>
              </div>
              <div>
                <Label className="block mb-1.5">Description</Label>
                <Textarea placeholder="A short description customers will see" {...register("description")} />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-3 pb-4">
            <Button type="submit" size="lg" className="flex-1" loading={loading} disabled={!fairId}>
              Add Ride
            </Button>
            <Button type="button" variant="secondary" size="lg" className="flex-1" asChild>
              <Link href={ROUTES.operatorRides}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewRidePage() {
  return (
    <Suspense fallback={null}>
      <NewRideForm />
    </Suspense>
  );
}
