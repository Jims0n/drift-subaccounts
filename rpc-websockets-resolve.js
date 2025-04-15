// This file is a placeholder for rpc-websockets imports in the browser environment

// Create a no-op client implementation for browser
const Client = function() {
  // No-op client implementation for browser
  return {
    on: () => {},
    off: () => {},
    call: () => Promise.resolve(null),
    subscribe: () => Promise.resolve(),
    unsubscribe: () => Promise.resolve(),
    close: () => {}
  };
};

// Create module exports
const moduleExports = { Client };

// Export as both ESM default and named export
export default moduleExports;
export { Client };

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = moduleExports;
  module.exports.Client = Client;
} 