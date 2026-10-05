import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Em dev, o Next só serve o JS do cliente para `localhost`; o Supabase local usa 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [new URL("https://image.tmdb.org/t/p/**")],
  },
};

export default nextConfig;
