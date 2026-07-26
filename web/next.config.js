/** @type {import('next').NextConfig} */

const backendUrl =
  process.env.BACKEND_API_BASE_URL ||
  "https://ibha-ksp-backend-50043872695.development.catalystappsail.in";

const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },

  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;