import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app/useAppStore';
import { BN, OrderType } from '@drift-labs/sdk';
import { toast } from 'react-hot-toast';

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
  // Add more markets as needed
};

// Constants for price scaling
const PRICE_PRECISION = 6; // Standard price precision in Drift protocol

// Order type options
const ORDER_TYPES = [
  { value: 'MARKET', label: 'Market' },
  { value: 'LIMIT', label: 'Limit' },
];

// Leverage options
const LEVERAGE_OPTIONS = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
  { value: '5', label: '5x' },
  { value: '10', label: '10x' },
];

// Define MarketType enum since it's not exported by the SDK type definitions
enum MarketType {
  SPOT = 0,
  PERP = 1
}

const PerpOrderForm = () => {
  const { selectedSubaccount, driftClient } = useAppStore();
  
  // Form state
  const [marketIndex, setMarketIndex] = useState<number>(0); // Default to SOL-PERP
  const [isBuy, setIsBuy] = useState<boolean>(true);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [size, setSize] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [leverage, setLeverage] = useState<string>('1');
  const [reduceOnly, setReduceOnly] = useState<boolean>(false);
  const [postOnly, setPostOnly] = useState<boolean>(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [markPrice, setMarkPrice] = useState<number | null>(null);
  const [estimatedLiquidationPrice, setEstimatedLiquidationPrice] = useState<string>('-');
  
  // Fetch market price when market changes
  useEffect(() => {
    const fetchMarkPrice = async () => {
      if (!driftClient) return;
      
      try {
        // Cast driftClient to access different potential method names
        const driftClientAny = driftClient as unknown as Record<string, unknown>;
        
        // Try different methods to get oracle price
        if (typeof driftClientAny.getOraclePrice === 'function') {
          const oraclePrice = await (driftClientAny.getOraclePrice as (marketIndex: number) => Promise<unknown>)(marketIndex);
          if (oraclePrice) {
            const priceBN = oraclePrice as BN;
            setMarkPrice(parseFloat(priceBN.toString()) / Math.pow(10, PRICE_PRECISION));
            
            // Pre-fill limit price with mark price
            if (orderType === 'LIMIT' && price === '') {
              setPrice((parseFloat(priceBN.toString()) / Math.pow(10, PRICE_PRECISION)).toFixed(2));
            }
          }
        }
        else if (typeof driftClientAny.getOraclePriceForMarket === 'function') {
          const oraclePrice = await (driftClientAny.getOraclePriceForMarket as (marketIndex: number, isPerpMarket: boolean) => Promise<unknown>)(marketIndex, true);
          if (oraclePrice) {
            const priceBN = oraclePrice as BN;
            setMarkPrice(parseFloat(priceBN.toString()) / Math.pow(10, PRICE_PRECISION));
            
            // Pre-fill limit price with mark price
            if (orderType === 'LIMIT' && price === '') {
              setPrice((parseFloat(priceBN.toString()) / Math.pow(10, PRICE_PRECISION)).toFixed(2));
            }
          }
        }
        else if (typeof driftClientAny.getOracleDataForPerpMarket === 'function') {
          const oracleData = await (driftClientAny.getOracleDataForPerpMarket as (marketIndex: number) => Promise<{price?: unknown}>)(marketIndex);
          if (oracleData?.price) {
            const priceBN = oracleData.price as BN;
            setMarkPrice(parseFloat(priceBN.toString()) / Math.pow(10, PRICE_PRECISION));
            
            // Pre-fill limit price with mark price
            if (orderType === 'LIMIT' && price === '') {
              setPrice((parseFloat(priceBN.toString()) / Math.pow(10, PRICE_PRECISION)).toFixed(2));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching market price:', err);
      }
    };
    
    fetchMarkPrice();
  }, [driftClient, marketIndex, orderType, price]);
  
  // Calculate estimated liquidation price
  useEffect(() => {
    if (!markPrice || !size || parseFloat(size) <= 0) {
      setEstimatedLiquidationPrice('-');
      return;
    }
    
    try {
      // Simple liquidation estimate based on leverage
      // This is a simplified calculation - actual liquidation would involve 
      // more complex calculations including funding rates, collateral, etc.
      const leverageNum = parseFloat(leverage);
      const direction = isBuy ? 1 : -1;
      const liquidationDistance = (markPrice * direction) / leverageNum;
      
      const estLiqPrice = isBuy 
        ? markPrice - liquidationDistance 
        : markPrice + liquidationDistance;
      
      setEstimatedLiquidationPrice(`$${Math.max(0, estLiqPrice).toFixed(2)}`);
    } catch {
      setEstimatedLiquidationPrice('-');
    }
  }, [markPrice, size, leverage, isBuy]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubaccount || !driftClient) {
      toast.error('No subaccount or Drift client available');
      return;
    }
    
    if (!size || parseFloat(size) <= 0) {
      toast.error('Please enter a valid size');
      return;
    }
    
    if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
      toast.error('Please enter a valid price for limit order');
      return;
    }
    
    // Get market info for proper decimal handling
    const marketInfo = MARKET_MAPPING[marketIndex] || { 
      name: `Market ${marketIndex}`,
      baseDecimals: 8,
      quoteDecimals: 6
    };
    
    setIsSubmitting(true);
    
    try {
      // Convert inputs to correct formats
      const sizeFloat = parseFloat(size);
      const baseAssetAmount = new BN(Math.floor(sizeFloat * Math.pow(10, marketInfo.baseDecimals)));
      
      let orderPrice: BN;
      if (orderType === 'LIMIT') {
        const priceFloat = parseFloat(price);
        orderPrice = new BN(Math.floor(priceFloat * Math.pow(10, PRICE_PRECISION)));
      } else {
        // For market orders, we still need a price but it's not strictly used
        // Use a very high/low price to ensure the order is filled
        orderPrice = new BN(isBuy 
          ? Math.floor(99999 * Math.pow(10, PRICE_PRECISION))  // High price for buys
          : Math.floor(0.00001 * Math.pow(10, PRICE_PRECISION)) // Low price for sells
        );
      }
      
      // Cast to access placeOrder method dynamically
      const subaccountAny = selectedSubaccount as unknown as Record<string, unknown>;
      
      // Check if the method exists
      if (typeof subaccountAny.placeOrder === 'function' || 
          typeof subaccountAny.placePerpOrder === 'function') {
        
        const placeOrderFn = (subaccountAny.placeOrder || subaccountAny.placePerpOrder) as (
          params: {
            marketIndex: number; 
            orderType: number;
            marketType?: number; 
            direction: string; 
            baseAssetAmount: BN; 
            price: BN;
            reduceOnly?: boolean;
            postOnly?: boolean;
          }
        ) => Promise<unknown>;
        
        // Map string orderType to enum number
        const orderTypeEnum = orderType === 'MARKET' ? OrderType.MARKET : OrderType.LIMIT;
        
        console.log(`Placing ${orderType} ${isBuy ? 'buy' : 'sell'} order for ${size} ${marketInfo.name} at price ${orderType === 'LIMIT' ? price : 'market'}`);
        
        // Place the order
        const orderResult = await placeOrderFn({
          marketIndex,
          orderType: orderTypeEnum,
          marketType: MarketType.PERP, // 1 = PERP market
          direction: isBuy ? 'long' : 'short',
          baseAssetAmount,
          price: orderPrice,
          reduceOnly,
          postOnly
        });
        
        console.log('Order placed successfully:', orderResult);
        toast.success(`Successfully placed ${orderType.toLowerCase()} ${isBuy ? 'buy' : 'sell'} order for ${size} ${marketInfo.name}`);
        
        // Reset form after successful submission
        setSize('');
        if (orderType === 'LIMIT') {
          setPrice('');
        }
        
      } else {
        // Simulate order placement if method not available
        console.log(`Simulating ${orderType} ${isBuy ? 'buy' : 'sell'} order for ${size} ${marketInfo.name} at price ${orderType === 'LIMIT' ? price : 'market'}`);
        
        // Wait to simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success(`Simulated ${orderType.toLowerCase()} ${isBuy ? 'buy' : 'sell'} order for ${size} ${marketInfo.name}`);
        
        // Reset form after successful submission
        setSize('');
        if (orderType === 'LIMIT') {
          setPrice('');
        }
      }
    } catch (err) {
      console.error('Error placing order:', err);
      toast.error(`Failed to place order: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Toggle between order types
  const handleOrderTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderType(e.target.value as 'MARKET' | 'LIMIT');
    
    // Clear price for market orders
    if (e.target.value === 'MARKET') {
      setPrice('');
      // Also clear postOnly since it only applies to limit orders
      setPostOnly(false);
    } else if (markPrice) {
      // Pre-fill limit price with mark price
      setPrice(markPrice.toFixed(2));
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Market
        </label>
        <select
          value={marketIndex}
          onChange={(e) => setMarketIndex(Number(e.target.value))}
          className="w-full bg-[#1E2131] border border-gray-700 rounded-md px-3 py-2 text-white"
          disabled={isSubmitting}
        >
          {Object.entries(MARKET_MAPPING).map(([index, info]) => (
            <option key={index} value={index}>
              {info.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Side
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 ${
              isBuy 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-[#1E2131] hover:bg-[#2A2E45]'
            } text-white px-3 py-2 rounded-md transition-colors`}
            onClick={() => setIsBuy(true)}
            disabled={isSubmitting}
          >
            Buy
          </button>
          <button
            type="button"
            className={`flex-1 ${
              !isBuy 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-[#1E2131] hover:bg-[#2A2E45]'
            } text-white px-3 py-2 rounded-md transition-colors`}
            onClick={() => setIsBuy(false)}
            disabled={isSubmitting}
          >
            Sell
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Type
        </label>
        <select
          value={orderType}
          onChange={handleOrderTypeChange}
          className="w-full bg-[#1E2131] border border-gray-700 rounded-md px-3 py-2 text-white"
          disabled={isSubmitting}
        >
          {ORDER_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <div className="flex justify-between">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Size
          </label>
          {markPrice && (
            <span className="text-xs text-gray-400">
              Market Price: ${markPrice.toFixed(2)}
            </span>
          )}
        </div>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="w-full bg-[#1E2131] border border-gray-700 rounded-md px-3 py-2 text-white"
          disabled={isSubmitting}
          required
        />
      </div>
      
      {orderType === 'LIMIT' && (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Price
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full bg-[#1E2131] border border-gray-700 rounded-md px-3 py-2 text-white"
            disabled={isSubmitting}
            required={orderType === 'LIMIT'}
          />
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Leverage
        </label>
        <select
          value={leverage}
          onChange={(e) => setLeverage(e.target.value)}
          className="w-full bg-[#1E2131] border border-gray-700 rounded-md px-3 py-2 text-white"
          disabled={isSubmitting}
        >
          {LEVERAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Est. Liquidation Price
        </label>
        <div className="w-full bg-[#1E2131] border border-gray-700 rounded-md px-3 py-2 text-white">
          {estimatedLiquidationPrice}
        </div>
      </div>
      
      <div className="flex gap-4">
        <label className="flex items-center text-sm text-gray-400">
          <input
            type="checkbox"
            checked={reduceOnly}
            onChange={(e) => setReduceOnly(e.target.checked)}
            className="mr-2 h-4 w-4 text-blue-600 bg-[#1E2131] border-gray-700 rounded"
            disabled={isSubmitting}
          />
          Reduce Only
        </label>
        
        {orderType === 'LIMIT' && (
          <label className="flex items-center text-sm text-gray-400">
            <input
              type="checkbox"
              checked={postOnly}
              onChange={(e) => setPostOnly(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 bg-[#1E2131] border-gray-700 rounded"
              disabled={isSubmitting}
            />
            Post Only
          </label>
        )}
      </div>
      
      <button
        type="submit"
        className={`w-full py-3 rounded-md transition-colors ${
          isSubmitting
            ? 'bg-blue-800 cursor-not-allowed'
            : isBuy
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
        } text-white font-medium`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Placing Order...' : `Place ${isBuy ? 'Buy' : 'Sell'} Order`}
      </button>
    </form>
  );
};

export default PerpOrderForm;
