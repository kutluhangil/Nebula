import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only the hosts this app actually reads. The imgur and wikimedia entries
    // were left over from the retired r-spacex feed, and would have quietly
    // become live permissions the moment an <Image> dropped `unoptimized`.
    remotePatterns: [
      { protocol: "https", hostname: "apod.nasa.gov" },
      { protocol: "https", hostname: "**.nasa.gov" },
    ],
  },
};

export default nextConfig;
