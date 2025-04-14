'use client';

import { useEffect } from 'react';
import { useWalletStore } from '@/stores/useWalletStore';
import { useAppStore } from '@/stores/app/useAppStore';

/**
 * Keeps the wallet state synchronized between the wallet store and app store
 */
const useSyncStores = () => {
  const { authority, isWalletConnected } = useWalletStore();
  const { setWalletPublicKey } = useAppStore();

  // Sync wallet public key from wallet store to app store
  useEffect(() => {
    console.log('Syncing wallet state', { authority, isWalletConnected });
    setWalletPublicKey(authority || null);
  }, [authority, isWalletConnected, setWalletPublicKey]);

  return null;
};

export default useSyncStores; 