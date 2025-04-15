import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app/useAppStore';
import { BN, OrderType } from '@drift-labs/sdk';
import { toast } from 'react-hot-toast';
import { Modal } from './modals/Modal';

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

// Define constants for trigger conditions since they might not be exported by the SDK
enum TriggerCondition {
  ABOVE = 0,
  BELOW = 1,
  TRIGGERED_ABOVE = 2,
  TRIGGERED_BELOW = 3
}

// Define an interface for order parameters
interface OrderParams {
  marketIndex: number;
  direction: string;
  baseAssetAmount: BN;
  price: BN;
  orderType: number;
  reduceOnly: boolean;
  triggerPrice: BN;
  triggerCondition: number;
}

interface Position {
  marketIndex: number;
  market: string;
  direction: 'Long' | 'Short';
  size: string;
  entryPrice: string;
  markPrice: string;
  markPriceValue: number;
}

interface TakeProfitStopLossFormProps {
  position?: Position;
  onClose: () => void;
  isOpen: boolean;
}

const TakeProfitStopLossForm: React.FC<TakeProfitStopLossFormProps> = ({
  position,
  onClose,
  isOpen
}) => {
  const { selectedSubaccount, driftClient } = useAppStore();
  
  // Form states
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [takeProfitSize, setTakeProfitSize] = useState<string>('100');
  const [stopLossSize, setStopLossSize] = useState<string>('100');
  const [isSettingTakeProfit, setIsSettingTakeProfit] = useState<boolean>(true);
  const [isSettingStopLoss, setIsSettingStopLoss] = useState<boolean>(true);
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [marketInfo, setMarketInfo] = useState<{ baseDecimals: number; quoteDecimals: number } | null>(null);
  
  // Log when the component receives a position
  useEffect(() => {
    console.log('TakeProfitStopLossForm received position:', position);
  }, [position]);
  
  // Set defaults when position changes
  useEffect(() => {
    if (!position) {
      console.warn('No position data provided to TakeProfitStopLossForm');
      return;
    }
    
    // Validate required fields
    if (position.marketIndex === undefined || position.marketIndex === null) {
      console.error('Position missing market index:', position);
    }
    
    if (!position.market) {
      console.error('Position missing market name:', position);
    }
    
    if (!position.direction) {
      console.error('Position missing direction:', position);
    }
    
    // Extract the mark price value (remove $ and convert to number)
    const markPriceNumber = position.markPriceValue;
    
    // Set default take profit and stop loss based on position direction and mark price
    if (position.direction === 'Long') {
      // For long positions: take profit > mark price, stop loss < mark price
      setTakeProfitPrice((markPriceNumber * 1.05).toFixed(2)); // 5% higher
      setStopLossPrice((markPriceNumber * 0.95).toFixed(2));   // 5% lower
    } else {
      // For short positions: take profit < mark price, stop loss > mark price
      setTakeProfitPrice((markPriceNumber * 0.95).toFixed(2)); // 5% lower
      setStopLossPrice((markPriceNumber * 1.05).toFixed(2));   // 5% higher
    }
    
    // Default to 100% size
    setTakeProfitSize('100');
    setStopLossSize('100');
    
    // Get market info
    if (position.marketIndex in MARKET_MAPPING) {
      setMarketInfo(MARKET_MAPPING[position.marketIndex]);
    } else {
      setMarketInfo({ baseDecimals: 8, quoteDecimals: 6 });
    }
    
  }, [position]);
  
  // Calculate size in base asset amount based on percentage of position
  const calculateBaseAssetAmount = (sizePercentage: string): BN | null => {
    if (!position || !marketInfo) return null;
    
    try {
      // Parse position size (remove commas if any)
      const positionSizeStr = position.size.replace(/,/g, '');
      const positionSize = parseFloat(positionSizeStr);
      
      // Calculate size based on percentage
      const percentage = parseFloat(sizePercentage) / 100;
      const targetSize = positionSize * percentage;
      
      // Convert to base asset amount with proper decimals
      return new BN(Math.floor(targetSize * Math.pow(10, marketInfo.baseDecimals)));
    } catch (error) {
      console.error('Error calculating base asset amount:', error);
      return null;
    }
  };
  
  // Helper to validate price based on position direction
  const validatePrices = (): boolean => {
    if (!position || !takeProfitPrice || !stopLossPrice) return false;
    
    const tp = parseFloat(takeProfitPrice);
    const sl = parseFloat(stopLossPrice);
    const current = position.markPriceValue;
    
    if (isNaN(tp) || isNaN(sl) || tp <= 0 || sl <= 0) return false;
    
    if (position.direction === 'Long') {
      // For longs: TP should be higher than current, SL should be lower
      return (!isSettingTakeProfit || tp > current) && 
             (!isSettingStopLoss || sl < current) && 
             (tp > sl);
    } else {
      // For shorts: TP should be lower than current, SL should be higher
      return (!isSettingTakeProfit || tp < current) && 
             (!isSettingStopLoss || sl > current) && 
             (tp < sl);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubaccount || !driftClient) {
      toast.error('Missing required data. Please try again.');
      return;
    }
    
    if (isSettingTakeProfit && (!takeProfitPrice || parseFloat(takeProfitPrice) <= 0)) {
      toast.error('Please enter a valid take profit price');
      return;
    }
    
    if (isSettingStopLoss && (!stopLossPrice || parseFloat(stopLossPrice) <= 0)) {
      toast.error('Please enter a valid stop loss price');
      return;
    }
    
    if (!validatePrices()) {
      toast.error(
        position?.direction === 'Long'
          ? 'Take profit price must be higher than current price and stop loss must be lower than current price'
          : 'Take profit price must be lower than current price and stop loss must be higher than current price'
      );
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the market index from the position
      const marketIndex = position?.marketIndex;
      console.log('Position data:', position);
      console.log('Market index:', marketIndex);
      
      // Specifically check if market index is undefined or null, allow valid index 0
      if (marketIndex === undefined || marketIndex === null) {
        toast.error('Invalid market index');
        return;
      }
      
      // Check if the User object has a method for placing orders
      const subaccountAny = selectedSubaccount as unknown as Record<string, unknown>;
      const hasPerpOrder = typeof subaccountAny.placePerpOrder === 'function';
      const hasPlaceOrder = typeof subaccountAny.placeOrder === 'function';
      
      // Check if we can place orders
      if (!hasPerpOrder && !hasPlaceOrder) {
        toast.error('Order placement is not supported by the current SDK version');
        return;
      }
      
      // Get the order placement function
      const placeOrderFn = (hasPlaceOrder 
        ? subaccountAny.placeOrder 
        : subaccountAny.placePerpOrder) as (params: OrderParams) => Promise<unknown>;
      
      // For take profit
      if (isSettingTakeProfit) {
        // Calculate base asset amount
        const tpBaseAssetAmount = calculateBaseAssetAmount(takeProfitSize);
        if (!tpBaseAssetAmount) {
          toast.error('Could not calculate take profit size');
          return;
        }
        
        // Calculate price in BN format
        const tpPrice = new BN(Math.floor(parseFloat(takeProfitPrice) * Math.pow(10, PRICE_PRECISION)));
        
        // Determine trigger condition based on position direction
        // For long positions, take profit triggers when price goes ABOVE the trigger price
        // For short positions, take profit triggers when price goes BELOW the trigger price
        const tpTriggerCondition = position?.direction === 'Long' 
          ? TriggerCondition.ABOVE 
          : TriggerCondition.BELOW;
        
        // Direction is opposite of the position direction for closing
        const tpDirection = position?.direction === 'Long' ? 'short' : 'long';
        
        console.log(`Placing take profit trigger order for ${position?.market} at ${takeProfitPrice}`);
        
        try {
          // Create order parameters
          const orderParams: OrderParams = {
            marketIndex: marketIndex,
            direction: tpDirection,
            baseAssetAmount: tpBaseAssetAmount,
            price: tpPrice,
            orderType: OrderType.TRIGGER_MARKET,
            reduceOnly: true, // Ensure it only reduces the position
            triggerPrice: tpPrice,
            triggerCondition: tpTriggerCondition,
          };
          
          // Place the order
          await placeOrderFn(orderParams);
          
          toast.success(`Take profit order placed at ${takeProfitPrice}`);
        } catch (error) {
          console.error('Error placing take profit order:', error);
          toast.error(`Take profit order failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // For stop loss
      if (isSettingStopLoss) {
        // Calculate base asset amount
        const slBaseAssetAmount = calculateBaseAssetAmount(stopLossSize);
        if (!slBaseAssetAmount) {
          toast.error('Could not calculate stop loss size');
          return;
        }
        
        // Calculate price in BN format
        const slPrice = new BN(Math.floor(parseFloat(stopLossPrice) * Math.pow(10, PRICE_PRECISION)));
        
        // Determine trigger condition based on position direction
        // For long positions, stop loss triggers when price goes BELOW the trigger price
        // For short positions, stop loss triggers when price goes ABOVE the trigger price
        const slTriggerCondition = position?.direction === 'Long' 
          ? TriggerCondition.BELOW 
          : TriggerCondition.ABOVE;
        
        // Direction is opposite of the position direction for closing
        const slDirection = position?.direction === 'Long' ? 'short' : 'long';
        
        console.log(`Placing stop loss trigger order for ${position?.market} at ${stopLossPrice}`);
        
        try {
          // Create order parameters
          const orderParams: OrderParams = {
            marketIndex: marketIndex,
            direction: slDirection,
            baseAssetAmount: slBaseAssetAmount,
            price: slPrice,
            orderType: OrderType.TRIGGER_MARKET,
            reduceOnly: true, // Ensure it only reduces the position
            triggerPrice: slPrice,
            triggerCondition: slTriggerCondition,
          };
          
          // Place the order
          await placeOrderFn(orderParams);
          
          toast.success(`Stop loss order placed at ${stopLossPrice}`);
        } catch (error) {
          console.error('Error placing stop loss order:', error);
          toast.error(`Stop loss order failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Close the form
      onClose();
    } catch (err) {
      console.error('Error setting take profit/stop loss:', err);
      toast.error(`Failed to set orders: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle value changes and validate in real-time
  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const value = e.target.value;
    // Allow only numbers and decimals
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setter(value);
    }
  };
  
  // Calculate potential profit/loss based on entry price and take profit/stop loss
  const calculatePnL = (price: string, isProfit: boolean): string => {
    if (!position || !price || parseFloat(price) <= 0) return '-';
    
    try {
      const entryPrice = parseFloat(position.entryPrice.replace(/[^0-9.-]+/g, ''));
      const targetPrice = parseFloat(price);
      const positionSize = parseFloat(position.size.replace(/,/g, ''));
      
      if (isNaN(entryPrice) || isNaN(targetPrice) || isNaN(positionSize)) return '-';
      
      let pnl: number;
      if (position.direction === 'Long') {
        pnl = isProfit 
          ? (targetPrice - entryPrice) * positionSize
          : (entryPrice - targetPrice) * positionSize;
      } else {
        pnl = isProfit
          ? (entryPrice - targetPrice) * positionSize
          : (targetPrice - entryPrice) * positionSize;
      }
      
      return `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
    } catch {
      return '-';
    }
  };
  
  if (!isOpen || !position) return null;
  
  return (
    <Modal onClose={onClose} header={`Set TP/SL for ${position.market} ${position.direction}`}>
      <div className="p-6 bg-[#0F1120] rounded-lg max-w-md w-full">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Position:</span>
            <span className="text-white">{position.size} {position.market} {position.direction}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Entry Price:</span>
            <span className="text-white">{position.entryPrice}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-400">Current Price:</span>
            <span className="text-white">{position.markPrice}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Take Profit Section */}
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-green-500 font-medium">Take Profit</h3>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isSettingTakeProfit}
                  onChange={(e) => setIsSettingTakeProfit(e.target.checked)}
                  className="mr-2 h-4 w-4 text-green-600 bg-[#1E2131] border-gray-700 rounded"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-400">Set TP</span>
              </label>
            </div>
            
            {isSettingTakeProfit && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    TP Price
                  </label>
                  <input
                    type="text"
                    value={takeProfitPrice}
                    onChange={(e) => handlePriceChange(e, setTakeProfitPrice)}
                    placeholder="0.00"
                    className="w-full bg-[#1E2131] border border-gray-700 rounded-md px-3 py-2 text-white"
                    disabled={isSubmitting || !isSettingTakeProfit}
                  />
                  <div className="mt-1 flex justify-between">
                    <span className="text-xs text-gray-400">Est. Profit:</span>
                    <span className="text-xs text-green-500">{calculatePnL(takeProfitPrice, true)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Size (% of position)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={takeProfitSize}
                      onChange={(e) => setTakeProfitSize(e.target.value)}
                      className="flex-1"
                      disabled={isSubmitting || !isSettingTakeProfit}
                    />
                    <input
                      type="number"
                      value={takeProfitSize}
                      onChange={(e) => setTakeProfitSize(e.target.value)}
                      className="w-16 bg-[#1E2131] border border-gray-700 rounded-md px-2 py-1 text-white text-right"
                      min="1"
                      max="100"
                      disabled={isSubmitting || !isSettingTakeProfit}
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Stop Loss Section */}
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-red-500 font-medium">Stop Loss</h3>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isSettingStopLoss}
                  onChange={(e) => setIsSettingStopLoss(e.target.checked)}
                  className="mr-2 h-4 w-4 text-red-600 bg-[#1E2131] border-gray-700 rounded"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-400">Set SL</span>
              </label>
            </div>
            
            {isSettingStopLoss && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    SL Price
                  </label>
                  <input
                    type="text"
                    value={stopLossPrice}
                    onChange={(e) => handlePriceChange(e, setStopLossPrice)}
                    placeholder="0.00"
                    className="w-full bg-[#1E2131] border border-gray-700 rounded-md px-3 py-2 text-white"
                    disabled={isSubmitting || !isSettingStopLoss}
                  />
                  <div className="mt-1 flex justify-between">
                    <span className="text-xs text-gray-400">Est. Loss:</span>
                    <span className="text-xs text-red-500">{calculatePnL(stopLossPrice, false)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Size (% of position)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={stopLossSize}
                      onChange={(e) => setStopLossSize(e.target.value)}
                      className="flex-1"
                      disabled={isSubmitting || !isSettingStopLoss}
                    />
                    <input
                      type="number"
                      value={stopLossSize}
                      onChange={(e) => setStopLossSize(e.target.value)}
                      className="w-16 bg-[#1E2131] border border-gray-700 rounded-md px-2 py-1 text-white text-right"
                      min="1"
                      max="100"
                      disabled={isSubmitting || !isSettingStopLoss}
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 rounded-md transition-colors ${
                isSubmitting
                  ? 'bg-blue-800 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-medium`}
              disabled={isSubmitting || (!isSettingTakeProfit && !isSettingStopLoss)}
            >
              {isSubmitting ? 'Setting Orders...' : 'Set Orders'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TakeProfitStopLossForm;
