import { motion } from 'framer-motion'
import { Coins, Target, Zap, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TokenInfo } from '@/components/user/token-info'
import { TokenClaim } from '@/components/user/token-claim'
import { TokenOperations } from '@/components/user/token-operations'
import { TokenSelector } from '@/components/token-selector'
import { useTokenContext } from '@/contexts/token-context'

export function Dashboard() {
  const { selectedToken } = useTokenContext()

  return (
    <div className="space-y-8">
      {/* Clean Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-4">
            Welcome to TokenVest
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Experience KRNL-powered token vesting in action. This demo platform showcases 
            secure, kernel-verified token distribution with real-time eligibility checks 
            and multi-chain support.
          </p>
        </div>
      </motion.div>

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
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-950 rounded-full flex items-center justify-center mx-auto mb-6">
              <Coins className="h-10 w-10 text-primary" />
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
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Token Claims + Token Operations */}
            <div className="space-y-8">
              {/* KRNL Claim Feature - Clean highlight */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                {/* Subtle highlight border */}
                <div className="absolute -inset-0.5 bg-primary/10 rounded-lg"></div>
                
                <Card className="relative border-primary/20 overflow-hidden">
                  <CardHeader className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl flex items-center space-x-2">
                          <span>Token Claims</span>
                        </CardTitle>
                        <CardDescription className="text-base">
                          Experience secure, cross-chain token claiming powered by KRNL kernels
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TokenClaim />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Token Operations - Clean design */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          Token Management
                        </CardTitle>
                        <CardDescription>
                          Deposit and withdraw tokens for the claim pool
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TokenOperations />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column: Token Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="overflow-hidden h-fit">
                <CardHeader className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                      <Coins className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Vesting Information
                      </CardTitle>
                      <CardDescription>
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