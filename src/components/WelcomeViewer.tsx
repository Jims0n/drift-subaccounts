'use client'

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app/useAppStore';
import { useModalStore } from '@/stores/useModalStore';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import Dashboard from './Dashboard';

export default function WelcomeViewer() {
  const [walletAddress, setWalletAddress] = useState('');
  const { 
    fetchCustomWalletSubaccounts, 
    setCustomWalletAddress, 
    fetchingCustomWallet,
    walletPublicKey,
    customWalletAddress,
    subaccounts
  } = useAppStore();
  const setModalStore = useModalStore((s) => s.set);
  
  // Add debug logging
  useEffect(() => {
    console.log('WelcomeViewer state changed:', { 
      hasWalletPublicKey: !!walletPublicKey, 
      walletPublicKey: walletPublicKey?.toString(),
      hasCustomWalletAddress: !!customWalletAddress,
      subaccountsCount: subaccounts.length 
    });
  }, [walletPublicKey, customWalletAddress, subaccounts]);
  
  // Check if we should show the dashboard instead of the welcome screen
  const shouldShowDashboard = !!walletPublicKey || (!!customWalletAddress && subaccounts.length > 0);
  
  const openConnectWalletModal = () => {
    setModalStore((s) => {
      s.modals.showConnectWalletModal = true;
    });
  };
  
  const handleViewWalletData = async () => {
    if (!walletAddress) return;
    
    try {
      // Validate wallet address
      new PublicKey(walletAddress);
      
      // Update custom wallet address and fetch data
      setCustomWalletAddress(walletAddress);
      await fetchCustomWalletSubaccounts();
    } catch (error) {
      console.error('Invalid wallet address:', error);
      toast.error('Invalid Solana wallet address');
    }
  };

  // If a wallet is connected or we're viewing a custom wallet, show the dashboard
  if (shouldShowDashboard) {
    console.log('Showing Dashboard component');
    return <Dashboard />;
  }

  // Otherwise show the welcome screen
  console.log('Showing welcome screen');
  return (
    <div className="w-full max-w-md text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to the Viewer</h1>
      
      <p className="text-lg text-gray-300 mb-8">
        Connect your Solana wallet to manage your Drift subaccounts 
        and view your positions and balances.
      </p>
      
      <button 
        onClick={openConnectWalletModal}
        className="w-full py-3 px-6 mb-6 bg-[#3053AB] hover:bg-blue-700 
        rounded-lg transition-colors text-white font-medium"
      >
        Connect Wallet
      </button>
      
      <div className="flex items-center justify-center mb-6">
        <div className="flex-1 h-px bg-gray-700"></div>
        <span className="px-4 text-gray-500">OR</span>
        <div className="flex-1 h-px bg-gray-700"></div>
      </div>
      
      <p className="text-gray-400 mb-4 text-center">
        View public data for any wallet address:
      </p>
      
      <div className="mb-4">
        <label className="block text-left text-sm font-medium text-gray-400 mb-2">
          Address:
        </label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter Solana wallet address"
          className="w-full p-3 bg-transparent border border-gray-700 rounded-lg text-white"
        />
      </div>
      
      <button
        onClick={handleViewWalletData}
        disabled={!walletAddress || fetchingCustomWallet}
        className="w-full py-3 px-6 bg-[#3053AB] hover:bg-blue-700 disabled:bg-[#3053AB]
        disabled:opacity-50 rounded-lg transition-colors text-white font-medium"
      >
        {fetchingCustomWallet ? 'Loading...' : 'View Wallet Data'}
      </button>
    </div>
  );
} 