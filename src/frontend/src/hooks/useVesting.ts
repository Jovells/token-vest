import { useAccount, useReadContract } from 'wagmi'
import { baseSepolia, sepolia } from 'viem/chains'
import { contracts } from '@/config/wagmi'

export function useVesting(selectedToken: string) {
  const { address, chainId } = useAccount()
  const isSepolia = chainId === sepolia.id
  const isBaseSepolia = chainId === baseSepolia.id

  // All kernel reads should work regardless of current network, targeting Base Sepolia
  // Read user eligibility for selected token (from Base Sepolia kernel)
  const { data: isEligible } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    abi: contracts.tokenVestingKernel.abi,
    functionName: 'isAddressEligible',
    args: [selectedToken as `0x${string}`, address!],
    chainId: baseSepolia.id,
    query: {
      enabled: !!address && !!selectedToken,
    },
  })

  // Read vesting schedule for selected token (from Base Sepolia kernel)
  const { data: vestingSchedule } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    abi: contracts.tokenVestingKernel.abi,
    functionName: 'getVestingSchedule',
    args: [selectedToken as `0x${string}`],
    chainId: baseSepolia.id,
    query: {
      enabled: !!selectedToken,
    },
  })

  // Read vested amount for user (from Base Sepolia kernel)
  const { data: vestedAmount } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    abi: contracts.tokenVestingKernel.abi,
    functionName: 'getVestedAmount',
    args: [selectedToken as `0x${string}`, address!],
    chainId: baseSepolia.id,
    query: {
      enabled: !!address && !!selectedToken,
    },
  })

  // Check if schedule has active data (exists)
  const { data: hasActiveSchedule } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    abi: contracts.tokenVestingKernel.abi,
    functionName: 'hasActiveSchedule',
    args: [selectedToken as `0x${string}`],
    chainId: baseSepolia.id,
    query: {
      enabled: !!selectedToken,
    },
  })

  // Extract creator from vesting schedule
  const schedule = vestingSchedule as any
  const scheduleCreator = schedule?.creator
  
  // Check if current user created the schedule
  const isCreatedByUser = scheduleCreator && address ? 
    scheduleCreator.toLowerCase() === address.toLowerCase() : false

  // Check if schedule exists
  const scheduleExists = hasActiveSchedule || (schedule && schedule.creator)

  // Calculate vesting progress percentage
  const getVestingProgress = () => {
    if (!vestingSchedule || !(vestingSchedule as any).isActive) return 0
    
    const schedule = vestingSchedule as any
    const now = Date.now() / 1000
    const start = Number(schedule.startTime)
    const cliff = Number(schedule.cliffDuration)
    const vesting = Number(schedule.vestingDuration)
    
    if (now < start) return 0
    if (now < start + cliff) return 0
    if (now >= start + cliff + vesting) return 100
    
    return ((now - start - cliff) / vesting) * 100
  }

  return {
    isEligible,
    vestingSchedule,
    vestedAmount,
    scheduleCreator,
    isCreatedByUser,
    scheduleExists,
    hasActiveSchedule,
    getVestingProgress,
    isSepolia,
    isBaseSepolia
  }
} 