/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@personalbloom/db'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}
export default nextConfig
