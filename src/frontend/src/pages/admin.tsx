import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Calendar, 
  Coins, 
  Plus,
  Clock,
  Users,
  TrendingUp,
  UserPlus,
  Loader2,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TokenSelector } from '@/components/token-selector'
import { useTokenContext } from '@/contexts/token-context'
import { useToken } from '@/hooks/useToken'
import { useVesting } from '@/hooks/useVesting'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { contracts } from '@/config/wagmi'
import { formatAddress, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

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

interface VestingTemplate {
  name: string
  description: string
  cliffDays: string
  durationDays: string
  totalAmount: string
  icon: React.ReactNode
  gradient: string
}

const VESTING_TEMPLATES: VestingTemplate[] = [
  {
    name: "Standard Employee",
    description: "4-year vesting with 1-year cliff",
    cliffDays: "365",
    durationDays: "1460", // 4 years
    totalAmount: "10000",
    icon: <Users className="h-4 w-4" />,
    gradient: "from-blue-500 to-blue-600"
  },
  {
    name: "Advisor",
    description: "2-year vesting with 6-month cliff",
    cliffDays: "180",
    durationDays: "730", // 2 years
    totalAmount: "5000",
    icon: <TrendingUp className="h-4 w-4" />,
    gradient: "from-green-500 to-green-600"
  },
  {
    name: "Early Investor",
    description: "3-year vesting with 1-year cliff",
    cliffDays: "365",
    durationDays: "1095", // 3 years
    totalAmount: "25000",
    icon: <Coins className="h-4 w-4" />,
    gradient: "from-purple-500 to-purple-600"
  },
  {
    name: "Quick Test",
    description: "Short vesting for testing",
    cliffDays: "1",
    durationDays: "30",
    totalAmount: "1000",
    icon: <Clock className="h-4 w-4" />,
    gradient: "from-orange-500 to-orange-600"
  }
]

export function Admin() {
  const { selectedToken } = useTokenContext()
  const { getTokenSymbol } = useToken()
  const { vestingSchedule, scheduleExists, isCreatedByUser, getVestingProgress } = useVesting(selectedToken || '')
  const [scheduleForm, setScheduleForm] = useState({
    cliffDays: '',
    durationDays: '',
    totalAmount: '',
    eligibleAddresses: ''
  })
  const [showTemplates, setShowTemplates] = useState(false)

  // Contract write hook for creating schedule
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  
  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess, isError, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  })

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedToken) {
      toast.error('Please select a token first')
      return
    }

    try {
      // Reset any previous errors
      reset()

      // Convert days to seconds for contract interaction
      const cliffSeconds = parseInt(scheduleForm.cliffDays) * 24 * 60 * 60
      const durationSeconds = parseInt(scheduleForm.durationDays) * 24 * 60 * 60
      const totalAmount = parseEther(scheduleForm.totalAmount)
      const startTime = Math.floor(Date.now() / 1000) // Current timestamp
      
      // Parse eligible addresses
      const addresses = scheduleForm.eligibleAddresses
        .split(',')
        .map(addr => addr.trim())
        .filter(addr => addr.startsWith('0x') && addr.length === 42) as `0x${string}`[]
      
      if (addresses.length === 0) {
        toast.error('Please provide at least one valid Ethereum address')
        return
      }

      console.log('Creating schedule with params:', {
        token: selectedToken,
        totalAmount: totalAmount.toString(),
        startTime,
        cliffDuration: cliffSeconds,
        vestingDuration: durationSeconds,
        eligibleAddresses: addresses
      })

      writeContract({
        address: contracts.tokenVestingKernel.address,
        abi: contracts.tokenVestingKernel.abi,
        functionName: 'setVestingSchedule',
        args: [
          selectedToken as `0x${string}`,
          totalAmount,
          BigInt(startTime),
          BigInt(cliffSeconds),
          BigInt(durationSeconds),
          addresses
        ],
      })
      
    } catch (error) {
      console.error('Failed to create schedule:', error)
      toast.error('Failed to initiate schedule creation')
    }
  }

  // Handle write contract error
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError)
      toast.error('Transaction failed to submit')
    }
  }, [writeError])

  // Handle transaction confirmation error
  useEffect(() => {
    if (isError && receiptError) {
      console.error('Transaction failed:', receiptError)
      toast.error('Failed to create vesting schedule')
    }
  }, [isError, receiptError])

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setScheduleForm({
        cliffDays: '',
        durationDays: '',
        totalAmount: '',
        eligibleAddresses: ''
      })
      toast.success('Vesting schedule created successfully!')
      // Dismiss all pending toasts
      toast.dismiss('schedule-pending')
      toast.dismiss('schedule-confirming')
      // Reset the transaction state
      reset()
    }
  }, [isSuccess, reset])

  // Show loading toast when transaction is pending
  useEffect(() => {
    if (isPending) {
      toast.loading('Submitting transaction...', { id: 'schedule-pending' })
    } else {
      toast.dismiss('schedule-pending')
    }
  }, [isPending])

  // Show confirmation toast when waiting for confirmation
  useEffect(() => {
    if (isConfirming) {
      toast.loading('Creating vesting schedule...', { id: 'schedule-confirming' })
    } else if (!isPending) {
      // Only dismiss if we're not still pending (avoid dismissing too early)
      toast.dismiss('schedule-confirming')
    }
  }, [isConfirming, isPending])

  // Handle transaction errors and dismiss toasts
  useEffect(() => {
    if (isError || writeError) {
      toast.dismiss('schedule-pending')
      toast.dismiss('schedule-confirming')
    }
  }, [isError, writeError])

  const applyTemplate = (template: VestingTemplate) => {
    setScheduleForm(prev => ({
      ...prev,
      cliffDays: template.cliffDays,
      durationDays: template.durationDays,
      totalAmount: template.totalAmount
    }))
  }

  const isFormValid = scheduleForm.cliffDays && 
                    scheduleForm.durationDays && 
                    scheduleForm.totalAmount && 
                    scheduleForm.eligibleAddresses.trim()

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
              description="Set up a new token vesting schedule"
              icon={<Calendar className="h-5 w-5 text-white" />}
              gradient="from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30"
            >
              <div className="space-y-6">
                {/* Vesting Templates - Minimized */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Templates</span>
                    </div>
                    {showTemplates ? (
                      <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                  
                  {showTemplates && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 dark:border-gray-600 p-3"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {VESTING_TEMPLATES.map((template) => (
                          <motion.button
                            key={template.name}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => applyTemplate(template)}
                            className="p-2 border border-gray-100 dark:border-gray-700 rounded-lg cursor-pointer hover:border-[#001efe] transition-all duration-200 text-left"
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 bg-gradient-to-br ${template.gradient} rounded-md flex items-center justify-center text-white`}>
                                {template.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white text-xs truncate">{template.name}</h4>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {template.cliffDays}d cliff, {template.durationDays}d vest
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <form onSubmit={handleCreateSchedule} className="space-y-6">
                  {/* Token Information Display */}
                  <div className="bg-gradient-to-r from-[#001efe]/10 to-blue-50 dark:from-[#001efe]/20 dark:to-blue-900/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {selectedToken ? getTokenSymbol(selectedToken)[0] : 'T'}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            Creating Schedule for: {selectedToken ? getTokenSymbol(selectedToken) : 'No Token'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                            {selectedToken ? formatAddress(selectedToken) : 'Please select a token above'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-[#001efe] dark:text-blue-400 font-medium">
                        Change token above ↑
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cliffDays" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cliff Period (days)
                      </Label>
                      <Input
                        id="cliffDays"
                        type="number"
                        placeholder="365"
                        value={scheduleForm.cliffDays}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, cliffDays: e.target.value })}
                        className="mt-1 h-12 rounded-xl border-gray-200 dark:border-gray-600 focus:border-[#001efe] focus:ring-[#001efe] bg-white dark:bg-gray-700"
                        disabled={isPending || isConfirming}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Initial period (in days) before vesting begins
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="durationDays" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Vesting Duration (days)
                      </Label>
                      <Input
                        id="durationDays"
                        type="number"
                        placeholder="1460"
                        value={scheduleForm.durationDays}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, durationDays: e.target.value })}
                        className="mt-1 h-12 rounded-xl border-gray-200 dark:border-gray-600 focus:border-[#001efe] focus:ring-[#001efe] bg-white dark:bg-gray-700"
                        disabled={isPending || isConfirming}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Total time (in days) for all tokens to vest
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="totalAmount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Amount
                      </Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        placeholder="1000000"
                        value={scheduleForm.totalAmount}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, totalAmount: e.target.value })}
                        className="mt-1 h-12 rounded-xl border-gray-200 dark:border-gray-600 focus:border-[#001efe] focus:ring-[#001efe] bg-white dark:bg-gray-700"
                        disabled={isPending || isConfirming}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Total tokens to be vested
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="eligibleAddresses" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                        <UserPlus className="h-4 w-4" />
                        <span>Eligible Addresses</span>
                      </Label>
                      <Input
                        id="eligibleAddresses"
                        type="text"
                        placeholder="0x123...,0x456...,0x789..."
                        value={scheduleForm.eligibleAddresses}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, eligibleAddresses: e.target.value })}
                        className="mt-1 h-12 rounded-xl border-gray-200 dark:border-gray-600 focus:border-[#001efe] focus:ring-[#001efe] bg-white dark:bg-gray-700"
                        disabled={isPending || isConfirming}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Comma-separated Ethereum addresses eligible for vesting
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#001efe] hover:bg-[#001efe]/90 text-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
                    disabled={!isFormValid || isPending || isConfirming}
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isPending ? 'Submitting...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Schedule
                      </>
                    )}
                  </Button>
                </form>
              </div>
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