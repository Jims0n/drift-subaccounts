import { DriftClient, DriftClientConfig, DriftEnv, initialize, BulkAccountLoader } from '@drift-labs/sdk';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

// Initialize the drift client with a connection
export const initializeDriftClient = async (
  connection: Connection,
  walletPubKey?: PublicKey,
  env: DriftEnv = 'mainnet-beta'
): Promise<DriftClient> => {
  try {
    console.log('Starting Drift client initialization...');
    console.log('Environment:', env);
    console.log('Connection endpoint:', connection.rpcEndpoint);
    console.log('Wallet public key:', walletPubKey?.toString() || 'none');
    
    // Initialize the SDK
    console.log('Initializing Drift SDK...');
    await initialize({ env });
    console.log('Drift SDK initialized successfully');

    // Check for a provider wallet or use a dummy wallet
    const dummyWallet = {
      publicKey: walletPubKey || PublicKey.default,
      signTransaction: async (tx: Transaction) => tx,
      signAllTransactions: async (txs: Transaction[]) => txs,
    };

    console.log('Initializing Drift client with wallet public key:', walletPubKey?.toString() || 'none');

    // Determine if we're in browser environment
    const isBrowser = typeof window !== 'undefined';
    console.log(`Running in ${isBrowser ? 'browser' : 'server'} environment`);

    // Different configuration based on environment
    let config: DriftClientConfig;
    
    if (isBrowser) {
      // Browser configuration
      console.log('Using browser-compatible configuration (no account loader)');
      config = {
        connection,
        wallet: dummyWallet,
        env,
        opts: {
          skipPreflight: false,
          commitment: 'confirmed',
        },
        activeSubAccountId: 0,
        userStats: false,
        accountSubscription: {
          type: 'websocket',
          resubTimeoutMs: 30000,
          commitment: 'confirmed',
        },
      };
    } else {
      // Server configuration with proper account loader
      console.log('Using server configuration with BulkAccountLoader');
      const accountLoader = new BulkAccountLoader(
        connection,
        'confirmed',
        5000 // polling frequency in ms
      );
      
      config = {
        connection,
        wallet: dummyWallet,
        env,
        opts: {
          skipPreflight: false,
          commitment: 'confirmed',
        },
        activeSubAccountId: 0,
        userStats: false,
        accountSubscription: {
          type: 'polling',
          accountLoader,
        },
      };
    }

    // Create the client
    console.log('Creating DriftClient instance with config:', JSON.stringify({
      env: config.env,
      activeSubAccountId: config.activeSubAccountId,
      connection: 'Connection object',
      wallet: 'Wallet object',
      accountSubscription: config.accountSubscription ? 'configured' : 'undefined'
    }, null, 2));
    
    const driftClient = new DriftClient(config);
    console.log('DriftClient instance created successfully');
    
    // Subscribe regardless of environment - this is needed for both browser and server
    console.log('Subscribing to account updates...');
    try {
      await driftClient.subscribe();
      console.log('Successfully subscribed to account updates');
    } catch (subscribeError) {
      console.warn('Warning: Error during subscription, some features may not work correctly:', subscribeError);
    }
    
    return driftClient;
  } catch (error) {
    console.error('Error initializing Drift client:', error);
    throw new Error(`Failed to initialize Drift client: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Create a connection object
export const createConnection = (endpoint: string): Connection => {
  console.log(`Creating Solana connection to ${endpoint}`);
  
  if (!endpoint) {
    console.error('No RPC endpoint provided');
    throw new Error('No RPC endpoint provided for Solana connection');
  }
  
  try {
    const connection = new Connection(endpoint, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
    });
    console.log('Solana connection created successfully');
    return connection;
  } catch (error) {
    console.error('Error creating Solana connection:', error);
    throw new Error(`Failed to create Solana connection: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helius RPC endpoint (replace the placeholder with your actual API key)
// Sign up at https://helius.dev/ to get an API key
export const HELIUS_RPC_ENDPOINT = ''; 