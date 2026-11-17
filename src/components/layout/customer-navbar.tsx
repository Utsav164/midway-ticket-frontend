"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrCode, Ticket, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/app.config";

const NAV_LINKS = [
  { href: ROUTES.fairs, label: "Explore Fairs" },
  { href: ROUTES.events, label: "Events" },
  { href: ROUTES.tickets, label: "My Tickets" },
];

export function CustomerNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={ROUTES.home} className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-sky-400 flex items-center justify-center transition-transform group-hover:scale-105">
            <QrCode className="h-4 w-4 text-slate-900" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            Midway<span className="text-sky-500">Ticket</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "text-sky-500"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.tickets}>
              <Ticket className="h-4 w-4" /> My Tickets
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={ROUTES.fairs}>Explore Fairs</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-sky-50 text-sky-600"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <Button className="w-full" asChild>
              <Link href={ROUTES.fairs} onClick={() => setOpen(false)}>
                Explore Fairs
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
