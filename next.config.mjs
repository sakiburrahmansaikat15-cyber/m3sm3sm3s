/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // uploads are served by app/uploads/[...path]; keep big GLB uploads working
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
