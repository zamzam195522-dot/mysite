/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone', // For Docker deployment
  reactStrictMode: true,
  turbopack: {}, // Enable Turbopack with empty config
  webpack: (config) => {
    // Ensure `@/...` imports work reliably in all environments (Linux/cPanel included)
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
