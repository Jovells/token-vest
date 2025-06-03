import { motion } from 'framer-motion'
import { Wallet, CheckCircle, XCircle, TrendingUp, Clock, Target } from 'lucide-react'
import { formatEther } from 'viem'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatAddress, formatDate } from '@/lib/utils'
import { useToken, useTokenData } from '@/hooks/useToken'
import { useVesting } from '@/hooks/useVesting'
import { useTokenContext } from '@/contexts/token-context'
import { useAccount } from 'wagmi'
import { calculateAvailableToClaim, calculateRemainingDeposit } from '@/hooks/useContractOperations'

interface StatCardProps {
  title: string
  value: string
  color?: 'blue' | 'green' | 'purple' | 'gray'
  delay?: number
}

function StatCard({ title, value, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-0 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </motion.div>
  )
}

export function TokenInfo() {
  const { selectedToken } = useTokenContext()
  const { getTokenSymbol } = useToken()
  const { address, isConnected, chainId } = useAccount()

  const {
    isEligible,
    vestingSchedule,
    vestedAmount,
    getVestingProgress,
    scheduleExists
  } = useVesting(selectedToken)

  // Get token-specific data using the selected token
  const { userDeposits, userClaims, tokenBalance, isSepolia } = useTokenData(selectedToken)

  // Enhanced debug logging for token balance
  console.log('TokenInfo Debug:', {
    selectedToken,
    isConnected,
    address,
    chainId,
    isSepolia,
    tokenBalance: tokenBalance?.toString(),
    userDeposits: userDeposits?.toString(),
    userClaims: userClaims?.toString()
  })

  if (!selectedToken) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border-0 shadow-sm">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-10 w-10 text-gray-400 dark:text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Token Selected</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a token from the selector above to view detailed information
          </p>
        </div>
      </div>
    )
  }

  // Show connection warnings
  if (!isConnected || !address) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border-0 shadow-sm">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Wallet Not Connected</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to view token information
          </p>
        </div>
      </div>
    )
  }

  if (!isSepolia) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border-0 shadow-sm">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Wrong Network</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please switch to Sepolia testnet to view token data
          </p>
        </div>
      </div>
    )
  }

  const progress = getVestingProgress()
  const schedule = vestingSchedule as any

  // Calculate available to claim amount (vested - already claimed)
  const availableToClaim = calculateAvailableToClaim(vestedAmount, userClaims)

  // Calculate remaining deposit (deposited amount - total claimed)
  const remainingDeposit = calculateRemainingDeposit(userDeposits, userClaims)

  return (
    <div className="space-y-8">
      {/* Token Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-0 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {getTokenSymbol(selectedToken)[0]}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getTokenSymbol(selectedToken)} Token
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {formatAddress(selectedToken)}
              </p>
            </div>
          </div>
          <Badge variant={isEligible ? "default" : "destructive"} className="px-4 py-2 rounded-xl">
            {isEligible ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Eligible for Claims
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Not Eligible
              </>
            )}
          </Badge>
        </div>
      </motion.div>

      {/* Token Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Wallet Balance"
          value={tokenBalance ? Number(formatEther(tokenBalance as bigint)).toFixed(2) : '0.00'}
          delay={0}
        />
        <StatCard
          title="Deposited Amount"
          value={userDeposits ? Number(formatEther(userDeposits as bigint)).toFixed(2) : '0.00'}
          delay={0.1}
        />
        <StatCard
          title="Remaining Deposit"
          value={Number(formatEther(remainingDeposit)).toFixed(2)}
          delay={0.2}
        />
        <StatCard
          title="Available to Claim"
          value={Number(formatEther(availableToClaim)).toFixed(2)}
          delay={0.3}
        />
        <StatCard
          title="Total Claimed"
          value={userClaims ? Number(formatEther(userClaims as bigint)).toFixed(2) : '0.00'}
          delay={0.4}
        />
      </div>

      {/* Vesting Schedule */}
      {scheduleExists && schedule && schedule.isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-0 shadow-sm"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#001efe] to-blue-600 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vesting Schedule</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track your token vesting progress</p>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-6 border border-blue-100 dark:border-blue-800 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-lg font-semibold text-blue-900 dark:text-blue-300">Vesting Progress</span>
              </div>
              <span className="text-2xl font-bold text-blue-900 dark:text-blue-300">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-4 bg-blue-200 dark:bg-blue-800 mb-3" />
            <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
              <span>Started</span>
              <span className="font-medium">{formatDate(schedule.startTime)}</span>
              <span>Completed</span>
            </div>
          </div>

          {/* Schedule Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Allocation</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {Number(formatEther(schedule.totalAmount)).toLocaleString()} {getTokenSymbol(selectedToken)}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(schedule.startTime)}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cliff Period</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {Math.floor(Number(schedule.cliffDuration) / (24 * 60 * 60))} days
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vesting Duration</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {Math.floor(Number(schedule.vestingDuration) / (24 * 60 * 60))} days
                </div>
              </div>
            </div>
          </div>

          {/* Status Banner */}
          <div className="mt-6 flex items-center justify-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-100 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-lg font-semibold text-green-900 dark:text-green-300">
                {progress === 0 && 'Vesting Period Not Started'}
                {progress > 0 && progress < 100 && 'Actively Vesting Tokens'}
                {progress === 100 && 'Vesting Period Completed'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* No Schedule Message */}
      {selectedToken && !scheduleExists && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-12 border-0 shadow-sm text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Vesting Schedule</h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            This token doesn't have an active vesting schedule yet.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            A vesting schedule needs to be created in the Admin panel before tokens can be claimed.
          </p>
        </motion.div>
      )}
    </div>
  )
} 