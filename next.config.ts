import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.0.0.248", "192.168.*"],
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
})(nextConfig);
