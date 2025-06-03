import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { sepolia, baseSepolia } from 'viem/chains'
import { contracts } from '@/config/wagmi'

export function useToken() {
  const { chainId } = useAccount()
  const isSepolia = chainId === sepolia.id
  const isBaseSepolia = chainId === baseSepolia.id

  // Get all tokens that have schedules (Base Sepolia network)
  const { data: allScheduleTokens } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    abi: contracts.tokenVestingKernel.abi,
    functionName: 'getAllTokens',
    chainId: baseSepolia.id,
    query: {
      enabled: true,
    },
  })

  const [allTokensWithSchedules, setAllTokensWithSchedules] = useState<string[]>([])

  useEffect(() => {
    if (allScheduleTokens) {
      const tokens = allScheduleTokens as string[]
      setAllTokensWithSchedules(tokens)
    }
  }, [allScheduleTokens])

  // Get token symbol for display
  const getTokenSymbol = (tokenAddress: string) => {
    if (tokenAddress === contracts.vestedToken.address) return 'VEST'
    return 'TOKEN'
  }

  // Use schedule tokens and VEST token as unique tokens
  const allUniqueTokens = Array.from(new Set([
    contracts.vestedToken.address, // Always include VEST token
    ...allTokensWithSchedules
  ])).filter(token => token && token !== '')

  return {
    supportedTokens: allUniqueTokens, // For backward compatibility
    allTokensWithSchedules,
    allUniqueTokens,
    getTokenSymbol,
    isSepolia,
    isBaseSepolia
  }
}

// Hook for getting specific token data
export function useTokenData(tokenAddress: string) {
  const { address, chainId } = useAccount()
  const isSepolia = chainId === sepolia.id

  // Read user's deposits for specific token
  const { data: userDeposits } = useReadContract({
    address: contracts.tokenClaimContract.address,
    abi: contracts.tokenClaimContract.abi,
    functionName: 'getUserDeposits',
    args: [address!, tokenAddress as `0x${string}`],
    chainId: sepolia.id,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  })

  // Read user's claims for specific token
  const { data: userClaims, error: userClaimsError } = useReadContract({
    address: contracts.tokenClaimContract.address,
    abi: contracts.tokenClaimContract.abi,
    functionName: 'getUserClaims',
    args: [address!, tokenAddress as `0x${string}`],
    chainId: sepolia.id,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  })

  console.log("userClaims", userClaims, userClaimsError)

  // Read token balance - try to read for any ERC20 token
  const { data: tokenBalance, error, isFetching, isFetched } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: contracts.vestedToken.abi, // Using ERC20 standard ABI
    functionName: 'balanceOf',
    args: [address!],
    chainId: sepolia.id,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  })

  // Read token allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: contracts.vestedToken.abi, // Using ERC20 standard ABI
    functionName: 'allowance',
    args: [address!, contracts.tokenClaimContract.address],
    chainId: sepolia.id,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  })

  console.log("TokenData", {
    contracts,
    userDeposits,
    userClaims,
    address,
    tokenAddress,
    tokenBalance,
    allowance,
    isSepolia,
    error, 
    isFetching, 
    isFetched 
  })

  return {
    userDeposits,
    userClaims,
    tokenBalance,
    allowance,
    isSepolia,
  }
} 