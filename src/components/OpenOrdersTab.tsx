import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../stores/app/useAppStore';
import { OrderStatus, OrderType, DriftOrder } from '@drift-labs/sdk';

// Market mapping for display - matches perp markets mapping from PerpPositionTab
const MARKET_MAPPING: Record<number, string> = {
  0: 'SOL-PERP',
  1: 'BTC-PERP',
  2: 'ETH-PERP',
  3: 'mSOL-PERP',
  4: 'BNB-PERP',
  5: 'AVAX-PERP',
  6: 'ARB-PERP',
  7: 'DOGE-PERP',
  8: 'MATIC-PERP',
  9: 'SUI-PERP',
  10: 'XRP-PERP',
  11: 'ADA-PERP',
  12: 'APT-PERP',
  13: 'LTC-PERP',
  14: 'BCH-PERP',
  15: 'OP-PERP',
  16: 'LINK-PERP',
  17: 'NEAR-PERP',
  18: 'JTO-PERP',
  19: 'TIA-PERP',
  20: 'JUP-PERP',
  21: 'WIF-PERP',
  22: 'SEI-PERP',
  23: 'DYM-PERP',
  24: 'STRK-PERP',
  25: 'BONK-PERP',
  26: 'PYTH-PERP',
  27: 'RNDR-PERP',
};

// Constants for price scaling
const PRICE_PRECISION = 6; // Standard price precision in Drift protocol

interface OrderData {
  market: string;
  type: string;
  side: string;
  size: string;
  price: string;
  status: string;
  timeInForce: string;
}

const OpenOrdersTab = () => {
  const { selectedSubaccount, driftClient } = useAppStore();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Map order type enum to readable string
  const getOrderTypeString = (orderType: OrderType): string => {
    switch(orderType) {
      case OrderType.LIMIT: return 'Limit';
      case OrderType.MARKET: return 'Market';
      case OrderType.TRIGGER_MARKET: return 'Trigger Market';
      case OrderType.TRIGGER_LIMIT: return 'Trigger Limit';
      case OrderType.ORACLE: return 'Oracle';
      default: return 'Unknown';
    }
  };

  // Map order status enum to readable string
  const getOrderStatusString = (status: OrderStatus): string => {
    switch(status) {
      case OrderStatus.OPEN: return 'Open';
      case OrderStatus.FILLED: return 'Filled';
      case OrderStatus.CANCELED: return 'Canceled';
      default: return 'Unknown';
    }
  };

  const refreshOrders = useCallback(async () => {
    if (!selectedSubaccount) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to refresh account data first
      try {
        await selectedSubaccount.fetchAccounts();
      } catch {
        // Continue with existing data
      }
      
      // Get all open orders
      const openOrders = selectedSubaccount.getOpenOrders();
      
      // Format the orders
      const formattedOrders = openOrders.map((order: DriftOrder) => {
        try {
          // Get market name from mapping
          const marketName = MARKET_MAPPING[order.marketIndex] || `Market ${order.marketIndex}`;
          
          // Get order type
          const orderType = getOrderTypeString(order.orderType);
          
          // Get the side (buy/sell)
          const side = order.direction === 'long' ? 'Buy' : 'Sell';
          
          // Get the price - handle BN values
          let priceFormatted = 'Market';
          if (order.price) {
            const priceValue = parseFloat(order.price.toString()) / Math.pow(10, PRICE_PRECISION);
            priceFormatted = `$${priceValue.toFixed(2)}`;
          }
          
          // Get the status
          const status = getOrderStatusString(order.status);
          
          // Get base amount based on market index
          // Use more accurate size calculation with proper decimal scaling
          const marketIndex = order.marketIndex;
          const baseDecimals = marketIndex === 0 ? 9 : 8; // SOL has 9 decimals, most others 8
          const baseAssetAmount = parseFloat(order.baseAssetAmount.toString()) / Math.pow(10, baseDecimals);
          const size = Math.abs(baseAssetAmount).toFixed(4);
          
          return {
            market: marketName,
            type: orderType,
            side: side,
            size: size,
            price: priceFormatted,
            status: status,
            timeInForce: order.reduceOnly ? 'Reduce Only' : 'Normal',
          };
        } catch {
          // Skip this order if there was an error
          return null;
        }
      }).filter(Boolean) as OrderData[]; // Filter out any nulls from errors
      
      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Could not load orders. The Drift client may not be fully subscribed.');
    } finally {
      setLoading(false);
    }
  }, [selectedSubaccount]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  if (!selectedSubaccount) {
    return (
      <div className="p-4 text-gray-400">
        Please select a subaccount to view orders.
      </div>
    );
  }

  return ( 
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Your Open Orders</h3>
        <button 
          onClick={refreshOrders}
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
      
      {!loading && orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Side
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  TIF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {orders.map((order, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{order.market}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{order.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      order.side === 'Buy' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {order.side}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                    {order.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                    {order.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                    {order.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                    {order.timeInForce}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-400">
          {loading 
            ? 'Loading orders...' 
            : error 
              ? 'Unable to load orders due to connection issues.' 
              : 'No open orders found.'}
        </div>
      )}
    </div>
  );
};
 
export default OpenOrdersTab;