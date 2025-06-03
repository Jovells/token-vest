import { http, createConfig } from 'wagmi';
import { sepolia, baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { injected } from 'wagmi/connectors';

// Contract ABIs
import VestedTokenABI from '../abis/VestedToken';
import TokenClaimContractABI from '../abis/TokenClaimContract';
import TokenVestingKernelABI from '../abis/TokenVestingKernel';

// Get environment variables
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || sepolia.rpcUrls.default.http[0];
const BASE_SEPOLIA_RPC_URL = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || baseSepolia.rpcUrls.default.http[0];

// RainbowKit configuration
export const config = getDefaultConfig({
  appName: 'KRNL Token Vesting Platform',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from WalletConnect Cloud
  chains: [sepolia, baseSepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC_URL),
  },
  ssr: false, // Disable SSR for Vite apps
});

// Fallback config if RainbowKit fails
export const fallbackConfig = createConfig({
  chains: [sepolia, baseSepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC_URL),
  },
});

// Contract addresses and ABIs
export const VESTED_TOKEN_ADDRESS = import.meta.env.VITE_VESTED_TOKEN_ADDRESS as `0x${string}`;
export const TOKEN_CLAIM_CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CLAIM_CONTRACT_ADDRESS as `0x${string}`;
export const TOKEN_VESTING_KERNEL_ADDRESS = import.meta.env.VITE_TOKEN_VESTING_KERNEL_ADDRESS as `0x${string}`;

// Contract configurations
export const contracts = {
  vestedToken: {
    address: VESTED_TOKEN_ADDRESS,
    abi: VestedTokenABI,
    chain: sepolia, // VestedToken is deployed on Sepolia
  },
  tokenClaimContract: {
    address: TOKEN_CLAIM_CONTRACT_ADDRESS,
    abi: TokenClaimContractABI,
    chain: sepolia, // TokenClaimContract is deployed on Sepolia
  },
  tokenVestingKernel: {
    address: TOKEN_VESTING_KERNEL_ADDRESS,
    abi: TokenVestingKernelABI,
    chain: baseSepolia, // TokenVestingKernel is deployed on Base Sepolia
  },
} as const;

// Network configuration
export const networks = {
  sepolia: {
    id: sepolia.id,
    name: sepolia.name,
    contracts: ['vestedToken', 'tokenClaimContract'],
  },
  baseSepolia: {
    id: baseSepolia.id,
    name: baseSepolia.name,
    contracts: ['tokenVestingKernel'],
  },
} as const; 