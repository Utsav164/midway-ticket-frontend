"use client";
import { useState, useEffect } from "react";
import { Search, Filter, MapPin } from "lucide-react";
import { CustomerNavbar } from "@/components/layout/customer-navbar";
import { FairCard } from "@/components/customer/fair-ride-cards";
import { Skeleton } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { getFairs } from "@/lib/api/fairs";
import type { Fair } from "@/types";

const CITIES = ["All Cities", "Prayagraj", "Lucknow", "Kanpur", "Varanasi"];

export default function FairsPage() {
  const [fairs, setFairs]       = useState<Fair[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [city, setCity]         = useState("All Cities");

  function load() {
    setLoading(true);
    setError(null);
    // .catch() is required here — without it, a rejected promise (network
    // failure, CORS block, timeout) means .then() never runs, setLoading
    // never flips to false, and the page spins on the loading skeleton
    // forever. This is what was happening before: any API failure looked
    // identical to "still loading".
    getFairs()
      .then(setFairs)
      .catch((err) => setError(err?.message ?? "Couldn't load fairs. Please try again."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = fairs.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
                        f.city.toLowerCase().includes(search.toLowerCase());
    const matchCity   = city === "All Cities" || f.city === city;
    return matchSearch && matchCity;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNavbar />
      <div className="pt-20 pb-16">
        <div className="bg-slate-900 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-sky-400 text-sm font-semibold tracking-wider mb-2">DISCOVER</p>
            <h1 className="text-3xl font-bold text-white mb-6">Fairs near you</h1>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 backdrop-blur-sm">
                <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search fairs or cities..."
                  className="flex-1 bg-transparent text-white placeholder-slate-400 text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 text-slate-300 text-sm">
                <Filter className="h-4 w-4" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent outline-none text-sm cursor-pointer"
                >
                  {CITIES.map((c) => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {!loading && !error && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600 text-sm">
                {`${filtered.length} fair${filtered.length !== 1 ? "s" : ""} found`}
              </p>
              {city !== "All Cities" && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-sky-600">
                  <MapPin className="h-3.5 w-3.5" /> {city}
                  <button onClick={() => setCity("All Cities")} className="ml-1 text-slate-400 hover:text-slate-600">✕</button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
                  <Skeleton className="h-44 w-full rounded-none" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">⚠️</p>
              <p className="text-slate-900 font-bold text-lg mb-1">Couldn't load fairs</p>
              <p className="text-slate-500 text-sm mb-5">{error}</p>
              <Button onClick={load}>Try Again</Button>
            </div>
          ) : fairs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🎪</p>
              <p className="text-slate-900 font-bold text-lg mb-1">There are no fairs listed yet</p>
              <p className="text-slate-500 text-sm">Check back soon — new fairs and events will show up here.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-slate-900 font-bold text-lg mb-1">No fairs found</p>
              <p className="text-slate-500 text-sm">Try a different search or city.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((fair) => <FairCard key={fair.id} fair={fair} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
