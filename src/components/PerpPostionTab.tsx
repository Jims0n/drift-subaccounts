import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores/app/useAppStore';
import { BN } from '@drift-labs/sdk';

// Define direction type using SDK convention
enum PositionDirection {
  LONG = 'long',
  SHORT = 'short'
}

// Interfaces for position data
interface PositionData {
    market: string;
    direction: string;
    size: string;
    notional: string;
    entryPrice: string;
    markPrice: string;
    pnl: string;
    pnlPercent: string;
  }

// Define interface for BN with explicit methods we use
interface ExtendedBN extends BN {
  isZero(): boolean;
  toString(): string;
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

const PerpPositionTab = () => {
    const { selectedSubaccount, driftClient } = useAppStore();
    const [positions, setPositions] = useState<PositionData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

  // Helper function to check if a BN value is zero
  const isZeroBN = (value: unknown): boolean => {
    if (!value) return true;
    
    if (value instanceof BN && typeof (value as ExtendedBN).isZero === 'function') {
      return (value as ExtendedBN).isZero();
    }
    
    return value.toString() === '0';
  };

    const refreshPositions = async () => {
    if (!selectedSubaccount || !driftClient) {
      setError("Subaccount or Drift client not available");
      return;
    }
        
        setLoading(true);
    setError(null);
    
        try {
          // Ensure account subscription is active
          try {
            await driftClient.subscribe();
      } catch (_subscribeError) {
        // Most likely already subscribed, continue
          }
          
          // Force refresh user account data
          try {
            await selectedSubaccount.fetchAccounts();
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
      
      // Cast objects to work with dynamic properties
      const subaccountAny = selectedSubaccount as Record<string, unknown>;
      const driftClientAny = driftClient as Record<string, unknown>;
      const userAccount = selectedSubaccount.getUserAccount() as Record<string, unknown>;
      
      // Find perp positions using available methods
      let perpPositions: Record<string, unknown>[] = [];
      
      // Try different approaches to get perp positions
      if (typeof subaccountAny.getPerpPositions === 'function') {
        perpPositions = await (subaccountAny.getPerpPositions as () => Promise<Record<string, unknown>[]>)();
      } 
      else if (typeof subaccountAny.getActivePerpPositions === 'function') {
        perpPositions = await (subaccountAny.getActivePerpPositions as () => Promise<Record<string, unknown>[]>)();
      }
      else if (userAccount?.perpPositions) {
        perpPositions = (userAccount.perpPositions as Record<string, unknown>[]).filter((position: Record<string, unknown>) => 
          position && position.baseAssetAmount && !isZeroBN(position.baseAssetAmount)
        );
      }
      else {
        // Generic search in user account
        for (const key in userAccount) {
          if (Array.isArray(userAccount[key])) {
            const possiblePositions = (userAccount[key] as Record<string, unknown>[]).filter((item: Record<string, unknown>) => 
              item && 
              typeof item === 'object' &&
              'marketIndex' in item && 
              'baseAssetAmount' in item &&
              !isZeroBN(item.baseAssetAmount)
            );
            
            if (possiblePositions.length > 0) {
              perpPositions = possiblePositions;
              break;
            }
          } 
          // Check nested objects
          else if (typeof userAccount[key] === 'object' && userAccount[key] !== null) {
            const nestedObj = userAccount[key] as Record<string, unknown>;
            for (const subKey in nestedObj) {
              if (Array.isArray(nestedObj[subKey])) {
                const possiblePositions = (nestedObj[subKey] as Record<string, unknown>[]).filter((item: Record<string, unknown>) => 
                  item && 
                  typeof item === 'object' &&
                  'marketIndex' in item && 
                  'baseAssetAmount' in item &&
                  !isZeroBN(item.baseAssetAmount)
                );
                
                if (possiblePositions.length > 0) {
                  perpPositions = possiblePositions;
                  break;
                }
              }
            }
          }
        }
      }
      
      if (perpPositions.length === 0) {
        setPositions([]);
        setLoading(false);
        return;
      }
      
      // Process each position
          const formattedPositions = await Promise.all(
        perpPositions.map(async (position) => {
          try {
            const marketIndex = position.marketIndex as number;
            
            // Get market info
            const marketInfo = MARKET_MAPPING[marketIndex] || 
              { name: `PERP-${marketIndex}`, baseDecimals: 8, quoteDecimals: 6 };
            
            // Determine direction
            let direction = PositionDirection.LONG;
            const baseAssetAmountBN = position.baseAssetAmount as ExtendedBN;
            
            // Check if position is long or short
            const baseAssetAmountStr = baseAssetAmountBN.toString();
            direction = baseAssetAmountStr.startsWith('-') ? PositionDirection.SHORT : PositionDirection.LONG;
            
            // Calculate base amount with proper decimals
            const baseDecimals = marketInfo.baseDecimals;
            const quoteDecimals = marketInfo.quoteDecimals;
            
            const baseAssetAmount = Math.abs(
              parseFloat(baseAssetAmountStr) / Math.pow(10, baseDecimals)
            );
            
            // Get mark price (oracle price)
            let markPrice = 0;
                  let entryPrice = 0;
            
            // Try available methods to get oracle price
            if (typeof driftClientAny.getOraclePrice === 'function') {
              const oraclePrice = await (driftClientAny.getOraclePrice as (marketIndex: number) => Promise<unknown>)(marketIndex);
              if (oraclePrice) {
                markPrice = parseFloat(oraclePrice.toString()) / Math.pow(10, PRICE_PRECISION);
              }
            }
            else if (typeof driftClientAny.getOraclePriceForMarket === 'function') {
              const oraclePrice = await (driftClientAny.getOraclePriceForMarket as (marketIndex: number, isPerpMarket: boolean) => Promise<unknown>)(marketIndex, true);
              if (oraclePrice) {
                markPrice = parseFloat(oraclePrice.toString()) / Math.pow(10, PRICE_PRECISION);
              }
            }
            else if (typeof driftClientAny.getOracleDataForPerpMarket === 'function') {
              const oracleData = await (driftClientAny.getOracleDataForPerpMarket as (marketIndex: number) => Promise<{price?: unknown}>)(marketIndex);
              if (oracleData?.price) {
                markPrice = parseFloat(oracleData.price.toString()) / Math.pow(10, PRICE_PRECISION);
              }
            }
            
            // Calculate entry price from quoteEntryAmount
            if (position.quoteEntryAmount) {
              const quoteEntryAmount = position.quoteEntryAmount as ExtendedBN;
              
              if (quoteEntryAmount && baseAssetAmountBN && !isZeroBN(baseAssetAmountBN)) {
                const quoteEntryFloat = parseFloat(quoteEntryAmount.toString());
                const baseAssetAmountFloat = parseFloat(baseAssetAmountBN.toString());
                
                entryPrice = Math.abs(quoteEntryFloat / baseAssetAmountFloat);
                entryPrice = entryPrice * (Math.pow(10, baseDecimals) / Math.pow(10, quoteDecimals));
              }
            }
            
            // If entry price couldn't be calculated, try SDK method
            if (entryPrice === 0 && typeof subaccountAny.getPerpEntryPrice === 'function') {
              try {
                const sdkEntryPrice = await (subaccountAny.getPerpEntryPrice as (marketIndex: number) => Promise<unknown>)(marketIndex);
                if (sdkEntryPrice) {
                  entryPrice = parseFloat(sdkEntryPrice.toString());
                }
              } catch (_priceError) {
                // Continue with zero entry price
              }
            }
            
            // Calculate PnL
            let unrealizedPnl = 0;
            let pnlPercent = 0;
            
            if (markPrice > 0 && entryPrice > 0 && baseAssetAmount > 0) {
                        if (direction === PositionDirection.LONG) {
                          unrealizedPnl = baseAssetAmount * (markPrice - entryPrice);
                pnlPercent = ((markPrice / entryPrice) - 1) * 100;
                        } else {
                          unrealizedPnl = baseAssetAmount * (entryPrice - markPrice);
                            pnlPercent = ((entryPrice / markPrice) - 1) * 100;
                          }
                        }
                  
                  // Calculate notional value
                  const notional = baseAssetAmount * markPrice;
                  
            // Return formatted position data
                  return {
              market: marketInfo.name,
                    direction: direction === PositionDirection.LONG ? 'Long' : 'Short',
                    size: baseAssetAmount.toFixed(4),
                    notional: `$${notional.toFixed(2)}`,
                    entryPrice: `$${entryPrice.toFixed(2)}`,
                    markPrice: `$${markPrice.toFixed(2)}`,
                    pnl: `${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toFixed(2)}`,
                    pnlPercent: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`,
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
      console.error('Error loading positions:', error);
          setError('Could not load positions. The Drift client may not be fully subscribed.');
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        refreshPositions();
      }, [selectedSubaccount, driftClient]);
    
      if (!selectedSubaccount) {
        return (
          <div className="p-4 text-gray-400">
            Please select a subaccount to view positions.
          </div>
        );
      }
    
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
    </div>
     );
};
 
export default PerpPositionTab;