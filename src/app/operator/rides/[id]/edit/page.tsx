"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Skeleton } from "@/components/ui/index";
import { getRideById, updateRide } from "@/lib/api/rides";
import { ROUTES } from "@/config/app.config";
import type { Ride } from "@/types";

const schema = z.object({
  name:           z.string().min(2, "Enter a ride name"),
  pricePerPerson: z.coerce.number().positive("Enter a valid price"),
  status:         z.enum(["Active", "Paused", "Maintenance"]),
});
type FormValues = z.infer<typeof schema>;

export default function EditRidePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [ride, setRide]     = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    getRideById(params.id)
      .then((r) => {
        if (!r) { setNotFound(true); return; }
        setRide(r);
        reset({ name: r.name, pricePerPerson: r.pricePerPerson, status: r.status });
      })
      .catch(() => setNotFound(true))
      .finally(() => setFetching(false));
  }, [params.id, reset]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);
    try {
      await updateRide(params.id, values);
      router.push(ROUTES.operatorRides);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save changes. Please try again.");
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
        {fetching ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : notFound || !ride ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <h2 className="font-bold text-slate-900 mb-1">Ride not found</h2>
            <p className="text-slate-500 text-sm mb-5">
              This ride may have been removed, or you don&apos;t have access to it.
            </p>
            <Button asChild size="lg"><Link href={ROUTES.operatorRides}>Back to Rides</Link></Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{ride.emoji}</span>
                <div>
                  <h2 className="font-bold text-slate-900">Edit Ride</h2>
                  <p className="text-slate-400 text-xs">{ride.category} · Added {ride.durationMinutes} min ride</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="block mb-1.5">Ride Name <span className="text-red-400">*</span></Label>
                  <Input {...register("name")} error={errors.name?.message} />
                </div>
                <div>
                  <Label className="block mb-1.5">Price per Person (₹) <span className="text-red-400">*</span></Label>
                  <Input type="number" min="1" step="1" {...register("pricePerPerson")} error={errors.pricePerPerson?.message} />
                </div>
                <div>
                  <Label className="block mb-1.5">Status</Label>
                  <Select {...register("status")} error={errors.status?.message}>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Maintenance">Maintenance</option>
                  </Select>
                </div>
                <p className="text-xs text-slate-400">
                  Category, description, duration, minimum age, and capacity can&apos;t be edited after a ride is created yet.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-3 pb-4">
              <Button type="submit" size="lg" className="flex-1" loading={loading}>
                Save Changes
              </Button>
              <Button type="button" variant="secondary" size="lg" className="flex-1" asChild>
                <Link href={ROUTES.operatorRides}>Cancel</Link>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
