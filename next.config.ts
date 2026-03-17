import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/c/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://*.telegram.org https://t.me https://*.vk.com https://vk.com https://*.max.ru https://max.ru",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
