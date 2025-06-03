import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus, Coins, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToken, useTokenData } from '@/hooks/useToken'
import { useVesting } from '@/hooks/useVesting'
import { useContractOperations, calculateAvailableToClaim } from '@/hooks/useContractOperations'
import { useTokenContext } from '@/contexts/token-context'
import { formatEther } from 'viem'

export function TokenActions() {
  const [depositAmount, setDepositAmount] = useState('')
  const [claimAmount, setClaimAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const { selectedToken } = useTokenContext()
  const { getTokenSymbol } = useToken()

  const { isEligible, vestedAmount } = useVesting(selectedToken)

  // Get token-specific data for the selected token
  const { allowance, isSepolia, userDeposits, userClaims } = useTokenData(selectedToken)

  const {
    error,
    setError,
    isExecutingKernel,
    isApproving,
    isDepositing,
    isClaiming,
    isWithdrawing,
    depositTokens,
    claimTokens,
    withdrawTokens
  } = useContractOperations()

  if (!selectedToken) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center text-muted-foreground">
            <Coins className="mx-auto h-12 w-12 opacity-50 mb-2" />
            <p>Select a token to perform actions</p>
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

  const handleClaim = () => {
    if (claimAmount) {
      claimTokens(selectedToken, claimAmount, isEligible as boolean, isSepolia)
      setClaimAmount('')
    }
  }

  const handleWithdraw = () => {
    if (withdrawAmount) {
      withdrawTokens(selectedToken, withdrawAmount, isSepolia)
      setWithdrawAmount('')
    }
  }

  // Quick amount handlers
  const setQuickClaimAmount = (amount: string) => {
    if (amount === 'all') {
      // Calculate the actual available amount (vested - already claimed)
      const availableToClaim = calculateAvailableToClaim(vestedAmount, userClaims)
      if (availableToClaim > 0) {
        setClaimAmount(formatEther(availableToClaim))
      }
    } else {
      setClaimAmount(amount)
    }
  }

  const setQuickWithdrawAmount = (amount: string) => {
    if (amount === 'all' && userDeposits) {
      setWithdrawAmount(formatEther(userDeposits))
    } else {
      setWithdrawAmount(amount)
    }
  }

  const isLoading = isApproving || isDepositing || isClaiming || isWithdrawing || isExecutingKernel

  // Calculate available to claim for UI purposes
  const availableToClaim = calculateAvailableToClaim(vestedAmount, userClaims)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-primary" />
            <span>Token Actions</span>
          </div>
          {!isSepolia && (
            <Badge variant="destructive" className="text-xs">
              Switch to Sepolia
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit" className="flex items-center space-x-1">
              <Plus className="h-3 w-3" />
              <span>Deposit</span>
            </TabsTrigger>
            <TabsTrigger value="claim" className="flex items-center space-x-1">
              <Coins className="h-3 w-3" />
              <span>Claim</span>
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center space-x-1">
              <Minus className="h-3 w-3" />
              <span>Withdraw</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
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
                />
                <div className="flex items-center px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {getTokenSymbol(selectedToken)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Deposit tokens to make them available for claiming
              </p>
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
            
            {!isSepolia && (
              <p className="text-xs text-muted-foreground">
                Switch to Sepolia network to deposit tokens
              </p>
            )}
          </TabsContent>

          <TabsContent value="claim" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Claim Amount</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  className="flex-1"
                  step="0.1"
                  disabled={!isEligible}
                />
                <div className="flex items-center px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {getTokenSymbol(selectedToken)}
                </div>
              </div>

              {/* Quick Amount Buttons for Claim */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickClaimAmount('100')}
                  disabled={!isEligible}
                  className="flex-1 text-xs"
                >
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickClaimAmount('200')}
                  disabled={!isEligible}
                  className="flex-1 text-xs"
                >
                  200
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickClaimAmount('all')}
                  disabled={!isEligible || availableToClaim === BigInt(0)}
                  className="flex-1 text-xs"
                >
                  All
                </Button>
              </div>
              
              {!isEligible ? (
                <div className="flex items-center space-x-2 p-2 bg-destructive/10 rounded-md">
                  <Badge variant="destructive" className="text-xs">Not Eligible</Badge>
                  <p className="text-xs text-muted-foreground">
                    You are not eligible for this vesting schedule
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Claim your vested tokens based on the schedule
                </p>
              )}
            </div>
            
            <Button
              onClick={handleClaim}
              disabled={!claimAmount || isLoading || !isEligible || !isSepolia}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isExecutingKernel ? 'Verifying eligibility...' : 'Claiming...'}
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Claim Tokens
                </>
              )}
            </Button>
            
            {!isSepolia && (
              <p className="text-xs text-muted-foreground">
                Switch to Sepolia network to claim tokens
              </p>
            )}
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
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
                  className="flex-1 text-xs"
                >
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickWithdrawAmount('200')}
                  className="flex-1 text-xs"
                >
                  200
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickWithdrawAmount('all')}
                  disabled={!userDeposits}
                  className="flex-1 text-xs"
                >
                  All
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Withdraw your deposited tokens (only depositor can withdraw)
              </p>
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
            
            {!isSepolia && (
              <p className="text-xs text-muted-foreground">
                Switch to Sepolia network to withdraw tokens
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 