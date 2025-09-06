import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY,
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
    BOK_API_KEY: process.env.BOK_API_KEY,
  },
  serverExternalPackages: ['@vercel/postgres'],
  // Turbopack 설정
  turbopack: {
    rules: {
      '*.env.local': {
        loaders: ['dotenv'],
      },
    },
  },
};

export default nextConfig;
