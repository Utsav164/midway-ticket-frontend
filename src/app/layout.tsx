import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";
import { ErrorBoundary } from "@/components/layout/error-boundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "MidwayTicket", template: "%s | MidwayTicket" },
  description:
    "Skip the queue. Book ride tickets digitally and scan your way into any fair or mela.",
  keywords: ["fair tickets", "mela tickets", "QR ticketing", "amusement ride booking", "MidwayTicket"],
  authors: [{ name: "MidwayTicket" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "MidwayTicket — Every Ride. One Ticket.",
    description: "Skip the queue. Book ride tickets digitally and scan your way into any fair.",
    siteName: "MidwayTicket",
  },
  twitter: {
    card: "summary_large_image",
    title: "MidwayTicket",
    description: "Digital ticketing for India's local fairs and amusement rides.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MidwayTicket",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F172A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <Providers>{children}</Providers>
          <ServiceWorkerRegister />
        </ErrorBoundary>
      </body>
    </html>
  );
}
