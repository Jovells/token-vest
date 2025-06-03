import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { contracts } from '../config/wagmi';

const Faucet = () => {
  const [amount, setAmount] = useState('100');
  const [error, setError] = useState('');

  const { writeContractAsync: mintDemo, data: mintData } = useWriteContract();
  const { isLoading: isMinting } = useWaitForTransactionReceipt({ hash: mintData });

  const handleMint = async () => {
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    setError('');
    try {
      await mintDemo({
        address: contracts.vestedToken.address,
        abi: contracts.vestedToken.abi,
        functionName: 'mintDemo',
        args: [parseEther(amount)],
      });
    } catch (err) {
      console.error('Mint error:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint tokens');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Demo Token Faucet</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Mint
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="100"
          />
        </div>

        <button
          onClick={handleMint}
          disabled={isMinting || !amount}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMinting ? 'Minting...' : 'Mint Demo Tokens'}
        </button>
      </div>
    </div>
  );
};

export default Faucet; 