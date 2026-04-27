import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/shared/Nav";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gymmy Neutron",
  description: "Track gym workouts and BJJ sessions",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Gymmy Neutron" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="bg-[#f9f9f8] text-[#495057] min-h-screen">
        {/* Top fade — content dissolves into background as it scrolls under the status bar */}
        <div
          className="fixed top-0 left-0 right-0 z-30 pointer-events-none"
          style={{
            height: "calc(env(safe-area-inset-top) + 24px)",
            background: "linear-gradient(to bottom, #f9f9f8 40%, transparent)",
          }}
        />
        <main className="max-w-lg mx-auto px-4" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>
          {children}
        </main>
        <Nav />
      </body>
    </html>
  );
}
