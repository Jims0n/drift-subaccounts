import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores/app/useAppStore';
import { QUOTE_SPOT_MARKET_INDEX, BN } from '@drift-labs/sdk';

interface TokenBalance {
    name: string;
    amount: string;
    value: string;
    decimals: number;
}

const TOKEN_METADATA: Record<number, { name: string; decimals: number; symbol: string }> = {
    0: { name: 'USDC', decimals: 6, symbol: 'USDC' },
    1: { name: 'SOL', decimals: 9, symbol: 'SOL' },
    2: { name: 'BTC', decimals: 6, symbol: 'BTC' },
    3: { name: 'ETH', decimals: 6, symbol: 'ETH' },
    // Add more tokens as needed
  };


const BalancesTab = () => {
    const { selectedSubaccount, driftClient } = useAppStore();
    const [balances, setBalances] = useState<TokenBalance[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const formatTokenAmount = (amount: BN, decimals: number): string => {
        if (!amount) return '0';
        try {
          // Convert to string first to handle BN properly
          const amountStr = amount.toString();
          // Convert to number with appropriate decimal places
          const amountNum = parseFloat(amountStr) / Math.pow(10, decimals);
          return amountNum.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 6 
          });
        } catch (e) {
          console.error('Error formatting token amount:', e);
          return '0';
        }
      };


      const refreshBalances = async () => {
        if (!selectedSubaccount || !driftClient) return;
        
        setLoading(true);
        try {
          // Ensure account subscription is active
          try {
            // This might fail if already subscribed
            await driftClient.subscribe();
          } catch (subError) {
            console.log('Subscribe error (might already be subscribed):', subError);
          }
          
          // Force refresh user account data
          try {
            await selectedSubaccount.fetchAccounts();
          } catch (fetchError) {
            console.log('Fetch accounts error:', fetchError);
          }
          
          const userAccount = selectedSubaccount.getUserAccount();
          const updatedBalances: TokenBalance[] = [];
          
          // Get USDC balance first (index 0)
          try {
            const quoteToken = userAccount.spotPositions.find(
              position => position.marketIndex === QUOTE_SPOT_MARKET_INDEX
            );
            
            if (quoteToken && !quoteToken.scaledBalance.isZero()) {
              const metadata = TOKEN_METADATA[QUOTE_SPOT_MARKET_INDEX] || 
                { name: 'USDC', decimals: 6, symbol: 'USDC' };
              
              const tokenAmount = selectedSubaccount.getTokenAmount(QUOTE_SPOT_MARKET_INDEX);
              const formattedAmount = formatTokenAmount(tokenAmount, metadata.decimals);
              
              updatedBalances.push({
                name: metadata.name,
                amount: formattedAmount,
                value: `$${formattedAmount}`,
                decimals: metadata.decimals
              });
            } else {
              // Add USDC with zero balance if not found
              updatedBalances.push({
                name: 'USDC',
                amount: '0',
                value: '$0',
                decimals: 6
              });
            }
          } catch (e) {
            console.error('Error getting USDC balance:', e);
            // Add fallback USDC entry
            updatedBalances.push({
              name: 'USDC',
              amount: '0',
              value: '$0',
              decimals: 6
            });
          }
          
          // Get other token balances
          if (userAccount.spotPositions) {
            for (const position of userAccount.spotPositions) {
              // Skip USDC as we already added it
              if (position.marketIndex === QUOTE_SPOT_MARKET_INDEX) continue;
              
              // Only add non-zero balances
              if (!position.scaledBalance.isZero()) {
                try {
                  const metadata = TOKEN_METADATA[position.marketIndex] || 
                    { name: `Token ${position.marketIndex}`, decimals: 6, symbol: `TOKEN${position.marketIndex}` };
                  
                  // Get token amount through the Drift SDK
                  const tokenAmount = selectedSubaccount.getTokenAmount(position.marketIndex);
                  const formattedAmount = formatTokenAmount(tokenAmount, metadata.decimals);
                  
                  // Get token price if available
                  let tokenValue = 0;
                  try {
                    const marketData = await driftClient.getSpotMarketAccount(position.marketIndex);
                    if (marketData) {
                      // Get the oracle price from the market
                      const oracleData = driftClient.getOracleDataForSpotMarket(position.marketIndex);
                      if (oracleData && oracleData.price) {
                        const priceNum = parseFloat(oracleData.price.toString()) / Math.pow(10, 6);
                        tokenValue = parseFloat(formattedAmount.replace(/,/g, '')) * priceNum;
                      }
                    }
                  } catch (priceError) {
                    console.log(`Error getting price for token ${position.marketIndex}:`, priceError);
                  }
                  
                  updatedBalances.push({
                    name: metadata.name,
                    amount: formattedAmount,
                    value: `$${tokenValue.toLocaleString(undefined, { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}`,
                    decimals: metadata.decimals
                  });
                } catch (tokenError) {
                  console.error(`Error processing token ${position.marketIndex}:`, tokenError);
                }
              }
            }
          }
          
          setBalances(updatedBalances);
          setError(null);
        } catch (e) {
          console.error('Error loading balances:', e);
          setError('Could not load balances. The Drift client may not be fully subscribed.');
        } finally {
          setLoading(false);
        }
      };
      
      useEffect(() => {
        refreshBalances();
      }, [selectedSubaccount, driftClient]);
    
      if (!selectedSubaccount) {
        return (
          <div className="p-4 text-gray-400">
            Please select a subaccount to view balances.
          </div>
        );
      }

    return ( 
        <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Your Balances</h3>
          <button 
            onClick={refreshBalances}
            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md">
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-red-400 text-xs mt-1">
              Try refreshing the page or waiting a moment for the connection to establish.
            </p>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center my-4">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        )}
        
        {!loading && balances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {balances.map((balance, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-white">{balance.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                      {balance.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                      {balance.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-400">
            {loading 
              ? 'Loading balances...' 
              : error 
                ? 'Unable to load balances due to connection issues.' 
                : 'No balances found.'}
          </div>
        )}
      </div>
    );
}
 
export default BalancesTab;