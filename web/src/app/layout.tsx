import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onile — Rent & Buy Property Directly from Owners in Lagos",
  description:
    "Onile connects tenants and buyers directly with landlords and property owners in Lagos, cutting out agent/middleman fees. Read honest tenant reviews before you move in.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <RegisterServiceWorker />
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mt-12 border-t border-gray-200 py-6 text-center text-xs text-gray-500">
          Onile — connecting Lagos tenants and buyers directly with property owners.
        </footer>
      </body>
    </html>
  );
}
