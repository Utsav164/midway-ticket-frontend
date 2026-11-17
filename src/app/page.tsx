import type { Metadata } from "next";
import Link from "next/link";
import {
  QrCode, Zap, Shield, Smartphone, ChevronRight,
  MapPin, Calendar, Star, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeDisplay } from "@/components/customer/qr-display";
import { ROUTES, APP_CONFIG } from "@/config/app.config";
import { CustomerNavbar } from "@/components/layout/customer-navbar";
import { getFairs } from "@/lib/api/fairs";
import type { Fair } from "@/types";

export const metadata: Metadata = {
  title: "MidwayTicket — Every Ride. One Ticket.",
  description: APP_CONFIG.description,
};

const HOW_IT_WORKS = [
  { n:"01", icon:"🗺️", title:"Choose Your Fair",  body:"Browse fairs happening near you with all rides listed and prices shown upfront." },
  { n:"02", icon:"🎡", title:"Pick a Ride",        body:"View all rides, ratings, and details. Select the one you want to book." },
  { n:"03", icon:"📱", title:"Pay Online",          body:"Pay securely with UPI, card, or net banking. Takes under 30 seconds." },
  { n:"04", icon:"✅", title:"Scan & Ride",         body:"Show your QR ticket at the ride gate and walk right in. No paper needed." },
];

const TRUST_ITEMS = [
  { icon:Zap,       label:"Instant Booking",   desc:"Book a ticket in under a minute"     },
  { icon:QrCode,    label:"QR Entry",          desc:"No paper tickets, ever"              },
  { icon:Shield,    label:"Secure Payments",   desc:"Powered by trusted payment gateways" },
  { icon:Smartphone,label:"Mobile-First",      desc:"Works perfectly on any smartphone"   },
];

const OPERATOR_FEATURES = [
  "Real-time sales dashboard",
  "Ride-wise revenue tracking",
  "QR scanner app for staff",
  "Multiple rides, one account",
  "Staff management & permissions",
  "Analytics & peak hour insights",
];

export default async function HomePage() {
  // Real fairs, fetched server-side — never a hardcoded showcase linking to
  // fake IDs that would 404 against the live backend. Fails soft to an
  // empty list (section below just doesn't render) rather than crashing
  // the homepage if the backend is briefly unreachable.
  const fairs: Fair[] = await getFairs().catch(() => []);
  const featuredFairs = fairs.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <CustomerNavbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center pt-16"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #38BDF8, transparent)" }} />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }} />
          {/* Scattered dots */}
          {[["top-1/4 left-1/5","bg-sky-400"],["top-1/3 right-1/3","bg-purple-400"],
            ["bottom-1/3 right-1/4","bg-sky-400"],["bottom-1/4 left-1/3","bg-indigo-400"]].map(([pos, col], i) => (
            <div key={i} className={`absolute ${pos} h-1.5 w-1.5 rounded-full ${col} opacity-50`} />
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 mb-6">
              <Zap className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-xs font-semibold text-sky-400 tracking-wide">
                DIGITAL TICKETING FOR INDIA'S FAIRS
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-5 text-balance">
              Every Ride.{" "}
              <span className="text-sky-400">One Ticket.</span>
            </h1>

            <p className="text-slate-400 text-lg mb-8 max-w-md leading-relaxed">
              Skip the queue. Book ride tickets digitally, pay in seconds, and scan your
              way into any fair or mela — no paper needed.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Button size="lg" asChild>
                <Link href={ROUTES.fairs}>
                  <MapPin className="h-4 w-4" /> Explore Fairs
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={ROUTES.operatorLogin}>For Operators →</Link>
              </Button>
            </div>

            {/* Mini trust strip */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {["⚡ Instant booking","🔒 Secure payment","📱 QR entry","✅ No paper tickets"].map((item) => (
                <span key={item} className="text-slate-400 text-sm">{item}</span>
              ))}
            </div>
          </div>

          {/* Right — ticket mockup */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-25"
                style={{ background: "linear-gradient(135deg, #38BDF8, #8B5CF6)" }} />

              {/* Ticket card */}
              <div
                className="relative rounded-3xl overflow-hidden shadow-2xl w-72"
                style={{ background: "linear-gradient(145deg, #1E293B, #0F172A)", border: "1px solid rgba(56,189,248,0.15)" }}
              >
                {/* Ride image area */}
                <div className="h-36 bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-5xl">
                  🎡
                </div>

                {/* Ticket body */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="h-4 w-4 text-sky-400" />
                    <span className="text-sky-400 text-xs font-bold tracking-widest">MIDWAY TICKET</span>
                  </div>
                  <p className="text-white font-bold text-xl mb-0.5">Giant Wheel</p>
                  <p className="text-slate-400 text-sm mb-4">Grand City Mela · Prayagraj</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[["Date","13 Aug 2026"],["Ticket ID","#MT28491"],["Qty","2 Tickets"],["Status","Valid ✓"]].map(([l,v]) => (
                      <div key={l}>
                        <p className="text-slate-500 text-xs">{l}</p>
                        <p className={`font-semibold text-sm ${l==="Status" ? "text-green-400" : "text-white"}`}>{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Perforation */}
                  <div className="ticket-perforation-dark -mx-5 mb-4" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Show at ride entrance</p>
                      <p className="text-slate-400 text-xs">₹100 · UPI · Paid</p>
                    </div>
                    <div className="rounded-xl bg-white p-1.5">
                      <QRCodeDisplay size={72} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-white text-xs font-bold shadow-lg">
                <Check className="h-3 w-3" /> Verified
              </div>
              <div className="absolute -bottom-3 -left-3 rounded-full bg-sky-400 px-3 py-1.5 text-slate-900 text-xs font-bold shadow-lg">
                ₹100 · UPI
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_ITEMS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sky-500 font-semibold text-sm tracking-wider mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl font-bold text-slate-900">Book a ride in under a minute.</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.n} className="text-center group">
                <div className="h-14 w-14 rounded-2xl bg-sky-50 flex items-center justify-center text-2xl mx-auto mb-4 transition-colors group-hover:bg-sky-100">
                  {step.icon}
                </div>
                <span className="text-sky-500 text-xs font-bold tracking-wider">{step.n}</span>
                <h3 className="font-bold text-slate-900 mt-1 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED FAIRS ────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sky-500 font-semibold text-sm tracking-wider mb-1">HAPPENING NOW</p>
              <h2 className="text-3xl font-bold text-slate-900">Fairs near you</h2>
            </div>
            <Button variant="outline" asChild>
              <Link href={ROUTES.fairs}>
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {featuredFairs.length === 0 ? (
            <p className="text-slate-500 text-sm">No fairs listed yet — check back soon.</p>
          ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {featuredFairs.map((fair) => (
              <Link key={fair.id} href={ROUTES.fair(fair.id)}
                className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group">
                <div className={`h-44 bg-gradient-to-br ${fair.coverGradient} flex items-center justify-center relative`}>
                  <span className="text-6xl">{fair.emoji}</span>
                  <div className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-black/25 text-white">
                    {fair.totalRides}+ Rides
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-sky-600 transition-colors">
                    {fair.name}
                  </h3>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
                    <MapPin className="h-3.5 w-3.5" /> {fair.city}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                    <Calendar className="h-3.5 w-3.5" /> {fair.startDate} – {fair.endDate}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">From ₹{fair.minTicketPrice}</span>
                    <span className="text-sky-500 text-sm font-semibold flex items-center gap-1">
                      Book Now <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* ── OPERATOR CTA ──────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sky-400 font-semibold text-sm tracking-wider mb-3">FOR FAIR OPERATORS</p>
          <h2 className="text-4xl font-bold text-white mb-4">Manage your fair smarter.</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Track every ride, every ticket, every rupee — in real time. Built specifically
            for small and medium-sized Indian fair operators.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto mb-10 text-left">
            {OPERATOR_FEATURES.map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-slate-300 text-sm">
                <div className="h-5 w-5 rounded-full bg-sky-400/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-sky-400" />
                </div>
                {feat}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href={ROUTES.operatorLogin}>Start Free Trial — 14 Days</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={ROUTES.staffLogin}>Staff Login →</Link>
            </Button>
          </div>
          <p className="text-slate-600 text-sm mt-4">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-sky-400 flex items-center justify-center">
              <QrCode className="h-3.5 w-3.5 text-slate-900" />
            </div>
            <span className="font-bold text-white">
              Midway<span className="text-sky-400">Ticket</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 MidwayTicket. Built for India's local fairs.</p>
          <div className="flex gap-5 text-slate-500 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
