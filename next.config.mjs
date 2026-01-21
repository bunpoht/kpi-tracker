/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "collections.wu.ac.th",
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig