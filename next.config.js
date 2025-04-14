/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      zlib: require.resolve('browserify-zlib'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      buffer: require.resolve('buffer'),
      process: require.resolve('process/browser'),
    };

    return config;
  },
  // Use transpilePackages to transpile specific packages that use Node.js modules
  transpilePackages: [
    '@drift-labs/sdk',
    '@coral-xyz/anchor',
    '@coral-xyz/anchor-30',
    '@project-serum/anchor',
    '@solana/web3.js'
  ],
  // Exclude specific directories from TypeScript compilation
  typescript: {
    ignoreBuildErrors: true, // This will ignore TypeScript errors during build
  },
};

module.exports = nextConfig; 