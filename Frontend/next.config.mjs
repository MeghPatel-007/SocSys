/** @type {import('next').NextConfig} */
const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/express/:path*",
        destination: `${backendBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
