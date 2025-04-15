// This file is a placeholder for rpc-websockets imports in the browser environment
export const Client = function() {
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

export default { Client }; 