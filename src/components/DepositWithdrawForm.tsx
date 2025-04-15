import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app/useAppStore';
import { QUOTE_SPOT_MARKET_INDEX } from '@drift-labs/sdk';
import { toast } from 'react-hot-toast';

// Token mapping for supported tokens in Drift protocol (same as in BalancesTab)
const TOKEN_METADATA: Record<number, { name: string; decimals: number; symbol: string }> = {
    0: { name: 'USDC', decimals: 6, symbol: 'USDC' },
    1: { name: 'SOL', decimals: 9, symbol: 'SOL' },
    2: { name: 'BTC', decimals: 8, symbol: 'BTC' },
    3: { name: 'ETH', decimals: 8, symbol: 'ETH' },
    // ... more tokens can be added as needed
};

type ActionType = 'deposit' | 'withdraw';

interface DepositWithdrawFormProps {
    action: ActionType;
    onClose: () => void;
}

const DepositWithdrawForm: React.FC<DepositWithdrawFormProps> = ({ action, onClose }) => {
    const { selectedSubaccount, driftClient } = useAppStore();
    const [amount, setAmount] = useState<string>('');
    const [token, setToken] = useState<number>(QUOTE_SPOT_MARKET_INDEX); // Default to USDC
    const [loading, setLoading] = useState<boolean>(false);
    const [maxAmount, setMaxAmount] = useState<string>('0');

    // Get the available balance of the selected token
    useEffect(() => {
        const fetchMaxAmount = async () => {
            if (!selectedSubaccount || !driftClient) return;

            try {
                if (action === 'withdraw') {
                    // For withdrawals, get the subaccount's token balance
                    const userAccount = selectedSubaccount.getUserAccount();
                    const position = userAccount.spotPositions?.find(
                        (pos) => pos.marketIndex === token
                    );

                    if (position) {
                        try {
                            const tokenAmount = selectedSubaccount.getTokenAmount(token);
                            const decimals = TOKEN_METADATA[token]?.decimals || 6;
                            const formattedAmount = parseFloat(tokenAmount.toString()) / Math.pow(10, decimals);
                            setMaxAmount(formattedAmount.toString());
                        } catch (e) {
                            console.error('Error getting token amount:', e);
                            setMaxAmount('0');
                        }
                    } else {
                        setMaxAmount('0');
                    }
                } else if (action === 'deposit') {
                    // For deposits, we would ideally check the wallet balance
                    // This is a simplified example - in a real app, you'd query the wallet's SOL/SPL token balance
                    setMaxAmount('Loading...');
                    
                    // Simulate fetching wallet balance
                    setTimeout(() => {
                        setMaxAmount('100'); // Placeholder value
                    }, 500);
                }
            } catch (error) {
                console.error('Error fetching max amount:', error);
                setMaxAmount('Error');
            }
        };

        fetchMaxAmount();
    }, [selectedSubaccount, driftClient, token, action]);

    const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setToken(Number(e.target.value));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and decimals
        const value = e.target.value;
        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
            setAmount(value);
        }
    };

    const handleSetMax = () => {
        if (maxAmount !== 'Loading...' && maxAmount !== 'Error') {
            setAmount(maxAmount);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedSubaccount || !driftClient) {
            toast.error('No subaccount or Drift client available');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setLoading(true);

        try {
            // We'll use the token metadata for displaying the symbol in the toast messages
            const tokenSymbol = TOKEN_METADATA[token]?.symbol || 'token';

            if (action === 'deposit') {
                // In a real implementation, you would:
                // 1. Create an SPL token transfer transaction for tokens other than SOL
                // 2. Or create a SOL transfer transaction for SOL
                // 3. Sign and send the transaction
                
                // Simulated deposit action
                console.log(`Depositing ${amount} of token ${TOKEN_METADATA[token]?.symbol} (index: ${token})`);
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                toast.success(`Successfully deposited ${amount} ${tokenSymbol}`);
            } else if (action === 'withdraw') {
                // In a real implementation, you would:
                // 1. Call the Drift SDK's withdraw function with the appropriate parameters
                // 2. Sign and send the transaction
                
                // Simulated withdraw action
                console.log(`Withdrawing ${amount} of token ${TOKEN_METADATA[token]?.symbol} (index: ${token})`);
                
                // Here's where you would call the actual SDK method, something like:
                // await selectedSubaccount.withdraw({
                //   marketIndex: token,
                //   amount: amountBN
                // });
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                toast.success(`Successfully withdrew ${amount} ${tokenSymbol}`);
            }
            
            // Close the form after successful action
            onClose();
        } catch (error) {
            console.error(`Error during ${action}:`, error);
            toast.error(`Failed to ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);

    return (
        <div className="p-6 bg-[#0F1120] rounded-lg border border-gray-800 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">{actionLabel}</h2>
                <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-white focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Token
                    </label>
                    <select
                        value={token}
                        onChange={handleTokenChange}
                        className="w-full bg-[#1E2131] border border-gray-700 rounded-md px-3 py-2 text-white"
                        disabled={loading}
                    >
                        {Object.entries(TOKEN_METADATA).map(([index, metadata]) => (
                            <option key={index} value={index}>
                                {metadata.name} ({metadata.symbol})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <div className="flex justify-between">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Amount
                        </label>
                        <span className="text-sm text-gray-400">
                            Max: {maxAmount}
                            <button
                                type="button"
                                onClick={handleSetMax}
                                className="ml-2 text-blue-500 hover:text-blue-400"
                                disabled={loading || maxAmount === 'Loading...' || maxAmount === 'Error'}
                            >
                                Set Max
                            </button>
                        </span>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            className="w-full bg-[#1E2131] border border-gray-700 rounded-md px-3 py-2 text-white"
                            disabled={loading}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">
                                {TOKEN_METADATA[token]?.symbol}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className={`w-full py-3 rounded-md transition-colors ${
                        loading 
                            ? 'bg-blue-800 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                    } text-white font-medium`}
                    disabled={loading}
                >
                    {loading ? `${actionLabel}ing...` : actionLabel}
                </button>
            </form>

            <div className="mt-4 text-sm text-gray-400">
                <p>Note: {action === 'deposit' 
                    ? 'Depositing funds will transfer them from your wallet to your Drift subaccount.' 
                    : 'Withdrawing funds will transfer them from your Drift subaccount to your wallet.'}
                </p>
            </div>
        </div>
    );
};

export default DepositWithdrawForm;
