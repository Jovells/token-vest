import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

export function formatDate(timestamp: bigint) {
  return new Date(Number(timestamp) * 1000).toLocaleString()
}

export function calculateVestingProgress(schedule: any): number {
  if (!schedule || !schedule.isActive) return 0
  
  const now = Date.now() / 1000
  const start = Number(schedule.startTime)
  const cliff = Number(schedule.cliffDuration)
  const vesting = Number(schedule.vestingDuration)
  
  if (now < start) return 0
  if (now < start + cliff) return 0
  if (now >= start + cliff + vesting) return 100
  
  return ((now - start - cliff) / vesting) * 100
} 