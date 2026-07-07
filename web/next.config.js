/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Webpack configuration for external libraries
  webpack: (config) => {
    // Required for Leaflet (canvas) and Cytoscape (fs)
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

module.exports = nextConfig;
