/** @type {import('next').NextConfig} */
// Using require for Node.js modules that run during build
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

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

    // Add resolvers for specific problematic modules
    config.resolve.alias = {
      ...config.resolve.alias,
      // Handle rpc-websockets resolution issue
      'rpc-websockets/dist/lib/client': path.resolve(__dirname, 'rpc-websockets-resolve.js'),
      'rpc-websockets/dist/lib/client/websocket': path.resolve(__dirname, 'rpc-websockets-resolve.js'),
      // Provide a shim for any Node.js specific modules
      'fs': path.resolve(__dirname, 'node-browser-compatibility.js'),
      'net': path.resolve(__dirname, 'node-browser-compatibility.js'),
      'tls': path.resolve(__dirname, 'node-browser-compatibility.js'),
    };

    return config;
  },
  // Use transpilePackages to transpile specific packages that use Node.js modules
  transpilePackages: [
    '@drift-labs/sdk',
    '@coral-xyz/anchor',
    '@coral-xyz/anchor-30',
    '@project-serum/anchor',
    '@solana/web3.js',
    'rpc-websockets',
    '@pythnetwork/pyth-solana-receiver',
    'jito-ts'
  ],
  // Exclude specific directories from TypeScript compilation
  typescript: {
    ignoreBuildErrors: true, // This will ignore TypeScript errors during build
  },
};

module.exports = nextConfig; 