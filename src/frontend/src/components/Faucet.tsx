import { useState } from 'react';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { contracts } from '../config/wagmi';

export default function Faucet() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState('');

  const { address } = useAccount();

  const { writeContractAsync: requestTokens, data: requestData } = useWriteContract();

  const { isLoading } = useWaitForTransactionReceipt({
    hash: requestData,
  });

  const handleRequestTokens = async () => {
    if (!address) return;

    setIsRequesting(true);
    setError('');

    try {
      await requestTokens({
        address: contracts.tokenFaucet.address,
        abi: contracts.tokenFaucet.abi,
        functionName: 'requestTokens',
        args: [],
      });
    } catch (err) {
      console.error('Error requesting tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to request tokens');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-sm text-gray-500 mb-2">Get Test Tokens</div>
      <button
        onClick={handleRequestTokens}
        disabled={isRequesting || isLoading}
        className="btn btn-primary w-full"
      >
        {isRequesting || isLoading ? 'Requesting...' : 'Request Tokens'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 