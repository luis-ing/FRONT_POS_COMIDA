/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "apipos.nodelog.online" },
    ],
  },
  // allowedDevOrigins: ['192.168.1.11'],
}

export default nextConfig
