import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['10.127.30.190'],
  async rewrites() {
    return [
      {
        source: '/calendar.ics',
        destination: '/api/calendar/feed',
      },
    ];
  },
};

export default nextConfig;
