'use client'

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app/useAppStore';
import BalancesTab from './BalancesTab';
import OpenOrdersTab from './OpenOrdersTab';

// This will be a placeholder for the Positions tab
const PositionsTab = () => (
  <div className="p-4 text-gray-400">
    Positions data coming soon...
  </div>
);

export default function Dashboard() {
  const { 
    subaccounts, 
    selectedSubaccount, 
    setSelectedSubaccount,
    activeTab,
    setActiveTab,
    walletPublicKey,
    customWalletAddress,
    connection,
    driftClient
  } = useAppStore();

  const [walletDisplay, setWalletDisplay] = useState('');

  useEffect(() => {
    // Set display for the wallet we're viewing (connected or custom)
    if (walletPublicKey) {
      setWalletDisplay(abbreviateAddress(walletPublicKey.toString()));
    } else if (customWalletAddress) {
      setWalletDisplay(abbreviateAddress(customWalletAddress));
    }
  }, [walletPublicKey, customWalletAddress]);

  // Helper to abbreviate addresses
  const abbreviateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Render the active tab
  const renderTabContent = () => {
    if (!selectedSubaccount) {
      return (
        <div className="p-4 text-center text-gray-400">
          {subaccounts.length === 0 
            ? "No subaccounts found for this wallet. You may need to create a subaccount first at app.drift.trade."
            : "Please select a subaccount to view details."}
        </div>
      );
    }

    switch (activeTab) {
      case 'balances':
        return <BalancesTab />;
      case 'positions':
        return <PositionsTab />;
      case 'orders':
        return <OpenOrdersTab />;
      default:
        return <BalancesTab />;
    }
  };

  // If no connection or client is established
  if (!connection || !driftClient) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-gray-500">Connecting to Drift Protocol...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Wallet info */}
      <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Wallet: {walletDisplay}</h2>
        
        {/* Subaccount selector */}
        {subaccounts.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Subaccount:
            </label>
            <div className="flex flex-wrap gap-2">
              {subaccounts.map((subaccount, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSubaccount(subaccount)}
                  className={`px-3 py-1 rounded-md ${
                    selectedSubaccount === subaccount
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  Subaccount {index}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-700">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('balances')}
            className={`py-2 px-4 ${
              activeTab === 'balances'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Balances
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`py-2 px-4 ${
              activeTab === 'positions'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Positions
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-4 ${
              activeTab === 'orders'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-slate-800/30 rounded-lg">
        {renderTabContent()}
      </div>
    </div>
  );
} 