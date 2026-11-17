"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  QrCode, Home, Package, Users, ScanLine,
  BarChart2, Settings, LogOut, ChevronLeft, Menu, MapPin, Ticket,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/app.config";
import { useAuthStore, useOperatorUser } from "@/stores/auth.store";

const NAV_ITEMS = [
  { href: ROUTES.operatorDashboard, icon: Home,     label: "Dashboard"  },
  { href: ROUTES.operatorFairs,     icon: MapPin,   label: "Fairs"      },
  { href: ROUTES.operatorEvents,    icon: Ticket,   label: "Events"     },
  { href: ROUTES.operatorRides,     icon: Package,  label: "Rides"      },
  { href: ROUTES.operatorStaff,     icon: Users,    label: "Staff"      },
  { href: ROUTES.operatorIssueTicket, icon: QrCode, label: "Issue Test Ticket" },
  { href: ROUTES.operatorAnalytics, icon: BarChart2,label: "Analytics"  },
  { href: ROUTES.operatorSettings,  icon: Settings, label: "Settings"   },
];

/**
 * FIX: this sidebar used to always render at a fixed w-56 (or w-16
 * collapsed), full stop — no mobile handling at all. On a phone-width
 * screen that's over half the viewport permanently occupied by the
 * sidebar on every single operator page (Dashboard, Fairs, Events, Rides,
 * Staff, Analytics, Settings, Issue Test Ticket), which is the main thing
 * that made the whole operator side of this PWA feel broken on mobile.
 *
 * Desktop behaviour (persistent sidebar + collapse/expand toggle) is
 * unchanged. Below the `md` breakpoint this now renders as a hidden,
 * off-canvas drawer — closed by default, opened via a hamburger button in
 * the layout's header (see operator/layout.tsx), with a tap-to-dismiss
 * backdrop and auto-close whenever a nav link is tapped.
 */
export function OperatorSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const logout   = useAuthStore((s) => s.logout);
  const operator = useOperatorUser();
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    logout();
    router.push(ROUTES.operatorLogin);
  }

  return (
    <>
      {/* Backdrop — mobile only, tap to dismiss the drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex flex-col h-screen bg-slate-900 transition-all duration-300 flex-shrink-0",
          // Mobile: fixed off-canvas drawer, slides in from the left.
          // Desktop (md+): back to a normal in-flow persistent sidebar.
          "fixed inset-y-0 left-0 z-50 md:static md:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-64 md:w-16" : "w-64 md:w-56",
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-800 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-sky-400 flex items-center justify-center flex-shrink-0">
            <QrCode className="h-4 w-4 text-slate-900" />
          </div>
          {/* Mobile drawer always shows the full brand name; only hidden
              at md+ when desktop-collapsed to icon-only. */}
          <span className={cn("font-bold text-white text-sm whitespace-nowrap", collapsed && "md:hidden")}>
            Midway<span className="text-sky-400">Ticket</span>
          </span>
          {/* Collapse toggle — desktop only; mobile closes via backdrop tap or a nav selection instead. */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "ml-auto p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors hidden md:block",
              collapsed && "mx-auto ml-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-sky-400 text-slate-900"
                    : "text-slate-400 hover:text-white hover:bg-slate-800",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {/* Mobile drawer is always full-width, so always show the
                    label there; only hide it at md+ when desktop-collapsed. */}
                <span className={cn(collapsed && "md:hidden")}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="p-2 border-t border-slate-800 space-y-0.5 flex-shrink-0">
          {/* Mobile drawer always shows the operator's name/org; only
              hidden at md+ when desktop-collapsed to icon-only. */}
          {operator && (
            <div className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl", collapsed && "md:hidden")}>
              <div className="h-8 w-8 rounded-full bg-sky-400 flex items-center justify-center font-bold text-slate-900 text-sm flex-shrink-0">
                {operator.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{operator.name}</p>
                <p className="text-slate-500 text-xs truncate">{operator.operatorName}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className={cn(collapsed && "md:hidden")}>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
