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
  delay?: number
}

function StatCard({ title, value, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-md font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </motion.div>
  )
}

export function TokenInfo() {
  const { selectedToken } = useTokenContext()
  const { address, isConnected } = useAccount()
  const { getTokenSymbol } = useToken()
  const { 
    vestingSchedule, 
    scheduleExists, 
    isEligible,
    vestedAmount,
    getVestingProgress 
  } = useVesting(selectedToken || '')
  
  // Get token-specific data using the selected token
  const { userDeposits, userClaims, isSepolia } = useTokenData(selectedToken)

  if (!selectedToken) {
    return (
      <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-12 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Token Selected</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a token to view vesting information
          </p>
        </div>
      </div>
    )
  }

  // Show connection warnings
  if (!isConnected || !address) {
    return (
      <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-12 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-10 w-10 text-gray-500 dark:text-gray-400" />
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
      <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-12 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-warning" />
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
  const availableToClaim = calculateAvailableToClaim(vestedAmount || BigInt(0), userClaims || BigInt(0))

  // Calculate remaining deposit (deposited amount - total claimed)
  const remainingDeposit = calculateRemainingDeposit(userDeposits || BigInt(0), userClaims || BigInt(0))

  return (
    <div className="space-y-6">
      {/* Token Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-950 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                {getTokenSymbol(selectedToken)[0]}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {getTokenSymbol(selectedToken)} Token
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {formatAddress(selectedToken)}
              </p>
            </div>
          </div>
          <Badge variant={isEligible ? "default" : "destructive"} className="px-4 py-2">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Remaining Deposits"
          value={`${Number(formatEther(remainingDeposit || BigInt(0))).toFixed(2)} ${getTokenSymbol(selectedToken)}`}
          delay={0.1}
        />
        <StatCard
          title="Total Claims"
          value={`${Number(formatEther(userClaims || BigInt(0))).toFixed(2)} ${getTokenSymbol(selectedToken)}`}
          delay={0.2}
        />
        <StatCard
          title="Vested Amount"
          value={`${Number(formatEther(vestedAmount || BigInt(0))).toFixed(2)} ${getTokenSymbol(selectedToken)}`}
          delay={0.3}
        />
        <StatCard
          title="Available to Claim"
          value={`${Number(formatEther(availableToClaim)).toFixed(2)} ${getTokenSymbol(selectedToken)}`}
          delay={0.4}
        />
      </div>

      {/* Vesting Schedule */}
      {scheduleExists && schedule && schedule.isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-950 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-950 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Vesting Schedule</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track your token vesting progress</p>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Vesting Progress</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-4 mb-3" />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Started</span>
              <span className="font-medium">{formatDate(schedule.startTime)}</span>
              <span>Completed</span>
            </div>
          </div>

          {/* Schedule Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Amount</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {Number(formatEther(schedule.totalAmount)).toLocaleString()} {getTokenSymbol(selectedToken)}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cliff Period</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {Math.floor(Number(schedule.cliffDuration) / (24 * 60 * 60))} days
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vesting Duration</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {Math.floor(Number(schedule.vestingDuration) / (24 * 60 * 60))} days
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(schedule.startTime)}
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
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
          className="bg-gray-50 dark:bg-gray-950 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">No Vesting Schedule</h3>
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