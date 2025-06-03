import React, { useState, useEffect } from 'react';
import { FaChartLine, FaCoins, FaUsers, FaClock, FaArrowUp, FaArrowDown, FaInfoCircle } from 'react-icons/fa';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { contracts } from '../config/wagmi';

interface TokenAnalyticsProps {
  selectedToken: string;
}

interface AnalyticsData {
  totalDeposits: string;
  totalClaims: string;
  availableBalance: string;
  totalUsers: number;
  vestingProgress: number;
  claimRate: number;
  schedule?: {
    totalAmount: string;
    startTime: number;
    cliffDuration: number;
    vestingDuration: number;
    eligibleCount: number;
  };
}

const TokenAnalytics: React.FC<TokenAnalyticsProps> = ({ selectedToken }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDeposits: '0',
    totalClaims: '0',
    availableBalance: '0',
    totalUsers: 0,
    vestingProgress: 0,
    claimRate: 0,
  });

  // Read total deposits
  const { data: totalDeposits } = useReadContract({
    address: contracts.tokenClaimContract.address,
    abi: contracts.tokenClaimContract.abi,
    functionName: 'totalDeposits',
    args: [selectedToken as `0x${string}`],
    query: { enabled: !!selectedToken },
  });

  // Read total claims
  const { data: totalClaims } = useReadContract({
    address: contracts.tokenClaimContract.address,
    abi: contracts.tokenClaimContract.abi,
    functionName: 'totalClaims',
    args: [selectedToken as `0x${string}`],
    query: { enabled: !!selectedToken },
  });

  // Read vesting schedule
  const { data: vestingSchedule } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    abi: contracts.tokenVestingKernel.abi,
    functionName: 'getVestingSchedule',
    args: [selectedToken as `0x${string}`],
    query: { enabled: !!selectedToken },
  });

  // Read vesting progress
  const { data: vestingProgress } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    abi: contracts.tokenVestingKernel.abi,
    functionName: 'getVestingProgress',
    args: [selectedToken as `0x${string}`],
    query: { enabled: !!selectedToken },
  });

  // Read eligible addresses count
  const { data: eligibleAddresses } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    abi: contracts.tokenVestingKernel.abi,
    functionName: 'getEligibleAddresses',
    args: [selectedToken as `0x${string}`],
    query: { enabled: !!selectedToken },
  });

  useEffect(() => {
    if (totalDeposits && totalClaims && vestingSchedule && eligibleAddresses) {
      const depositsEther = formatEther(totalDeposits as bigint);
      const claimsEther = formatEther(totalClaims as bigint);
      const availableEther = (parseFloat(depositsEther) - parseFloat(claimsEther)).toString();
      const claimRatePercent = parseFloat(depositsEther) > 0 
        ? (parseFloat(claimsEther) / parseFloat(depositsEther)) * 100 
        : 0;

      setAnalytics({
        totalDeposits: depositsEther,
        totalClaims: claimsEther,
        availableBalance: availableEther,
        totalUsers: (eligibleAddresses as string[]).length,
        vestingProgress: vestingProgress ? Number(vestingProgress) / 1000 : 0, // Convert from scaled value
        claimRate: claimRatePercent,
        schedule: {
          totalAmount: formatEther(vestingSchedule.totalAmount),
          startTime: Number(vestingSchedule.startTime),
          cliffDuration: Number(vestingSchedule.cliffDuration),
          vestingDuration: Number(vestingSchedule.vestingDuration),
          eligibleCount: (eligibleAddresses as string[]).length,
        },
      });
    }
  }, [totalDeposits, totalClaims, vestingSchedule, vestingProgress, eligibleAddresses]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    if (days > 365) {
      return `${Math.floor(days / 365)} year(s)`;
    }
    return `${days} day(s)`;
  };

  const getTokenSymbol = (tokenAddress: string) => {
    if (tokenAddress === contracts.vestedToken.address) return 'VEST';
    if (tokenAddress === '0xA0b86a33E6441d0116c71F0e15e01d2c4dd6b022') return 'USDC';
    if (tokenAddress === '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06') return 'USDT';
    return 'TOKEN';
  };

  if (!selectedToken) {
    return (
      <div className="bg-white dark:bg-gray-950 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="text-center py-8 text-gray-500">
          <FaChartLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>Select a token to view analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaChartLine className="mr-2 text-primary" />
            Token Analytics - {getTokenSymbol(selectedToken)}
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {selectedToken.slice(0, 6)}...{selectedToken.slice(-4)}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deposits</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{parseFloat(analytics.totalDeposits).toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getTokenSymbol(selectedToken)}</p>
              </div>
              <FaCoins className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Claims</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{parseFloat(analytics.totalClaims).toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getTokenSymbol(selectedToken)}</p>
              </div>
              <FaArrowUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Balance</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{parseFloat(analytics.availableBalance).toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getTokenSymbol(selectedToken)}</p>
              </div>
              <FaArrowDown className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Eligible Users</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{analytics.totalUsers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">addresses</p>
              </div>
              <FaUsers className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>

        {/* Progress Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vesting Progress */}
          <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaClock className="mr-2 text-gray-500 dark:text-gray-400" />
              Vesting Progress
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Overall Progress</span>
                  <span>{analytics.vestingProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-900 rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(analytics.vestingProgress, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {analytics.vestingProgress === 0 ? 'Not Started' :
                     analytics.vestingProgress >= 100 ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Time Remaining:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {analytics.schedule ? 
                      formatDuration(analytics.schedule.vestingDuration - 
                        (Date.now() / 1000 - analytics.schedule.startTime - analytics.schedule.cliffDuration)) 
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Claim Rate */}
          <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaArrowUp className="mr-2 text-gray-500 dark:text-gray-400" />
              Claim Rate
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Claims vs Deposits</span>
                  <span>{analytics.claimRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-900 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(analytics.claimRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Efficiency:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {analytics.claimRate > 80 ? 'High' :
                     analytics.claimRate > 50 ? 'Medium' : 'Low'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Utilization:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {analytics.claimRate > 90 ? 'Excellent' :
                     analytics.claimRate > 70 ? 'Good' : 'Fair'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Details */}
      {analytics.schedule && (
        <div className="bg-white dark:bg-gray-950 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FaInfoCircle className="mr-2 text-primary" />
            Vesting Schedule Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Schedule Parameters</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total Amount per User:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{parseFloat(analytics.schedule.totalAmount).toFixed(2)} {getTokenSymbol(selectedToken)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(analytics.schedule.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cliff Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDuration(analytics.schedule.cliffDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Vesting Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDuration(analytics.schedule.vestingDuration)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cliff End:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(analytics.schedule.startTime + analytics.schedule.cliffDuration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Vesting End:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(analytics.schedule.startTime + analytics.schedule.cliffDuration + analytics.schedule.vestingDuration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDuration(analytics.schedule.cliffDuration + analytics.schedule.vestingDuration)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Participation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Eligible Users:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{analytics.schedule.eligibleCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Max Total Allocation:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(parseFloat(analytics.schedule.totalAmount) * analytics.schedule.eligibleCount).toFixed(2)} {getTokenSymbol(selectedToken)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Current Utilization:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {analytics.claimRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Data Placeholder */}
      <div className="bg-white dark:bg-gray-950 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <FaChartLine className="mr-2 text-success" />
          Historical Trends
        </h3>
        
        <div className="bg-gray-50 dark:bg-gray-950 p-8 rounded-lg text-center">
          <FaChartLine className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Coming Soon</h4>
          <p className="text-gray-600 dark:text-gray-400">
            Historical charts showing deposit trends, claim patterns, and vesting progress over time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenAnalytics; 