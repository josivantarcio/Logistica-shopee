import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Cache offline: todas as páginas e assets estáticos
  runtimeCaching: [
    {
      // Cache das páginas da aplicação (HTML)
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "logistica-pages",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        },
        networkTimeoutSeconds: 5,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // força webpack para compatibilidade com next-pwa
  turbopack: {},
};

export default withPWA(nextConfig);
