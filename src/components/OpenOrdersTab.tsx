import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores/app/useAppStore';
import { OrderStatus, OrderType, DriftOrder } from '@drift-labs/sdk';


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
    const { selectedSubaccount } = useAppStore();
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedSubaccount) return;
        
        try {
          // Get all open orders
          const openOrders = selectedSubaccount.getOpenOrders();
          
          // Format the orders
          const formattedOrders = openOrders.map((order: DriftOrder) => {
            try {
              // Map order type to readable string
              let orderType = 'Unknown';
              switch(order.orderType) {
                case OrderType.LIMIT:
                  orderType = 'Limit';
                  break;
                case OrderType.MARKET:
                  orderType = 'Market';
                  break;
                case OrderType.TRIGGER_MARKET:
                  orderType = 'Trigger Market';
                  break;
                case OrderType.TRIGGER_LIMIT:
                  orderType = 'Trigger Limit';
                  break;
                case OrderType.ORACLE:
                  orderType = 'Oracle';
                  break;
              }
              
              // Get the side (buy/sell)
              const side = order.direction === 'long' ? 'Buy' : 'Sell';
              
              // Get the price - handle BN values
              const price = order.price 
                ? parseFloat(order.price.toString()) / 1e6 
                : 'Market';
              const priceFormatted = typeof price === 'number' 
                ? `$${price.toFixed(2)}` 
                : price;
              
              // Get the status
              let status = 'Unknown';
              switch(order.status) {
                case OrderStatus.OPEN:
                  status = 'Open';
                  break;
                case OrderStatus.FILLED:
                  status = 'Filled';
                  break;
                case OrderStatus.CANCELED:
                  status = 'Canceled';
                  break;
              }
              
              // Convert baseAssetAmount from BN to number
              const baseAssetAmountNum = parseFloat(order.baseAssetAmount.toString()) / 1e13;
              const size = Math.abs(baseAssetAmountNum).toFixed(4);
              
              return {
                market: order.marketIndex.toString(), // Ideally map to market name
                type: orderType,
                side: side,
                size: size,
                price: priceFormatted,
                status: status,
                timeInForce: order.reduceOnly ? 'Reduce Only' : 'Normal',
              };
            } catch (orderError) {
              console.error(`Error processing order:`, orderError);
              // Skip this order if there was an error
              return null;
            }
          }).filter(Boolean) as OrderData[]; // Filter out any nulls from errors
          
          setOrders(formattedOrders);
          setError(null);
        } catch (error) {
          console.error('Error fetching orders:', error);
          setError('Could not load orders. The Drift client may not be fully subscribed.');
        }
      }, [selectedSubaccount]);
    
      if (!selectedSubaccount) {
        return (
          <div className="p-4 text-gray-400">
            Please select a subaccount to view orders.
          </div>
        );
      }
  
    return ( 
        <div className="p-4">
      <h3 className="text-lg font-medium text-white mb-4">Your Open Orders</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md">
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-red-400 text-xs mt-1">
            Try refreshing the page or waiting a moment for the connection to establish.
          </p>
        </div>
      )}
      
      {orders.length > 0 ? (
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
          {error ? 'Unable to load orders due to connection issues.' : 'No open orders found.'}
        </div>
      )}
    </div>
     );
}
 
export default OpenOrdersTab;