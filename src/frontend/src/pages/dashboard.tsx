import { motion } from 'framer-motion'
import { Coins, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TokenInfo } from '@/components/user/token-info'
import { TokenActions } from '@/components/user/token-actions'
import { TokenSelector } from '@/components/token-selector'
import { useTokenContext } from '@/contexts/token-context'

export function Dashboard() {
  const { selectedToken } = useTokenContext()

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to TokenVest
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Experience KRNL-powered token vesting in action. This demo platform showcases 
            secure, kernel-verified token distribution with real-time eligibility checks 
            and multi-chain support.
          </p>
        </div>
      </motion.div>

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
                  Choose a token to experience KRNL-powered vesting and claims
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <TokenSelector />
          </CardContent>
        </Card>
      </motion.div>

      {/* Token Not Selected State */}
      {!selectedToken && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16"
        >
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Coins className="h-10 w-10 text-[#001efe]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Select a Token to Experience KRNL
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose a token above to explore KRNL kernel integration in action. 
              Experience secure, verified token vesting and claiming.
            </p>
          </div>
        </motion.div>
      )}

      {/* Token Selected Content */}
      {selectedToken && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {/* Main Content Grid - Token Actions First (More Prominent) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Token Actions - First and Prominent */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-1 order-1 lg:order-1"
            >
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-2xl overflow-hidden h-fit">
                <CardHeader className="bg-gradient-to-r from-[#001efe]/10 to-blue-50 dark:from-[#001efe]/20 dark:to-blue-900/30 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#001efe] rounded-xl flex items-center justify-center">
                      <Coins className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 dark:text-white">
                        KRNL-Powered Actions
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Experience kernel-verified operations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <TokenActions />
                </CardContent>
              </Card>
            </motion.div>

            {/* Token Information - Secondary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 order-2 lg:order-2"
            >
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                      <Coins className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 dark:text-white">
                        Vesting Information
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Real-time vesting progress and balance tracking
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <TokenInfo />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 