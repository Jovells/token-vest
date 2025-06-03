import { motion } from 'framer-motion'
import { 
  Settings, 
  Target,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TokenSelector } from '@/components/token-selector'
import { ScheduleForm } from '@/components/admin/schedule-form'
import { useTokenContext } from '@/contexts/token-context'
import { useToken } from '@/hooks/useToken'
import { useVesting } from '@/hooks/useVesting'
import { formatEther } from 'viem'
import { formatDate } from '@/lib/utils'

interface AdminCardProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}

function AdminCard({ title, description, icon, children }: AdminCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005, y: -1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
        <CardHeader className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {icon}
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function Admin() {
  const { selectedToken } = useTokenContext()
  const { getTokenSymbol } = useToken()
  const { vestingSchedule, scheduleExists, isCreatedByUser, getVestingProgress } = useVesting(selectedToken || '')

  return (
    <div className="space-y-8">
      {/* Token Not Selected State */}
      {!selectedToken && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center py-16"
        >
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-950 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="h-10 w-10 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Select a Token for KRNL Demo
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose a token below to create KRNL-powered vesting schedules 
              and experience kernel-verified distribution management.
            </p>
          </div>
        </motion.div>
      )}

      {/* Clean Token Selector Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Token Selection
                </CardTitle>
                <CardDescription>
                  Choose a token to create KRNL-powered vesting schedules
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <TokenSelector />
          </CardContent>
        </Card>
      </motion.div>

      {/* Token Selected Content */}
      {selectedToken && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {/* Admin Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Vesting Schedule */}
            <AdminCard
              title="Create Vesting Schedule"
              description="Set up a new token vesting schedule on Base Sepolia"
              icon={
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
              }
            >
              <ScheduleForm />
            </AdminCard>

            {/* Schedule Information */}
            <AdminCard
              title="Schedule Information"
              description="View current vesting schedule details"
              icon={
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-success" />
                </div>
              }
            >
              <div className="space-y-4">
                {scheduleExists ? (
                  <>
                    {/* Active Schedule Display */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="font-medium text-green-900 dark:text-green-300">Active Schedule</div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {isCreatedByUser ? 'Created by you' : 'Created by another admin'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Details */}
                    {vestingSchedule && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Amount</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {Number(formatEther((vestingSchedule as any).totalAmount)).toLocaleString()} {getTokenSymbol(selectedToken)}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Progress</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {getVestingProgress().toFixed(1)}%
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cliff Period</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {Math.floor(Number((vestingSchedule as any).cliffDuration) / (24 * 60 * 60))} days
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Duration</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {Math.floor(Number((vestingSchedule as any).vestingDuration) / (24 * 60 * 60))} days
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDate((vestingSchedule as any).startTime)}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* No Schedule State */}
                    <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-900 rounded-full flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">No Schedule</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Create a vesting schedule to get started
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No vesting schedule has been created for this token yet. 
                        Use the form on the left to create one and experience KRNL's kernel-verified distribution management.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </AdminCard>
          </div>
        </motion.div>
      )}
    </div>
  )
} 