"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/index";
import { createFair, activateFair } from "@/lib/api/fairs";
import { ROUTES } from "@/config/app.config";

const GRADIENTS = [
  "from-violet-600 to-indigo-700",
  "from-orange-500 to-rose-600",
  "from-teal-500 to-cyan-600",
  "from-pink-500 to-fuchsia-600",
  "from-blue-500 to-indigo-600",
];

const schema = z.object({
  name:        z.string().min(2, "Enter a fair name"),
  location:    z.string().min(2, "Enter a venue / ground name"),
  city:        z.string().min(2, "Enter a city"),
  startDate:   z.string().min(1, "Pick a start date"),
  endDate:     z.string().min(1, "Pick an end date"),
  description: z.string().optional(),
  publishNow:  z.boolean().default(true),
}).refine((v) => v.endDate >= v.startDate, {
  message: "End date can't be before the start date",
  path: ["endDate"],
});
type FormValues = z.infer<typeof schema>;

export default function NewFairPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { publishNow: true },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);
    try {
      const fair = await createFair({
        name: values.name,
        location: values.location,
        city: values.city,
        startDate: values.startDate,
        endDate: values.endDate,
        description: values.description || undefined,
        coverGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
        emoji: "🎪",
      });

      if (values.publishNow) {
        // Best-effort: the fair is already created either way. If publishing
        // fails for some reason, don't block the operator — they can publish
        // later from fair settings. Surface it gently instead of losing the
        // fair they just made.
        try {
          await activateFair(fair.id);
        } catch {
          setError(
            "Fair created, but couldn't publish it automatically. You can publish it later from fair settings.",
          );
        }
      }

      router.push(ROUTES.operatorRidesNew);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't create this fair. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link href={ROUTES.operatorRides}
        className="inline-flex items-center gap-1.5 text-sky-500 text-sm mb-6 hover:gap-2.5 transition-all">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-1">Create Your Fair</h2>
            <p className="text-slate-500 text-sm mb-4">
              A fair is the event your rides belong to — customers browse and book rides through it.
            </p>
            <div className="space-y-4">
              <div>
                <Label className="block mb-1.5">Fair Name <span className="text-red-400">*</span></Label>
                <Input placeholder="e.g. Grand City Mela 2026" {...register("name")} error={errors.name?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block mb-1.5">Venue / Ground <span className="text-red-400">*</span></Label>
                  <Input placeholder="e.g. Green Park Grounds" {...register("location")} error={errors.location?.message} />
                </div>
                <div>
                  <Label className="block mb-1.5">City <span className="text-red-400">*</span></Label>
                  <Input placeholder="e.g. Kanpur" {...register("city")} error={errors.city?.message} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block mb-1.5">Start Date <span className="text-red-400">*</span></Label>
                  <Input type="date" {...register("startDate")} error={errors.startDate?.message} />
                </div>
                <div>
                  <Label className="block mb-1.5">End Date <span className="text-red-400">*</span></Label>
                  <Input type="date" {...register("endDate")} error={errors.endDate?.message} />
                </div>
              </div>
              <div>
                <Label className="block mb-1.5">Description</Label>
                <Textarea placeholder="A short description customers will see" {...register("description")} />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" {...register("publishNow")} />
                <span className="text-sm text-slate-600">
                  Publish immediately (visible to customers as soon as it's created — you can add rides before or after)
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-3 pb-4">
            <Button type="submit" size="lg" className="flex-1" loading={loading}>
              Create Fair
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
