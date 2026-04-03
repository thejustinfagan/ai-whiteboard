/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@excalidraw/excalidraw'],
};

module.exports = nextConfig;
