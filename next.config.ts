// next.config.ts
const nextConfig = {
  // output: "export",   ← comment out or delete this line
  images: {
    remotePatterns: [{ hostname: '*' }],
  },
};

export default nextConfig;