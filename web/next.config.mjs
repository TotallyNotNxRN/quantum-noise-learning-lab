/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["framer-motion", "recharts", "@react-three/drei"],
  },
};

export default nextConfig;
