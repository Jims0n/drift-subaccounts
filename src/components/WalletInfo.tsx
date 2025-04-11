"use client";

import { useWalletStore } from "@/stores/useWalletStore";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletInfo() {
  const { authority, authorityString, isWalletConnected } = useWalletStore();
  const { wallet } = useWallet();

  if (!isWalletConnected || !authority) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-gray-500">Connect your wallet to continue</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-700 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">Wallet Information</h2>
      
      <div className="space-y-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <p className="text-gray-400 mb-1">Connected Wallet</p>
          <p className="text-white font-semibold">{wallet?.adapter.name}</p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg">
          <p className="text-gray-400 mb-1">Wallet Address</p>
          <p className="text-white font-mono text-sm break-all">{authorityString}</p>
        </div>
      </div>
    </div>
  );
} 