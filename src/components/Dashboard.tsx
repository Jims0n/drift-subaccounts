'use client'

import { useState } from 'react';
import { useAppStore } from '@/stores/app/useAppStore';
import BalancesTab from './BalancesTab';
import OpenOrdersTab from './OpenOrdersTab';
import PerpPostionTab from './PerpPostionTab';
import DepositWithdrawForm from './DepositWithdrawForm';
import PerpOrderForm from './PerpOrderForm';

export default function Dashboard() {
  const { 
    subaccounts, 
    selectedSubaccount, 
    setSelectedSubaccount,
    connection,
    driftClient
  } = useAppStore();
  
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    balances: false,
    positions: false,
    orders: false,
  });

  // If no connection or client is established
  if (!connection || !driftClient) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#03040F]">
        <div className="animate-pulse text-lg text-gray-400">Connecting to Drift Protocol...</div>
      </div>
    );
  }

  const getSubaccountName = (index: number) => {
    return `SubAccount ${index}`;
  };

  const toggleSection = (section: 'balances' | 'positions' | 'orders') => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen bg-[#03040F]">
      {/* Header with Subaccount Selection - Fixed at top */}
      <div className="sticky top-0 z-10 bg-[#070814] backdrop-blur-sm border-b border-gray-800 shadow-lg">
        <div className="px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h3 className="text-gray-300 text-sm font-medium">Select Subaccount:</h3>
              <div className="flex flex-wrap gap-2">
                {subaccounts.map((subaccount, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSubaccount(subaccount)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      selectedSubaccount === subaccount
                        ? 'bg-[#3053AB] text-white shadow-md shadow-blue-900/30'
                        : 'bg-[#1E2131] text-gray-300 hover:bg-[#2A2E45] hover:shadow-sm'
                    }`}
                  >
                    {getSubaccountName(index)}
                  </button>
                ))}
              </div>
            </div>
            <button className="self-start sm:self-auto flex items-center bg-[#3053AB] hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-all shadow-sm hover:shadow-md text-sm">
              <span className="mr-1">+</span> Create
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Balances & Orders Card */}
          <div className="bg-gradient-to-b from-[#0F1120] to-[#0D0F1A] rounded-xl overflow-hidden shadow-xl border border-gray-800/50 h-fit">
            {/* Balances Section */}
            <div>
              <div 
                className="p-4 border-b border-gray-800/80 flex justify-between items-center cursor-pointer hover:bg-gray-800/10"
                onClick={() => toggleSection('balances')}
              >
                <h2 className="text-lg font-medium flex items-center">
                  <span className="text-white">Balances</span>
                  {selectedSubaccount && 
                    <span className="ml-2 text-sm text-gray-400">(Sub {subaccounts.indexOf(selectedSubaccount)})</span>
                  }
                </h2>
                <div className="text-gray-400">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transition-transform ${collapsedSections.balances ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {!collapsedSections.balances && (
                <>
                  <div className="p-4">
                    <BalancesTab />
                  </div>
                  
                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button 
                      className="bg-[#3053AB] hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-all shadow-sm hover:shadow"
                      onClick={() => setShowDepositForm(true)}
                    >
                      Deposit
                    </button>
                    <button 
                      className="bg-[#1E2131] hover:bg-[#2A2E45] text-white px-4 py-2 rounded-md transition-all shadow-sm hover:shadow"
                      onClick={() => setShowWithdrawForm(true)}
                    >
                      Withdraw
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* Open Orders */}
            <div>
              <div 
                className="p-4 border-t border-b border-gray-800/80 flex justify-between items-center cursor-pointer hover:bg-gray-800/10"
                onClick={() => toggleSection('orders')}
              >
                <h2 className="text-lg font-medium flex items-center">
                  <span className="text-white">Open Orders</span>
                  {selectedSubaccount && 
                    <span className="ml-2 text-sm text-gray-400">(Sub {subaccounts.indexOf(selectedSubaccount)})</span>
                  }
                </h2>
                <div className="text-gray-400">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transition-transform ${collapsedSections.orders ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {!collapsedSections.orders && (
                <div className="p-4">
                  <OpenOrdersTab />
                </div>
              )}
            </div>
          </div>

          {/* Perpetual Positions Section */}
          <div className="bg-gradient-to-b from-[#0F1120] to-[#0D0F1A] rounded-xl overflow-hidden shadow-xl border border-gray-800/50 h-fit">
            <div 
              className="p-4 border-b border-gray-800/80 flex justify-between items-center cursor-pointer hover:bg-gray-800/10"
              onClick={() => toggleSection('positions')}
            >
              <h2 className="text-lg font-medium flex items-center">
                <span className="text-white">Perpetual Positions</span>
                {selectedSubaccount && 
                  <span className="ml-2 text-sm text-gray-400">(Sub {subaccounts.indexOf(selectedSubaccount)})</span>
                }
              </h2>
              <div className="text-gray-400">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 transition-transform ${collapsedSections.positions ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {!collapsedSections.positions && (
              <div className="p-4">
                <PerpPostionTab />
              </div>
            )}
          </div>

          {/* Place Order Section */}
          <div className="bg-gradient-to-b from-[#0F1120] to-[#0D0F1A] rounded-xl overflow-hidden shadow-xl border border-gray-800/50 h-fit md:col-span-2 lg:col-span-1">
            <div className="p-4 border-b border-gray-800/80">
              <h2 className="text-lg font-medium flex items-center">
                <span className="text-white">Place Order</span>
                {selectedSubaccount && 
                  <span className="ml-2 text-sm text-gray-400">(Sub {subaccounts.indexOf(selectedSubaccount)})</span>
                }
              </h2>
            </div>
            <div className="p-5">
              <PerpOrderForm />
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Deposit Form */}
      {showDepositForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" onClick={() => setShowDepositForm(false)}></div>
          <div className="z-10 animate-fadeIn max-w-md w-full mx-4">
            <DepositWithdrawForm 
              action="deposit" 
              onClose={() => setShowDepositForm(false)} 
            />
          </div>
        </div>
      )}

      {/* Modal for Withdraw Form */}
      {showWithdrawForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" onClick={() => setShowWithdrawForm(false)}></div>
          <div className="z-10 animate-fadeIn max-w-md w-full mx-4">
            <DepositWithdrawForm 
              action="withdraw" 
              onClose={() => setShowWithdrawForm(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
} 