"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { CustomerNavbar } from "@/components/layout/customer-navbar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/index";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore, useCurrentUser } from "@/stores/auth.store";
import { createBooking } from "@/lib/api/tickets";
import { formatCurrency } from "@/lib/utils";
import { ROUTES, PAYMENT_METHODS, APP_CONFIG } from "@/config/app.config";
import type { PaymentMethod } from "@/types";

const schema = z.object({
  name:     z.string().min(2, "Enter your name"),
  email:    z.string().email("Enter a valid email"),
  phone:    z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(8, "At least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router      = useRouter();
  const item        = useCartStore((s) => s.item);
  const clearCart   = useCartStore((s) => s.clearCart);
  const totalAmount = useCartStore((s) => s.totalAmount());
  const currentUser = useCurrentUser();
  const registerOrLoginCustomer = useAuthStore((s) => s.registerOrLoginCustomer);

  const [payMethod, setPayMethod] = useState<PaymentMethod>("UPI");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:  currentUser?.name  ?? "",
      email: currentUser?.email ?? "",
      phone: currentUser?.phone ?? "",
      password: "",
    },
  });

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🎟️</p>
          <p className="font-bold text-slate-900 mb-2">No item in cart</p>
          <Button asChild><Link href={ROUTES.fairs}>Browse Fairs</Link></Button>
        </div>
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    if (!item) return;
    setLoading(true);
    setError(null);
    try {
      await registerOrLoginCustomer(values.name, values.email, values.password, values.phone);

      const result = await createBooking({
        item,
        customerEmail: values.email,
        ...(APP_CONFIG.useMockApi ? { paymentMethod: payMethod } : {}),
      });

      if (result.success && result.tickets) {
        clearCart();
        // FIX: this used to store one ticket under "lastTicket" — a
        // purchase of N tickets now issues N individually-scannable
        // tickets, so the whole array is stored for the "just booked"
        // screen on /tickets to render one QR per ticket.
        sessionStorage.setItem("lastTickets", JSON.stringify(result.tickets));
        // FIX: "emailSent" travels with the tickets so /tickets can show an
        // accurate confirmation message — it used to unconditionally claim
        // an email was sent regardless of whether it actually went out.
        sessionStorage.setItem("lastTicketsEmailSent", JSON.stringify(result.emailSent ?? false));
        router.push(ROUTES.tickets + "?success=true");
      } else {
        setError(result.error ?? "Booking failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <CustomerNavbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href={ROUTES.fairs}
          className="inline-flex items-center gap-1.5 text-sky-500 text-sm mb-6 hover:gap-2.5 transition-all">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-24">
                <h2 className="font-bold text-slate-900 mb-4">Your Booking</h2>
                <div className={`h-24 bg-gradient-to-br ${item.coverGradient} rounded-xl flex items-center justify-center text-4xl mb-4`}>
                  {item.emoji}
                </div>
                {[
                  ["Fair",      item.fairName],
                  ["Ride",      item.rideName],
                  ["Quantity",  `${item.quantity} ticket${item.quantity > 1 ? "s" : ""}`],
                  ["Price",     `${formatCurrency(item.pricePerPerson)} × ${item.quantity}`],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500">{l}</span>
                    <span className="font-medium text-slate-900">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between mt-4 pt-3 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-sky-500 text-lg">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="font-bold text-slate-900 mb-1">Contact Details</h2>
                <p className="text-slate-400 text-xs mb-4">
                  New here? This creates your account. Booked before? Use the same email + password to sign back in.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label className="block mb-1.5">Full Name</Label>
                    <Input {...register("name")} error={errors.name?.message} />
                  </div>
                  <div>
                    <Label className="block mb-1.5">Email <span className="text-slate-400 text-xs">(ticket delivered here)</span></Label>
                    <Input type="email" {...register("email")} error={errors.email?.message} />
                  </div>
                  <div>
                    <Label className="block mb-1.5">Mobile</Label>
                    <Input type="tel" {...register("phone")} error={errors.phone?.message} />
                  </div>
                  <div>
                    <Label className="block mb-1.5">Password</Label>
                    <Input type="password" {...register("password")} error={errors.password?.message} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="font-bold text-slate-900 mb-1">Payment Method</h2>
                <p className="text-slate-400 text-xs mb-4">
                  Payments aren't live yet — your ticket is confirmed for free during launch. This won't be charged.
                </p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(({ id, label, icon }) => (
                    <label key={id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        payMethod === id
                          ? "border-sky-400 bg-sky-50"
                          : "border-slate-200 hover:border-sky-200"
                      }`}>
                      <input
                        type="radio"
                        name="payMethod"
                        value={id}
                        checked={payMethod === id}
                        onChange={() => setPayMethod(id as PaymentMethod)}
                        className="accent-sky-400"
                      />
                      <span className="text-lg">{icon}</span>
                      <span className="font-medium text-slate-800 text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-500 text-xs px-1">
                <Shield className="h-4 w-4 text-green-500" />
                {APP_CONFIG.useMockApi
                  ? "Secured and encrypted. Powered by Razorpay."
                  : "No payment is taken at this time — your ticket is confirmed instantly."}
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {loading ? "Processing..." : `Confirm Booking · ${formatCurrency(totalAmount)}`}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
