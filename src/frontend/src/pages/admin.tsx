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
import { formatAddress, formatDate } from '@/lib/utils'

interface AdminCardProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
  gradient?: string
}

function AdminCard({ title, description, icon, children, gradient = "from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30" }: AdminCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
        <CardHeader className={`bg-gradient-to-r ${gradient} border-b border-gray-100 dark:border-gray-700`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#001efe] rounded-xl flex items-center justify-center">
              {icon}
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">{title}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">{description}</CardDescription>
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
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="h-10 w-10 text-orange-600" />
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

      {/* Token Selector Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#001efe]/10 to-blue-50 dark:from-[#001efe]/20 dark:to-blue-900/30 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#001efe] rounded-xl flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">
                  Token Selection
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
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
              icon={<Calendar className="h-5 w-5 text-white" />}
              gradient="from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30"
            >
              <ScheduleForm />
            </AdminCard>

            {/* Schedule Information */}
            <AdminCard
              title="Schedule Information"
              description="View current vesting schedule details"
              icon={<Settings className="h-5 w-5 text-white" />}
              gradient="from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30"
            >
              <div className="space-y-4">
                {scheduleExists ? (
                  <>
                    {/* Active Schedule Display */}
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 border border-green-100 dark:border-green-800">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-green-900 dark:text-green-300">Active Schedule</div>
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
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Amount</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {Number(formatEther((vestingSchedule as any).totalAmount)).toLocaleString()} {getTokenSymbol(selectedToken)}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Progress</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {getVestingProgress().toFixed(1)}%
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cliff Period</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {Math.floor(Number((vestingSchedule as any).cliffDuration) / (24 * 60 * 60))} days
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Duration</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {Math.floor(Number((vestingSchedule as any).vestingDuration) / (24 * 60 * 60))} days
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatDate((vestingSchedule as any).startTime)}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* No Schedule Display */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">No Active Schedule</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Create one to get started</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        No vesting schedule has been created for this token yet. 
                        Use the form on the left or select a template to create a new schedule.
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Once a schedule is created, you'll be able to view:
                      </p>
                      <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 ml-4">
                        <li>• Schedule parameters and timelines</li>
                        <li>• Current vesting progress</li>
                        <li>• Total allocated amounts</li>
                        <li>• Eligible addresses list</li>
                        <li>• Claim history and statistics</li>
                      </ul>
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