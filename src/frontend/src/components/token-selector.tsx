import { useState, useEffect } from 'react'
import { Plus, Coins } from 'lucide-react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTokenContext } from '@/contexts/token-context'
import { useToken } from '@/hooks/useToken'
import { contracts } from '@/config/wagmi'
import { formatAddress } from '@/lib/utils'
import { toast } from 'sonner'

export function TokenSelector() {
  const { selectedToken, setSelectedToken } = useTokenContext()
  const [customTokenAddress, setCustomTokenAddress] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [showMintDialog, setShowMintDialog] = useState(false)
  const [mintAmount, setMintAmount] = useState('1000')
  
  const { allUniqueTokens, getTokenSymbol } = useToken()
  
  // Contract write hook for minting
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  
  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess, isError, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  })

  const handleTokenSelect = (token: string) => {
    if (token === 'custom') {
      setShowCustomInput(true)
    } else {
      setSelectedToken(token)
      setShowCustomInput(false)
      setCustomTokenAddress('')
    }
  }

  const handleCustomToken = () => {
    if (customTokenAddress.trim() && customTokenAddress.startsWith('0x')) {
      setSelectedToken(customTokenAddress.trim())
      setShowCustomInput(false)
      setCustomTokenAddress('')
    }
  }

  const handleMintVest = async () => {
    try {
      // Reset any previous errors
      reset()
      
      if (!mintAmount || isNaN(Number(mintAmount)) || Number(mintAmount) <= 0) {
        toast.error('Please enter a valid amount')
        return
      }

      if (Number(mintAmount) > 1000) {
        toast.error('Maximum mint amount is 1000 tokens')
        return
      }

      const amount = parseEther(mintAmount)
      
      writeContract({
        address: contracts.vestedToken.address,
        abi: contracts.vestedToken.abi,
        functionName: 'mintDemo',
        args: [amount],
      })
      
    } catch (error) {
      console.error('Minting failed:', error)
      toast.error('Failed to initiate minting transaction')
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
      toast.error('Transaction failed')
    }
  }, [isError, receiptError])

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setShowMintDialog(false)
      setMintAmount('1000')
      toast.success(`Successfully minted ${mintAmount} VEST tokens!`)
      // Dismiss all pending toasts
      toast.dismiss('mint-pending')
      toast.dismiss('mint-confirming')
      // Reset the transaction state
      reset()
    }
  }, [isSuccess, mintAmount, reset])

  // Show loading toast when transaction is pending
  useEffect(() => {
    if (isPending) {
      toast.loading('Submitting transaction...', { id: 'mint-pending' })
    } else {
      toast.dismiss('mint-pending')
    }
  }, [isPending])

  // Show confirmation toast when waiting for confirmation
  useEffect(() => {
    if (isConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'mint-confirming' })
    } else if (!isPending) {
      // Only dismiss if we're not still pending (avoid dismissing too early)
      toast.dismiss('mint-confirming')
    }
  }, [isConfirming, isPending])

  // Handle transaction errors and dismiss toasts
  useEffect(() => {
    if (isError || writeError) {
      toast.dismiss('mint-pending')
      toast.dismiss('mint-confirming')
    }
  }, [isError, writeError])

  const isVestSelected = selectedToken === contracts.vestedToken.address

  // Get display info for selected token
  const getSelectedTokenDisplay = () => {
    if (!selectedToken) return null
    
    if (selectedToken === contracts.vestedToken.address) {
      return {
        symbol: 'VEST',
        gradient: 'from-blue-500 to-purple-600',
        badge: 'Demo'
      }
    } else {
      return {
        symbol: getTokenSymbol(selectedToken),
        gradient: 'from-green-500 to-emerald-600',
        badge: 'Schedule'
      }
    }
  }

  const selectedDisplay = getSelectedTokenDisplay()

  const isMintDisabled = isPending || isConfirming || !mintAmount || Number(mintAmount) <= 0 || Number(mintAmount) > 1000

  return (
    <div className="flex items-center space-x-3">
      {/* Token Selector */}
      <div className="min-w-[200px]">
        <Select value={selectedToken} onValueChange={handleTokenSelect}>
          <SelectTrigger className="h-12 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-600 hover:border-[#001efe] rounded-xl shadow-sm transition-all duration-200">
            {selectedDisplay ? (
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-gradient-to-br ${selectedDisplay.gradient} rounded-full flex items-center justify-center`}>
                  <Coins className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">{selectedDisplay.symbol}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formatAddress(selectedToken)}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                  <Coins className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="text-left">
                  <span className="text-gray-500 dark:text-gray-400">Select a token</span>
                </div>
              </div>
            )}
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-600 shadow-xl rounded-xl">
            {/* VEST Token (always first) */}
            <SelectItem value={contracts.vestedToken.address} className="p-3 rounded-lg">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Coins className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">VEST</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatAddress(contracts.vestedToken.address)}</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-0">
                  Demo
                </Badge>
              </div>
            </SelectItem>

            {/* Other tokens with schedules */}
            {allUniqueTokens
              .filter(token => token !== contracts.vestedToken.address)
              .map((token) => (
                <SelectItem key={token} value={token} className="p-3 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <Coins className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{getTokenSymbol(token)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{formatAddress(token)}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-green-200 dark:border-green-800 text-green-600 dark:text-green-400">
                      Schedule
                    </Badge>
                  </div>
                </SelectItem>
              ))}

            {/* Custom token option */}
            <SelectItem value="custom" className="p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Add Custom Token</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Enter token address</div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Custom token input */}
        {showCustomInput && (
          <div className="mt-3 space-y-2 p-3 border rounded-xl bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-600">
            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Custom Token Address</Label>
            <Input
              placeholder="0x..."
              value={customTokenAddress}
              onChange={(e) => setCustomTokenAddress(e.target.value)}
              className="text-xs rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900"
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleCustomToken}
                disabled={!customTokenAddress.trim() || !customTokenAddress.startsWith('0x')}
                size="sm"
                className="flex-1 text-xs bg-[#001efe] hover:bg-[#001efe]/90 text-white rounded-lg"
              >
                Add Token
              </Button>
              <Button
                onClick={() => {
                  setShowCustomInput(false)
                  setCustomTokenAddress('')
                }}
                variant="outline"
                size="sm"
                className="flex-1 text-xs rounded-lg border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mint Button (only for VEST token) */}
      {isVestSelected && !showMintDialog && (
        <Button 
          onClick={() => setShowMintDialog(true)}
          size="sm" 
          className="bg-[#001efe] hover:bg-[#001efe]/90 text-white rounded-xl px-4 py-2.5 h-12 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Mint
        </Button>
      )}

      {/* Mint Dialog - Fixed positioning */}
      {showMintDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mint VEST Tokens</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Demo tokens for testing (max 1000)</p>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                VEST tokens are demo tokens used to showcase the vesting functionality. Maximum 1000 tokens per mint.
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="mint-amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount to Mint (Max: 1000)
              </Label>
              <Input
                id="mint-amount"
                type="number"
                placeholder="1000"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                max="1000"
                min="1"
                className="h-12 rounded-xl border-gray-200 dark:border-gray-600 focus:border-[#001efe] focus:ring-[#001efe] bg-white dark:bg-gray-900"
              />
              {Number(mintAmount) > 1000 && (
                <p className="text-xs text-red-500">Maximum mint amount is 1000 tokens</p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMintDialog(false)
                  setMintAmount('1000')
                  reset()
                }}
                className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isPending || isConfirming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMintVest}
                className="flex-1 h-12 bg-[#001efe] hover:bg-[#001efe]/90 text-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
                disabled={isMintDisabled}
              >
                {isPending || isConfirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {isPending ? 'Submitting...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Mint Tokens
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 