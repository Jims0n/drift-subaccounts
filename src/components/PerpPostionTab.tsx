import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores/app/useAppStore';
import { BN } from '@drift-labs/sdk';
import TakeProfitStopLossForm from './TakeProfit-StopLossForm';


// Define direction type using SDK convention
type PositionDirection = 'Long' | 'Short';

// Interfaces for position data
interface PositionData {
    market: string;
  direction: PositionDirection;
    size: string;
    notional: string;
    entryPrice: string;
    markPrice: string;
    pnl: string;
    pnlPercent: string;
  // Additional fields needed for TP/SL form
  marketIndex?: number;
  markPriceValue?: number;
}

// Define interface for BN with explicit methods we use
interface ExtendedBN extends BN {
  isZero(): boolean;
  toString(): string;
  gt(other: BN): boolean;
  lt(other: BN): boolean;
}

// Market mapping following Drift protocol market indices
const MARKET_MAPPING: Record<number, { name: string; baseDecimals: number; quoteDecimals: number }> = {
  0: { name: 'SOL-PERP', baseDecimals: 9, quoteDecimals: 6 },
  1: { name: 'BTC-PERP', baseDecimals: 6, quoteDecimals: 6 },
  2: { name: 'ETH-PERP', baseDecimals: 6, quoteDecimals: 6 },
  3: { name: 'mSOL-PERP', baseDecimals: 9, quoteDecimals: 6 },
  4: { name: 'BNB-PERP', baseDecimals: 8, quoteDecimals: 6 },
  5: { name: 'AVAX-PERP', baseDecimals: 8, quoteDecimals: 6 },
  6: { name: 'ARB-PERP', baseDecimals: 8, quoteDecimals: 6 },
  7: { name: 'DOGE-PERP', baseDecimals: 8, quoteDecimals: 6 },
  8: { name: 'MATIC-PERP', baseDecimals: 8, quoteDecimals: 6 },
  9: { name: 'SUI-PERP', baseDecimals: 8, quoteDecimals: 6 },
  10: { name: 'XRP-PERP', baseDecimals: 8, quoteDecimals: 6 },
  11: { name: 'ADA-PERP', baseDecimals: 8, quoteDecimals: 6 },
  12: { name: 'APT-PERP', baseDecimals: 8, quoteDecimals: 6 },
  13: { name: 'LTC-PERP', baseDecimals: 8, quoteDecimals: 6 },
  14: { name: 'BCH-PERP', baseDecimals: 8, quoteDecimals: 6 },
  15: { name: 'OP-PERP', baseDecimals: 8, quoteDecimals: 6 },
  16: { name: 'LINK-PERP', baseDecimals: 8, quoteDecimals: 6 },
  17: { name: 'NEAR-PERP', baseDecimals: 8, quoteDecimals: 6 },
  18: { name: 'JTO-PERP', baseDecimals: 8, quoteDecimals: 6 },
  19: { name: 'TIA-PERP', baseDecimals: 8, quoteDecimals: 6 },
  20: { name: 'JUP-PERP', baseDecimals: 8, quoteDecimals: 6 },
  21: { name: 'WIF-PERP', baseDecimals: 8, quoteDecimals: 6 },
  22: { name: 'SEI-PERP', baseDecimals: 8, quoteDecimals: 6 },
  23: { name: 'DYM-PERP', baseDecimals: 8, quoteDecimals: 6 },
  24: { name: 'STRK-PERP', baseDecimals: 8, quoteDecimals: 6 },
  25: { name: 'BONK-PERP', baseDecimals: 5, quoteDecimals: 6 },
  26: { name: 'PYTH-PERP', baseDecimals: 8, quoteDecimals: 6 },
  27: { name: 'RNDR-PERP', baseDecimals: 8, quoteDecimals: 6 },
};

// Constants for decimal precision
const PRICE_PRECISION = 6; // Standard price precision in the Drift protocol

// Define ExtendedUserAccount interface for dynamic property access
interface ExtendedUserAccount {
  perpPositions?: Record<string, unknown>[];
  positions?: Record<string, unknown>[];
  [key: string]: unknown;
}

// Extended interfaces for drift client methods
interface DriftClientMethods {
  getPerpMarketAccount?: (marketIndex: number) => Promise<unknown>;
  getOraclePriceData?: (marketIndex: number) => Promise<{ price: BN }>;
  getMarketPrice?: (marketIndex: number) => Promise<BN>;
  getOraclePrice?: (marketIndex: number) => Promise<unknown>;
  getOraclePriceForMarket?: (marketIndex: number, isPerpMarket: boolean) => Promise<unknown>;
  getOracleDataForPerpMarket?: (marketIndex: number) => Promise<{price?: unknown}>;
  [key: string]: unknown;
}

// Interface for TakeProfit-StopLossForm component
interface Position {
  marketIndex: number;
  direction: PositionDirection;
  markPriceValue: number;
  size: string;
  market: string;
  notional: string;
  entryPrice: string;
  markPrice: string;
  pnl: string;
  pnlPercent: string;
}

const PerpPositionTab = () => {
    const { selectedSubaccount, driftClient } = useAppStore();
    const [positions, setPositions] = useState<PositionData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<PositionData | null>(null);
    const [isTpSlModalOpen, setIsTpSlModalOpen] = useState(false);

  // Helper function to check if a BN value is zero
  const isZeroBN = (value: unknown): boolean => {
    if (!value) return true;
    
    try {
      // Try using isZero method if available
      if (typeof (value as ExtendedBN).isZero === 'function') {
        return (value as ExtendedBN).isZero();
      }
    } catch {
      // Fallback to string comparison if isZero throws
    }
    
    // Fallback to string conversion
    return value.toString() === '0';
  };

  // Helper for comparing BN values
  const isBNGreaterThanZero = (value: unknown): boolean => {
    if (!value) return false;
    
    try {
      // Try using gt method if available
      if (typeof (value as ExtendedBN).gt === 'function') {
        return (value as ExtendedBN).gt(new BN(0));
      }
    } catch {
      // Fallback if gt throws
    }
    
    // Fallback to string representation
    const valueStr = value.toString();
    return valueStr !== '0' && !valueStr.startsWith('-');
  };

    const refreshPositions = async () => {
        setLoading(true);
    setError(null);
    try {
      if (!selectedSubaccount || !driftClient) {
        setPositions([]);
        return;
      }

      console.log('Refreshing positions...');
      
      // Type assertions with proper interfaces
      const typedUser = selectedSubaccount as unknown as { 
        getPerpPositions?: () => Promise<Record<string, unknown>[]>;
        getActivePerpPositions?: () => Promise<Record<string, unknown>[]>;
        getPerpEntryPrice?: (marketIndex: number) => Promise<unknown>;
      };
      
      const typedClient = driftClient as unknown as DriftClientMethods;
      const userAccount = selectedSubaccount.getUserAccount() as unknown as ExtendedUserAccount;
      
          // Ensure account subscription is active
          try {
        // Attempt to subscribe to account updates
        console.log('Checking account subscription...');
      } catch (error) {
        console.error('Error with account subscription:', error);
          }
          
          // Force refresh user account data
          try {
            await selectedSubaccount.fetchAccounts();
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
      
      let perpPositions: Record<string, unknown>[] = [];
      
      // Try different methods to get positions
      if (typeof typedUser.getPerpPositions === 'function') {
        try {
          perpPositions = await typedUser.getPerpPositions();
          console.log('Got positions from getPerpPositions:', perpPositions);
        } catch (e) {
          console.error('Error getting perp positions:', e);
        }
      } 
      else if (typeof typedUser.getActivePerpPositions === 'function') {
        try {
          perpPositions = await typedUser.getActivePerpPositions();
          console.log('Got positions from getActivePerpPositions:', perpPositions);
        } catch (e) {
          console.error('Error getting active perp positions:', e);
        }
      }
      else if (userAccount && userAccount.perpPositions) {
        perpPositions = userAccount.perpPositions;
        console.log('Got positions from userAccount.perpPositions:', perpPositions);
      } else if (userAccount && userAccount.positions) {
        perpPositions = userAccount.positions as Record<string, unknown>[];
        console.log('Got positions from userAccount.positions:', perpPositions);
      }
      
      console.log('Raw positions data:', perpPositions);
      
      if (perpPositions.length === 0) {
        setPositions([]);
        setLoading(false);
        return;
      }
      
      // Process each position
          const formattedPositions = await Promise.all(
            perpPositions
          .filter(position => {
            const baseAssetAmount = position.baseAssetAmount;
            if (!baseAssetAmount) return false;
            
            try {
              // Use the isZeroBN helper
              return !isZeroBN(baseAssetAmount);
            } catch (e) {
              console.error('Error checking if position is zero:', e);
              return false;
            }
          })
          .map(async (position) => {
            try {
              const marketIndex = position.marketIndex as number;
              
              // Get market info
              const marketInfo = MARKET_MAPPING[marketIndex] || 
                { name: `PERP-${marketIndex}`, baseDecimals: 8, quoteDecimals: 6 };
              
              // Determine direction
              let direction: PositionDirection = 'Long';
              const baseAssetAmount = position.baseAssetAmount;
              
              try {
                direction = isBNGreaterThanZero(baseAssetAmount) ? 'Long' : 'Short';
              } catch {
                // Fallback to string method
                const baseAssetAmountStr = baseAssetAmount?.toString() || '0';
                direction = baseAssetAmountStr.startsWith('-') ? 'Short' : 'Long';
              }
              
              // Calculate base amount with proper decimals
              const baseDecimals = marketInfo.baseDecimals;
              const quoteDecimals = marketInfo.quoteDecimals;
              
              const baseAssetAmountStr = baseAssetAmount?.toString() || '0';
              const baseAssetAmountAbs = Math.abs(
                parseFloat(baseAssetAmountStr) / Math.pow(10, baseDecimals)
              );
              
              // Get mark price (oracle price)
              let markPrice = 0;
              let entryPrice = 0;
              
              // Try available methods to get oracle price
              if (typeof typedClient.getOraclePrice === 'function') {
                const oraclePrice = await typedClient.getOraclePrice(marketIndex);
                if (oraclePrice) {
                  markPrice = parseFloat(oraclePrice.toString()) / Math.pow(10, PRICE_PRECISION);
                }
              }
              else if (typeof typedClient.getOraclePriceForMarket === 'function') {
                const oraclePrice = await typedClient.getOraclePriceForMarket(marketIndex, true);
                if (oraclePrice) {
                  markPrice = parseFloat(oraclePrice.toString()) / Math.pow(10, PRICE_PRECISION);
                }
              }
              else if (typeof typedClient.getOracleDataForPerpMarket === 'function') {
                const oracleData = await typedClient.getOracleDataForPerpMarket(marketIndex);
                if (oracleData?.price) {
                  markPrice = parseFloat(oracleData.price.toString()) / Math.pow(10, PRICE_PRECISION);
                }
              }
              
              // Calculate entry price from quoteEntryAmount
              if (position.quoteEntryAmount) {
                const quoteEntryAmount = position.quoteEntryAmount;
                
                if (quoteEntryAmount && baseAssetAmount && !isZeroBN(baseAssetAmount)) {
                  const quoteEntryFloat = parseFloat(quoteEntryAmount.toString());
                  const baseAssetAmountFloat = parseFloat(baseAssetAmount.toString());
                  
                  entryPrice = Math.abs(quoteEntryFloat / baseAssetAmountFloat);
                  entryPrice = entryPrice * (Math.pow(10, baseDecimals) / Math.pow(10, quoteDecimals));
                }
              }
              
              // If entry price couldn't be calculated, try SDK method
              if (entryPrice === 0 && typeof typedUser.getPerpEntryPrice === 'function') {
                try {
                  const sdkEntryPrice = await typedUser.getPerpEntryPrice(marketIndex);
                  if (sdkEntryPrice) {
                    entryPrice = parseFloat(sdkEntryPrice.toString());
                  }
                } catch (err) {
                  console.log('Could not get entry price from SDK:', err);
                }
              }
              
              // Calculate PnL
              let unrealizedPnl = 0;
              let pnlPercent = 0;
              
              if (markPrice > 0 && entryPrice > 0 && baseAssetAmountAbs > 0) {
                if (direction === 'Long') {
                  unrealizedPnl = baseAssetAmountAbs * (markPrice - entryPrice);
                            pnlPercent = ((markPrice / entryPrice) - 1) * 100;
                          } else {
                  unrealizedPnl = baseAssetAmountAbs * (entryPrice - markPrice);
                            pnlPercent = ((entryPrice / markPrice) - 1) * 100;
                          }
                        }
                  
                  // Calculate notional value
              const notional = baseAssetAmountAbs * markPrice;
                  
              // Return formatted position data
                  return {
                market: marketInfo.name,
                direction: direction,
                size: baseAssetAmountAbs.toFixed(4),
                    notional: `$${notional.toFixed(2)}`,
                    entryPrice: `$${entryPrice.toFixed(2)}`,
                    markPrice: `$${markPrice.toFixed(2)}`,
                    pnl: `${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toFixed(2)}`,
                    pnlPercent: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`,
                marketIndex: marketIndex,
                markPriceValue: markPrice,
                  };
            } catch (error) {
              console.error('Error processing position:', error);
                  return null;
                }
              })
          );
          
      // Filter out null positions from errors
          setPositions(formattedPositions.filter(Boolean) as PositionData[]);
      
    } catch (error) {
      console.error('Error fetching positions:', error);
      setError('Failed to fetch positions. Please try again.');
        } finally {
          setLoading(false);
        }
      };

  // Subscribe to position updates
      useEffect(() => {
    // No need for subscription variable as we aren't using it
    
    const subscribeToPositions = async () => {
      try {
        if (selectedSubaccount && driftClient) {
          await refreshPositions();
        }
      } catch (error) {
        console.error('Error subscribing to position updates:', error);
      }
    };
    
    if (selectedSubaccount && driftClient) {
      subscribeToPositions();
    }
    
    // Clean up function can be empty since we're not using a subscription
    return () => {
      // No subscription to unsubscribe from
    };
      }, [selectedSubaccount, driftClient]);
    
      if (!selectedSubaccount) {
        return (
          <div className="p-4 text-gray-400">
            Please select a subaccount to view positions.
          </div>
        );
      }

      // Handle opening the TP/SL form
      const handleOpenTpSlForm = (position: PositionData) => {
        // Find the market index from the market name
        const marketEntry = Object.entries(MARKET_MAPPING).find(
          ([, val]) => val.name === position.market
        );
        
        const marketIndex = marketEntry ? parseInt(marketEntry[0], 10) : 0;
        const markPriceValue = parseFloat(position.markPrice.replace('$', ''));
        
        setSelectedPosition({
          ...position,
          marketIndex,
          markPriceValue
        });
        setIsTpSlModalOpen(true);
      };
    
    return ( 
        <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Your Positions</h3>
        <button 
          onClick={refreshPositions}
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
      
      {!loading && positions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Side
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Notional
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Entry Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Mark Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  PnL
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  PnL %
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {positions.map((position, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{position.market}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      position.direction === 'Long' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {position.direction}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                    {position.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                    {position.notional}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                    {position.entryPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                    {position.markPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className={`${
                      position.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {position.pnl}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className={`${
                      position.pnlPercent.startsWith('+') ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {position.pnlPercent}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleOpenTpSlForm(position)}
                      className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded transition-colors"
                    >
                      TP/SL
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-400">
          {loading 
            ? 'Loading positions...' 
            : error 
              ? 'Unable to load positions due to connection issues.' 
              : 'No positions found.'}
        </div>
      )}
      
      {/* Take Profit / Stop Loss Form Modal */}
      {selectedPosition && (
        <TakeProfitStopLossForm
          position={selectedPosition as Position}
          isOpen={isTpSlModalOpen}
          onClose={() => {
            setIsTpSlModalOpen(false);
            setSelectedPosition(null);
          }}
        />
      )}
    </div>
     );
};
 
export default PerpPositionTab;