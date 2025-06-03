import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Loader2, Zap, Shield, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToken, useTokenData } from '@/hooks/useToken'
import { useVesting } from '@/hooks/useVesting'
import { useContractOperations, calculateAvailableToClaim } from '@/hooks/useContractOperations'
import { useTokenContext } from '@/contexts/token-context'
import { formatEther } from 'viem'
import { useSwitchChain } from 'wagmi'
import { sepolia } from 'viem/chains'

export function TokenClaim() {
  const [claimAmount, setClaimAmount] = useState('')

  const { selectedToken } = useTokenContext()
  const { getTokenSymbol } = useToken()
  const { switchChain } = useSwitchChain()

  const { isEligible, vestedAmount } = useVesting(selectedToken)

  // Get token-specific data for the selected token
  const { isSepolia, userClaims } = useTokenData(selectedToken)

  const {
    error,
    setError,
    isExecutingKernel,
    isClaiming,
    claimTokens
  } = useContractOperations()

  if (!selectedToken) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center text-muted-foreground">
            <Coins className="mx-auto h-12 w-12 opacity-50 mb-2" />
            <p>Select a token to claim vested tokens</p>
            <p className="text-xs mt-1">Choose a token from the sidebar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleClaim = () => {
    if (claimAmount) {
      claimTokens(selectedToken, claimAmount, isEligible as boolean, isSepolia)
      setClaimAmount('')
    }
  }

  const handleSwitchToSepolia = async () => {
    try {
      await switchChain({ chainId: sepolia.id })
    } catch (error) {
      console.error('Failed to switch to Sepolia:', error)
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

  const isLoading = isClaiming || isExecutingKernel

  // Calculate available to claim for UI purposes
  const availableToClaim = calculateAvailableToClaim(vestedAmount, userClaims)

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Coins className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg">Claim Vested Tokens</span>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  KRNL Powered
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Cross-Chain Verified
                </Badge>
              </div>
            </div>
          </div>
          {!isSepolia && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleSwitchToSepolia}
              className="animate-pulse"
            >
              Switch to Sepolia
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KRNL Feature Highlight */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">KRNL Integration Showcase</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Token claims are verified through KRNL kernels deployed on Base Sepolia. 
            This demonstrates secure cross-chain verification where vesting schedules on Base Sepolia 
            control token claims on Sepolia through KRNL's kernel architecture.
          </p>
        </div>

        {/* Network Warning */}
        {!isSepolia && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                <Coins className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Switch to Sepolia network to claim tokens
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSwitchToSepolia}
                className="text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                Switch Network
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

        {/* Claim Form */}
        <div className="space-y-4">
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

            {/* Quick Amount Buttons */}
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
                All Available
              </Button>
            </div>
            
            {/* Eligibility Status */}
            {!isEligible ? (
              <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-md">
                <Badge variant="destructive" className="text-xs">Not Eligible</Badge>
                <p className="text-xs text-muted-foreground">
                  You are not eligible for this vesting schedule
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                  <Badge variant="default" className="text-xs bg-green-600">Eligible</Badge>
                  <p className="text-xs text-muted-foreground">
                    KRNL kernel verification will be performed during claim
                  </p>
                </div>
                
                {/* Available Amount Info */}
                {availableToClaim > BigInt(0) && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    Available to claim: {formatEther(availableToClaim)} {getTokenSymbol(selectedToken)}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Claim Button */}
          <Button
            onClick={handleClaim}
            disabled={!claimAmount || isLoading || !isEligible || !isSepolia}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isExecutingKernel ? 'Verifying with KRNL Kernel...' : 'Processing Claim...'}
              </>
            ) : (
              <>
                <Coins className="mr-2 h-5 w-5" />
                Claim Tokens via KRNL
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          
          {/* Process Info */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <div className="font-medium mb-2">KRNL Claim Process:</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>1. Verify eligibility through Base Sepolia kernel</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>2. Cross-chain verification via KRNL protocol</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>3. Execute token transfer on Sepolia</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 