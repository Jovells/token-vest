import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseEther, createPublicClient, http } from 'viem'
import { baseSepolia, sepolia } from 'viem/chains'
import { contracts } from '@/config/wagmi'
import { ethers } from 'krnl-sdk'
import { isAuthorized } from '@/authorization'
import { toast } from 'sonner'

// KRNL configuration
const KRNL_ENTRY_ID = import.meta.env.VITE_KRNL_ENTRY_ID
const KRNL_ACCESS_TOKEN = import.meta.env.VITE_KRNL_ACCESS_TOKEN
const VESTING_KERNEL_ID = import.meta.env.VITE_VESTING_KERNEL_ID

export function useContractOperations() {
  const [error, setError] = useState('')
  const [isExecutingKernel, setIsExecutingKernel] = useState(false)
  const { address } = useAccount()
  const queryClient = useQueryClient()

  const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL)
  const abiCoder = new ethers.AbiCoder()

  // Write contract functions
  const { writeContractAsync: approve, data: approveData } = useWriteContract()
  const { writeContractAsync: deposit, data: depositData } = useWriteContract()
  const { writeContractAsync: claim, data: claimData } = useWriteContract()
  const { writeContractAsync: withdraw, data: withdrawData } = useWriteContract()
  const { writeContractAsync: mintDemo, data: mintData } = useWriteContract()
  const { writeContractAsync: setVestingSchedule, data: setScheduleData } = useWriteContract()

  // Wait for transactions
  const { isLoading: isApproving, isSuccess: isApprovingSuccess } = useWaitForTransactionReceipt({ hash: approveData })
  const { isLoading: isDepositing, isSuccess: isDepositingSuccess } = useWaitForTransactionReceipt({ hash: depositData })
  const { isLoading: isClaiming, isSuccess: isClaimingSuccess } = useWaitForTransactionReceipt({ hash: claimData })
  const { isLoading: isWithdrawing, isSuccess: isWithdrawingSuccess } = useWaitForTransactionReceipt({ hash: withdrawData })
  const { isLoading: isMinting, isSuccess: isMintingSuccess } = useWaitForTransactionReceipt({ hash: mintData })
  const { isLoading: isSettingSchedule, isSuccess: isSettingScheduleSuccess } = useWaitForTransactionReceipt({ hash: setScheduleData })

  // Invalidate all queries after successful transactions
  useEffect(() => {
    if (isApprovingSuccess || isDepositingSuccess || isClaimingSuccess || isWithdrawingSuccess || isMintingSuccess || isSettingScheduleSuccess) {
      console.log('Transaction successful, invalidating all queries')
      queryClient.invalidateQueries()
      
      // Dismiss loading toasts and show success messages
      if (isMintingSuccess) {
        toast.dismiss('mint-pending')
        toast.success('Tokens minted successfully!')
      }
      if (isApprovingSuccess) {
        toast.dismiss('approve-pending')
        toast.success('Token approval successful!')
      }
      if (isDepositingSuccess) {
        toast.dismiss('deposit-pending')
        toast.success('Tokens deposited successfully!')
      }
      if (isClaimingSuccess) {
        toast.dismiss('claim-pending')
        toast.success('Tokens claimed successfully!')
      }
      if (isWithdrawingSuccess) {
        toast.dismiss('withdraw-pending')
        toast.success('Tokens withdrawn successfully!')
      }
      if (isSettingScheduleSuccess) {
        toast.dismiss('schedule-pending')
        toast.success('Vesting schedule created successfully!')
      }
    }
  }, [isApprovingSuccess, isDepositingSuccess, isClaimingSuccess, isWithdrawingSuccess, isMintingSuccess, isSettingScheduleSuccess, queryClient])

  // Execute KRNL kernel for vesting verification
  const executeKernel = async (token: string, user: string, amount: string) => {
    const parsedAmount = parseEther(amount)
    if (!address) throw "Address not found"
    const krnlParamsAbifrag = ["address", "address"];
    const functionParamsAbifrag = ["address", "uint256"];

    const executeKernelResParamsAbiFrag = ['(uint8,bytes,string)[]'];
    const executekernelResAbiFrag = ['(uint256,bytes,string)[]']

    setIsExecutingKernel(true)
    try {
      const kernelParams = abiCoder.encode(krnlParamsAbifrag, [token, user])
      const functionParams = abiCoder.encode(functionParamsAbifrag, [token, parsedAmount])
      
      const kernelRequestData = {
        senderAddress: address,
        kernelPayload: {
          [VESTING_KERNEL_ID]: {
            functionParams: kernelParams
          }
        }
      }
      console.log({kernelParams: {address, token},
        functionParams: {token, parsedAmount},
        KRNL_ENTRY_ID,
        KRNL_ACCESS_TOKEN,
        VESTING_KERNEL_ID,
        kernelRequestData,
    })
      
    //   @ts-expect-error - TODO: report this error to krnl
      const krnlPayload = await provider.executeKernels(KRNL_ENTRY_ID, KRNL_ACCESS_TOKEN, kernelRequestData, functionParams)
      const decodedKernelParams = abiCoder.decode(executeKernelResParamsAbiFrag, krnlPayload.kernel_params)
      const decodedRes = abiCoder.decode(executekernelResAbiFrag, krnlPayload.kernel_responses)

      console.log({
        decodedKernelParams, decodedFunctionParams: decodedRes})

    console.log({
        paramDecoded: abiCoder.decode(['address', 'address'], decodedKernelParams[0][0][1], true),
        functionResDecoded: abiCoder.decode(['uint256'], decodedRes[0][0][1], true),
    })

      const auth = await isAuthorized({
        auth: krnlPayload.auth,
        kernelParams: krnlPayload.kernel_params,
        kernelResponses: krnlPayload.kernel_responses
      }, functionParams, address)

      console.log({auth})


      return { krnlPayload }
    } catch (err) {
      console.error('Kernel execution error:', err)
      throw err
    } finally {
      setIsExecutingKernel(false)
    }
  }

  // Mint demo tokens
  const mintDemoTokens = async (selectedToken: string, isSepolia: boolean) => {
    if (!isSepolia || selectedToken !== contracts.vestedToken.address) {
      setError('Demo minting only available for VestedToken on Sepolia network')
      return
    }

    setError('')
    try {
      toast.loading('Requesting transaction approval...', { id: 'mint-approval' })
      await mintDemo({
        address: contracts.vestedToken.address,
        abi: contracts.vestedToken.abi,
        functionName: 'mintDemo',
        args: [parseEther('100')],
      })
      toast.dismiss('mint-approval')
      toast.loading('Minting tokens...', { id: 'mint-pending' })
    } catch (err) {
      toast.dismiss('mint-approval')
      console.error('Mint error:', err)
      setError(err instanceof Error ? err.message : 'Failed to mint tokens')
    }
  }

  // Deposit tokens
  const depositTokens = async (selectedToken: string, amount: string, allowance: bigint, isSepolia: boolean) => {
    if (!isSepolia || !selectedToken || !amount) {
      setError('Please select a token and enter deposit amount')
      return
    }

    setError('')
    const parsedAmount = parseEther(amount)

    try {
      // Check allowance and approve if needed
      if (!allowance || allowance < parsedAmount) {
        toast.loading('Requesting approval transaction...', { id: 'approve-approval' })
        await approve({
          address: selectedToken as `0x${string}`,
          abi: contracts.vestedToken.abi,
          functionName: 'approve',
          args: [contracts.tokenClaimContract.address, parsedAmount],
        })
        toast.dismiss('approve-approval')
        toast.loading('Approving tokens...', { id: 'approve-pending' })
      }

      toast.loading('Requesting deposit transaction...', { id: 'deposit-approval' })
      await deposit({
        address: contracts.tokenClaimContract.address,
        abi: contracts.tokenClaimContract.abi,
        functionName: 'depositTokens',
        args: [selectedToken as `0x${string}`, parsedAmount],
      })
      toast.dismiss('deposit-approval')
      toast.loading('Depositing tokens...', { id: 'deposit-pending' })
    } catch (err) {
      toast.dismiss('approve-approval')
      toast.dismiss('deposit-approval')
      console.error('Deposit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to deposit tokens')
    }
  }

  // Claim vested tokens
  const claimTokens = async (selectedToken: string, amount: string, isEligible: boolean, isSepolia: boolean) => {
    if (!isSepolia || !selectedToken || !amount) {
      setError('Please connect to Sepolia network, select a token and enter claim amount')
      return
    }

    if (!isEligible) {
      setError('You are not eligible to claim tokens for this vesting schedule')
      return
    }

    setError('')
    const parsedAmount = parseEther(amount)

    try {
      // Execute KRNL kernel for verification
      toast.loading('Verifying eligibility with KRNL...', { id: 'verify-kernel' })
      const { krnlPayload } = await executeKernel(selectedToken, address!, amount)
      if (!krnlPayload) {
        throw new Error('Failed to get KRNL payload')
      }
      toast.dismiss('verify-kernel')

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(sepolia.rpcUrls.default.http[0])
      })

      const args = [{
        auth: krnlPayload.auth as `0x${string}`,
        kernelResponses: krnlPayload.kernel_responses as `0x${string}`,
        kernelParams: krnlPayload.kernel_params as `0x${string}`
      }, selectedToken as `0x${string}`, parsedAmount] as const

    //   Simulate first
      await publicClient.simulateContract({
        address: contracts.tokenClaimContract.address,
        abi: contracts.tokenClaimContract.abi,
        functionName: 'claimTokens',
        account: address,
        args
      })

      // Execute claim
      toast.loading('Requesting claim transaction...', { id: 'claim-approval' })
      await claim({
        address: contracts.tokenClaimContract.address,
        abi: contracts.tokenClaimContract.abi,
        functionName: 'claimTokens',
        args
      })
      toast.dismiss('claim-approval')
      toast.loading('Claiming tokens...', { id: 'claim-pending' })
    } catch (err) {
      toast.dismiss('verify-kernel')
      toast.dismiss('claim-approval')
      console.error('Claim error:', err)
      setError(err instanceof Error ? err.message : 'Failed to claim tokens')
    }
  }

  // Withdraw deposited tokens
  const withdrawTokens = async (selectedToken: string, amount: string, isSepolia: boolean) => {
    if (!isSepolia || !selectedToken || !amount) {
      setError('Please select a token and enter withdraw amount')
      return
    }

    setError('')
    const parsedAmount = parseEther(amount)

    try {
      toast.loading('Requesting withdrawal transaction...', { id: 'withdraw-approval' })
      await withdraw({
        address: contracts.tokenClaimContract.address,
        abi: contracts.tokenClaimContract.abi,
        functionName: 'withdrawTokens',
        args: [selectedToken as `0x${string}`, parsedAmount],
      })
      toast.dismiss('withdraw-approval')
      toast.loading('Withdrawing tokens...', { id: 'withdraw-pending' })
    } catch (err) {
      toast.dismiss('withdraw-approval')
      console.error('Withdraw error:', err)
      setError(err instanceof Error ? err.message : 'Failed to withdraw tokens')
    }
  }

  // Create vesting schedule (Admin function)
  const createVestingSchedule = async (adminForm: any, isBaseSepolia: boolean) => {
    if (!isBaseSepolia) {
      setError('Please switch to Base Sepolia network to create vesting schedules. Vesting schedules are managed on Base Sepolia.')
      return
    }

    if (!adminForm.tokenAddress || !adminForm.totalAmount || !adminForm.eligibleAddresses) {
      setError('Please fill in all required fields')
      return
    }

    setError('')
    try {
      const addresses = adminForm.eligibleAddresses
        .split(',')
        .map((addr: string) => addr.trim())
        .filter((addr: string) => addr.length > 0)

      if (addresses.length === 0) {
        setError('Please provide at least one eligible address')
        return
      }

      const startTime = adminForm.startTime ? Math.floor(new Date(adminForm.startTime).getTime() / 1000) : Math.floor(Date.now() / 1000)
      const cliffDuration = parseInt(adminForm.cliffDuration) * 24 * 60 * 60
      const vestingDuration = parseInt(adminForm.vestingDuration) * 24 * 60 * 60

      toast.loading('Requesting schedule creation transaction...', { id: 'schedule-approval' })
      await setVestingSchedule({
        address: contracts.tokenVestingKernel.address,
        abi: contracts.tokenVestingKernel.abi,
        functionName: 'setVestingSchedule',
        chain: baseSepolia,
        args: [
          adminForm.tokenAddress as `0x${string}`,
          parseEther(adminForm.totalAmount),
          BigInt(startTime),
          BigInt(cliffDuration),
          BigInt(vestingDuration),
          addresses as `0x${string}`[]
        ],
      })
      toast.dismiss('schedule-approval')
      toast.loading('Creating vesting schedule...', { id: 'schedule-pending' })

      return true
    } catch (err) {
      toast.dismiss('schedule-approval')
      console.error('Create schedule error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create vesting schedule')
      return false
    }
  }

  return {
    error,
    setError,
    isExecutingKernel,
    isApproving,
    isApprovingSuccess,
    isDepositing,
    isDepositingSuccess,
    isClaiming,
    isClaimingSuccess,
    isWithdrawing,
    isWithdrawingSuccess,
    isMinting,
    isMintingSuccess,
    isSettingSchedule,
    isSettingScheduleSuccess,
    mintDemoTokens,
    depositTokens,
    claimTokens,
    withdrawTokens,
    createVestingSchedule
  }
}

// Utility function to calculate available to claim amount (vested amount - already claimed)
export function calculateAvailableToClaim(vestedAmount: bigint | undefined, userClaims: bigint | undefined): bigint {
  if (!vestedAmount) return BigInt(0)
  if (!userClaims) return vestedAmount
  
  // Return vested amount minus already claimed amount, but never go below 0
  return vestedAmount > userClaims ? vestedAmount - userClaims : BigInt(0)
}

// Utility function to calculate remaining deposit (deposited amount - total claimed)
export function calculateRemainingDeposit(userDeposits: bigint | undefined, userClaims: bigint | undefined): bigint {
  if (!userDeposits) return BigInt(0)
  if (!userClaims) return userDeposits
  
  // Return deposited amount minus claimed amount, but never go below 0
  return userDeposits > userClaims ? userDeposits - userClaims : BigInt(0)
} 