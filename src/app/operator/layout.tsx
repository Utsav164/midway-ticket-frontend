"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { OperatorSidebar } from "@/components/layout/operator-sidebar";
import { useIsOperator } from "@/stores/auth.store";
import { ROUTES } from "@/config/app.config";

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isOperator = useIsOperator();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Login and signup pages must NOT be protected by this layout.
  const isPublicPage =
    pathname === ROUTES.operatorLogin || pathname === ROUTES.operatorSignup;

  useEffect(() => {
    if (!isPublicPage && !isOperator) {
      router.replace(ROUTES.operatorLogin);
    }
  }, [isPublicPage, isOperator, router]);

  // Close the mobile drawer automatically on every navigation — without
  // this, tapping a link would technically still work (each link already
  // calls onMobileClose itself) but the browser back/forward buttons or any
  // router.push() elsewhere in the app wouldn't trigger that same handler.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // /operator/login and /operator/signup should render normally.
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Protected operator pages.
  if (!isOperator) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pageTitle: Record<string, string> = {
    "/operator/dashboard": "Dashboard",
    "/operator/fairs": "Fairs",
    "/operator/events": "Events",
    "/operator/rides": "Rides",
    "/operator/staff": "Staff Management",
    "/operator/tickets/issue": "Issue Test Ticket",
    "/operator/analytics": "Analytics",
    "/operator/settings": "Settings",
  };

  const title =
    Object.entries(pageTitle).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "Operator";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <OperatorSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger — mobile only. Desktop keeps the sidebar's own
                collapse/expand toggle instead, unchanged. */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-bold text-slate-900 text-base sm:text-lg truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </button>

            <div className="h-8 w-8 rounded-full bg-sky-400 flex items-center justify-center font-bold text-slate-900 text-sm cursor-pointer flex-shrink-0">
              R
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
