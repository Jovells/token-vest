import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus, Loader2, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToken, useTokenData } from '@/hooks/useToken'
import { useContractOperations } from '@/hooks/useContractOperations'
import { useTokenContext } from '@/contexts/token-context'
import { formatEther } from 'viem'
import { useSwitchChain } from 'wagmi'
import { sepolia } from 'viem/chains'

export function TokenOperations() {
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const { selectedToken } = useTokenContext()
  const { getTokenSymbol } = useToken()
  const { switchChain } = useSwitchChain()

  // Get token-specific data for the selected token
  const { allowance, isSepolia, userDeposits } = useTokenData(selectedToken)

  const {
    error,
    setError,
    isApproving,
    isDepositing,
    isWithdrawing,
    depositTokens,
    withdrawTokens
  } = useContractOperations()

  if (!selectedToken) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center text-muted-foreground">
            <Wallet className="mx-auto h-12 w-12 opacity-50 mb-2" />
            <p>Select a token to manage deposits</p>
            <p className="text-xs mt-1">Choose a token from the sidebar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleDeposit = () => {
    if (depositAmount) {
      depositTokens(selectedToken, depositAmount, allowance as bigint, isSepolia)
      setDepositAmount('')
    }
  }

  const handleWithdraw = () => {
    if (withdrawAmount) {
      withdrawTokens(selectedToken, withdrawAmount, isSepolia)
      setWithdrawAmount('')
    }
  }

  const handleSwitchToSepolia = async () => {
    try {
      await switchChain({ chainId: sepolia.id })
    } catch (error) {
      console.error('Failed to switch to Sepolia:', error)
    }
  }

  const setQuickWithdrawAmount = (amount: string) => {
    if (amount === 'all' && userDeposits) {
      setWithdrawAmount(formatEther(userDeposits))
    } else {
      setWithdrawAmount(amount)
    }
  }

  const isLoading = isApproving || isDepositing || isWithdrawing

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Token Operations</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Network Warning */}
        {!isSepolia && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Switch to Sepolia network for deposit/withdraw operations
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSwitchToSepolia}
                className="text-amber-800 border-amber-300 hover:bg-amber-100 whitespace-nowrap flex-shrink-0"
              >
                <span className="hidden sm:inline">Switch to Sepolia</span>
                <span className="sm:hidden">Switch Network</span>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
          >
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 text-destructive/70 hover:text-destructive"
            >
              ×
            </button>
          </motion.div>
        )}

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="flex items-center space-x-1">
              <Plus className="h-3 w-3" />
              <span>Deposit</span>
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center space-x-1">
              <Minus className="h-3 w-3" />
              <span>Withdraw</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Deposit tokens to make them available for claiming by eligible users. 
                Deposited tokens remain under your control until claimed.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deposit Amount</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1"
                  step="0.1"
                  disabled={!isSepolia}
                />
                <div className="flex items-center px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {getTokenSymbol(selectedToken)}
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleDeposit}
              disabled={!depositAmount || isLoading || !isSepolia}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isApproving ? 'Approving...' : 'Depositing...'}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Deposit Tokens
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-xs text-orange-700 dark:text-orange-400">
                Withdraw your deposited tokens. Only the original depositor can withdraw tokens. 
                This removes them from the claimable pool.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Withdraw Amount</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1"
                  step="0.1"
                  disabled={!isSepolia}
                />
                <div className="flex items-center px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {getTokenSymbol(selectedToken)}
                </div>
              </div>

              {/* Quick Amount Buttons for Withdraw */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickWithdrawAmount('100')}
                  disabled={!isSepolia}
                  className="flex-1 text-xs"
                >
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickWithdrawAmount('200')}
                  disabled={!isSepolia}
                  className="flex-1 text-xs"
                >
                  200
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickWithdrawAmount('all')}
                  disabled={!userDeposits || !isSepolia}
                  className="flex-1 text-xs"
                >
                  All
                </Button>
              </div>

              {/* Available Deposit Info */}
              {userDeposits && userDeposits > BigInt(0) ? (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Your deposits: {formatEther(userDeposits)} {getTokenSymbol(selectedToken)}
                </div>
              ) : null}
            </div>
            
            <Button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || isLoading || !isSepolia}
              className="w-full"
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <Minus className="mr-2 h-4 w-4" />
                  Withdraw Tokens
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 