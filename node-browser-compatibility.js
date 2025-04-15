// This file is a placeholder for Node.js modules in browser environments
// It exports an empty object to prevent errors when modules try to access properties

// Default export for ESM
const nodeShim = {};

// Export as both ESM default and CommonJS module.exports
export default nodeShim;

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = nodeShim;
} 