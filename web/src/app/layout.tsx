import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Onile — Rent & Buy Property Directly from Owners in Lagos",
    template: "%s — Onile",
  },
  description:
    "Onile connects tenants and buyers directly with landlords and property owners in Lagos, cutting out agent/middleman fees. Landlords collect rent, track repairs and manage tenants in one simple app.",
  manifest: "/manifest.json",
  applicationName: "Onile",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Onile — No Agents. No Wahala.",
    description:
      "Find a home directly from the owner, or manage your property, rent and repairs in one simple app. No agent fees.",
    url: appUrl,
    siteName: "Onile",
    locale: "en_NG",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
};

// Applied before the first paint so someone who chose bigger text never
// sees a flash of small text on the way in.
const TEXT_SIZE_BOOTSTRAP = `(function(){try{var s=localStorage.getItem('onile_text_size');if(s==='large'||s==='x-large'){document.documentElement.dataset.textSize=s;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEXT_SIZE_BOOTSTRAP }} />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <RegisterServiceWorker />
        <Navbar />
        <main id="main" className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </main>
        <footer className="mt-12 border-t border-gray-200 bg-white py-8">
          <div className="mx-auto max-w-6xl px-4">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-base" aria-label="Footer">
              <Link href="/help" className="font-medium text-brand-700 hover:underline">
                Help &amp; How to use Onile
              </Link>
              <Link href="/terms" className="text-gray-600 hover:underline">
                Terms of Use
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:underline">
                Privacy
              </Link>
            </nav>
            <p className="mt-4 text-center text-sm text-gray-500">
              Onile — connecting Lagos tenants and buyers directly with property owners. No agent fees.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
