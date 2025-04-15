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
    
    // Using relative paths to avoid require()
    const rpcWebSocketsShim = new URL('./rpc-websockets-resolve.js', import.meta.url).pathname;
    const nodeCompatShim = new URL('./node-browser-compatibility.js', import.meta.url).pathname;
    
    // Handle rpc-websockets resolution issue
    config.resolve.alias['rpc-websockets/dist/lib/client'] = rpcWebSocketsShim;
    config.resolve.alias['rpc-websockets/dist/lib/client/websocket'] = rpcWebSocketsShim;
    
    // Provide shims for Node.js specific modules
    config.resolve.alias['fs'] = nodeCompatShim;
    config.resolve.alias['net'] = nodeCompatShim;
    config.resolve.alias['tls'] = nodeCompatShim;

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

export default nextConfig; 