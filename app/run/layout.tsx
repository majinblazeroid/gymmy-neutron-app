import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#79addc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RunLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
