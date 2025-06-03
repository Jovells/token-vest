import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useVesting } from '@/hooks/useVesting'
import { useContractOperations } from '@/hooks/useContractOperations'
import { useSwitchChain } from 'wagmi'
import { baseSepolia } from 'viem/chains'

const SCHEDULE_TEMPLATES = [
  {
    name: 'Employee (4yr/1yr cliff)',
    cliffDuration: '365',
    vestingDuration: '1095',
    description: 'Standard employee vesting'
  },
  {
    name: 'Advisor (2yr/6mo cliff)',
    cliffDuration: '180',
    vestingDuration: '540',
    description: 'Advisor token allocation'
  },
  {
    name: 'ICO (1yr linear)',
    cliffDuration: '0',
    vestingDuration: '365',
    description: 'ICO participant vesting'
  },
  {
    name: 'Seed (3yr/6mo cliff)',
    cliffDuration: '180',
    vestingDuration: '900',
    description: 'Seed investor allocation'
  },
  {
    name: 'Founder (5yr/1yr cliff)',
    cliffDuration: '365',
    vestingDuration: '1460',
    description: 'Founder token vesting'
  }
]

export function ScheduleForm() {
  const [adminForm, setAdminForm] = useState({
    tokenAddress: '',
    totalAmount: '',
    startTime: '',
    cliffDuration: '',
    vestingDuration: '',
    eligibleAddresses: ''
  })

  const { isBaseSepolia } = useVesting('')
  const { switchChain } = useSwitchChain()
  const { 
    createVestingSchedule, 
    isSettingSchedule, 
    error,
    setError 
  } = useContractOperations()

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSwitchToBaseSepolia = async () => {
    try {
      await switchChain({ chainId: baseSepolia.id })
    } catch (error) {
      console.error('Failed to switch to Base Sepolia:', error)
    }
  }

  const handleTemplateSelect = (template: typeof SCHEDULE_TEMPLATES[0]) => {
    setAdminForm(prev => ({
      ...prev,
      cliffDuration: template.cliffDuration,
      vestingDuration: template.vestingDuration
    }))
    setSelectedTemplate(template.name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const success = await createVestingSchedule(adminForm, isBaseSepolia)
    if (success) {
      setShowSuccess(true)
      setAdminForm({
        tokenAddress: '',
        totalAmount: '',
        startTime: '',
        cliffDuration: '',
        vestingDuration: '',
        eligibleAddresses: ''
      })
      setSelectedTemplate(null)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }

  const isFormValid = adminForm.tokenAddress && 
                     adminForm.totalAmount && 
                     adminForm.cliffDuration && 
                     adminForm.vestingDuration && 
                     adminForm.eligibleAddresses

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Create Vesting Schedule</span>
          </div>
          {!isBaseSepolia && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleSwitchToBaseSepolia}
              className="animate-pulse"
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              Switch to Base Sepolia
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Network Warning */}
        {!isBaseSepolia && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Please switch to Base Sepolia network to create vesting schedules
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSwitchToBaseSepolia}
                className="text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                Switch Network
              </Button>
            </div>
          </motion.div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Vesting schedule created successfully!
              </span>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError('')}
                className="text-destructive/70 hover:text-destructive"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Templates */}
        <div>
          <div className="mb-3 flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Schedule Templates</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SCHEDULE_TEMPLATES.map((template) => (
              <motion.button
                key={template.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTemplateSelect(template)}
                className={`p-3 text-left rounded-lg border transition-colors ${
                  selectedTemplate === template.name
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-muted-foreground">{template.description}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Token Address</label>
              <Input
                placeholder="0x..."
                value={adminForm.tokenAddress}
                onChange={(e) => setAdminForm(prev => ({ ...prev, tokenAddress: e.target.value }))}
                disabled={!isBaseSepolia}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total Amount</label>
              <Input
                type="number"
                placeholder="1000"
                value={adminForm.totalAmount}
                onChange={(e) => setAdminForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                disabled={!isBaseSepolia}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time (Optional)</label>
              <Input
                type="datetime-local"
                value={adminForm.startTime}
                onChange={(e) => setAdminForm(prev => ({ ...prev, startTime: e.target.value }))}
                disabled={!isBaseSepolia}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cliff Duration (Days)</label>
              <Input
                type="number"
                placeholder="365"
                value={adminForm.cliffDuration}
                onChange={(e) => setAdminForm(prev => ({ ...prev, cliffDuration: e.target.value }))}
                disabled={!isBaseSepolia}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vesting Duration (Days)</label>
              <Input
                type="number"
                placeholder="1095"
                value={adminForm.vestingDuration}
                onChange={(e) => setAdminForm(prev => ({ ...prev, vestingDuration: e.target.value }))}
                disabled={!isBaseSepolia}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Eligible Addresses</span>
            </label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 text-sm border border-input rounded-md bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="0x123..., 0x456..., 0x789..."
              value={adminForm.eligibleAddresses}
              onChange={(e) => setAdminForm(prev => ({ ...prev, eligibleAddresses: e.target.value }))}
              disabled={!isBaseSepolia}
            />
            <p className="text-xs text-muted-foreground">
              Enter comma-separated wallet addresses that will be eligible for this vesting schedule
            </p>
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || isSettingSchedule || !isBaseSepolia}
            className="w-full"
          >
            {isSettingSchedule ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Schedule...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Create Vesting Schedule
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 