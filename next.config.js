/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  webpack: (config) => {
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      path: false,
      zlib: false,
      http: false,
      https: false,
      os: false,
      buffer: false,
      process: false,
    };

    // Add resolvers for problematic modules
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // Use simple relative paths instead of path.resolve
    config.resolve.alias['rpc-websockets/dist/lib/client'] = './rpc-websockets-resolve.js';
    config.resolve.alias['rpc-websockets/dist/lib/client/websocket'] = './rpc-websockets-resolve.js';
    config.resolve.alias['fs'] = './node-browser-compatibility.js';
    config.resolve.alias['net'] = './node-browser-compatibility.js';
    config.resolve.alias['tls'] = './node-browser-compatibility.js';

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