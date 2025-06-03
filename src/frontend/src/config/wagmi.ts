import { http } from 'viem';
import { sepolia, baseSepolia } from 'viem/chains';
import { createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Contract ABIs
import VestedTokenABI from '../abis/VestedToken';
import TokenClaimContractABI from '../abis/TokenClaimContract';
import TokenVestingKernelABI from '../abis/TokenVestingKernel';

// Contract addresses from environment variables
const VESTED_TOKEN_ADDRESS = import.meta.env.VITE_VESTED_TOKEN_ADDRESS as `0x${string}`;
const TOKEN_CLAIM_CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CLAIM_CONTRACT_ADDRESS as `0x${string}`;
const TOKEN_VESTING_KERNEL_ADDRESS = import.meta.env.VITE_TOKEN_VESTING_KERNEL_ADDRESS as `0x${string}`;

// RPC URLs
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || sepolia.rpcUrls.default.http[0];
const BASE_SEPOLIA_RPC_URL = baseSepolia.rpcUrls.default.http[0];

// Create wagmi config with both chains
export const config = createConfig({
  chains: [sepolia, baseSepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC_URL),
  },
});

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