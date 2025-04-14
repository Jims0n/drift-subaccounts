'use client'

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app/useAppStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { createConnection, initializeDriftClient } from '@/utils/drift';
import { PublicKey } from '@solana/web3.js';

export default function ConnectionInitializer() {
  const { 
    setConnection, 
    setDriftClient, 
    customWalletAddress,
    fetchSubaccounts,
    setWalletPublicKey
  } = useAppStore();
  
  const { authority, isWalletConnected } = useWalletStore();

  // Force sync the wallet public key - this is a direct way to ensure the app store is updated
  useEffect(() => {
    console.log('ConnectionInitializer: Sync wallet state', { 
      authority: authority?.toString(), 
      isWalletConnected 
    });
    
    if (authority && isWalletConnected) {
      setWalletPublicKey(authority);
    }
  }, [authority, isWalletConnected, setWalletPublicKey]);

  // Set up connection and drift client when wallet connects
  useEffect(() => {
    let isMounted = true;
    
    const initializeConnection = async () => {
      try {
        // Use default endpoint or environment variable
        const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        
        // Create connection
        const newConnection = createConnection(endpoint);
        if (isMounted) setConnection(newConnection);
        
        // Initialize with connected wallet or custom address
        const walletPubKey = authority || (customWalletAddress ? new PublicKey(customWalletAddress) : null);
        
        if (walletPubKey) {
          // Initialize the drift client with the wallet public key
          const driftClient = await initializeDriftClient(newConnection, walletPubKey);
          
          if (isMounted) {
            setDriftClient(driftClient);
            
            // If we have a connected wallet, fetch subaccounts
            if (authority) {
              await fetchSubaccounts(authority);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing connection:', error);
      }
    };
    
    // Initialize when component mounts
    initializeConnection();
    
    // Clean up on unmount
    return () => {
      isMounted = false;
    };
  }, [authority, customWalletAddress, setConnection, setDriftClient, fetchSubaccounts]);

  // This is a utility component that doesn't render anything visible
  return null;
} 