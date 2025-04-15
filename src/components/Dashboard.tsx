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

  // If no connection or client is established
  if (!connection || !driftClient) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#03040F]">
        <div className="animate-pulse text-lg text-gray-400">Connecting to Drift Protocol...</div>
      </div>
    );
  }

  const getSubaccountName = (index: number) => {
    return `SubAccount ${index }`;
  };

  return (
    <div>
      
      {/* Subaccount Selection */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center">
          <span className="text-gray-400 mr-4">Select Subaccount:</span>
          <div className="flex space-x-2">
            {subaccounts.map((subaccount, index) => (
              <button
                key={index}
                onClick={() => setSelectedSubaccount(subaccount)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  selectedSubaccount === subaccount
                    ? 'bg-[#3053AB] text-white'
                    : 'bg-[#1E2131] text-gray-300 hover:bg-[#2A2E45]'
                }`}
              >
                {getSubaccountName(index)}
              </button>
            ))}
          </div>
        </div>
        <button className="flex items-center bg-[#3053AB] hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
          <span className="mr-1">+</span> Create
        </button>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="flex flex-1 p-6 gap-4">
        {/* Balances Section */}
        <div className="flex-1 bg-[#0F1120] rounded-lg overflow-hidden shadow-lg">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-medium">Balances {selectedSubaccount && `(Sub ${subaccounts.indexOf(selectedSubaccount)})`}</h2>
          </div>
          <div className="p-4">
            <BalancesTab />
          </div>
          
          {/* Actions */}
          <div className="p-4 flex gap-2">
            <button 
              className="bg-[#3053AB] hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              onClick={() => setShowDepositForm(true)}
            >
              Deposit
            </button>
            <button 
              className="bg-[#1E2131] hover:bg-[#2A2E45] text-white px-4 py-2 rounded-md transition-colors"
              onClick={() => setShowWithdrawForm(true)}
            >
              Withdraw
            </button>
          </div>
          
          {/* Open Orders */}
          <div className="p-4 border-t border-gray-800">
            <h2 className="text-lg font-medium mb-4">Open Orders {selectedSubaccount && `(Sub ${subaccounts.indexOf(selectedSubaccount)})`}</h2>
            <OpenOrdersTab />
          </div>
        </div>

        {/* Perpetual Positions Section */}
        <div className="flex-1 bg-[#0F1120] rounded-lg overflow-hidden shadow-lg">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-medium">Perpetual Positions {selectedSubaccount && `(Sub ${subaccounts.indexOf(selectedSubaccount)})`}</h2>
          </div>
          <div className="p-4">
            <PerpPostionTab />
          </div>
        </div>

        {/* Place Order Section */}
        <div className="flex-1 bg-[#0F1120] rounded-lg overflow-hidden shadow-lg">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-medium">Place Order {selectedSubaccount && `(Sub ${subaccounts.indexOf(selectedSubaccount)})`}</h2>
          </div>
          <div className="p-6">
            <PerpOrderForm />
          </div>
        </div>
      </div>

      {/* Modal for Deposit Form */}
      {showDepositForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDepositForm(false)}></div>
          <div className="z-10">
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
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowWithdrawForm(false)}></div>
          <div className="z-10">
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