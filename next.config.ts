/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Remove this if you are moving to server-side
  // For OpenNext, we actually usually don't need 'export' anymore, 
  // but let's ensure the config is clean.
  // If you were using 'export', REMOVE it for server features.

  // Optional: configure images if needed
  images: {
    remotePatterns: [
      { hostname: '*' } // Adjust for your needs
    ]
  }
};

export default nextConfig;