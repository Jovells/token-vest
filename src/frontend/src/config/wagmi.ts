import { http } from 'viem';
import { sepolia } from 'viem/chains';
import { createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Contract ABIs
import DonationTokenABI from '../abis/DonationToken';
import LimitedDonationABI from '../abis/LimitedDonation';

// Contract addresses from environment variables
const DONATION_TOKEN_ADDRESS = import.meta.env.VITE_DONATION_TOKEN_ADDRESS as `0x${string}`;
const LIMITED_DONATION_ADDRESS = import.meta.env.VITE_LIMITED_DONATION_ADDRESS as `0x${string}`;

// Create wagmi config
export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(sepolia.rpcUrls.default.http[0]),
  },
});

// Contract configurations
export const contracts = {
  donationToken: {
    address: DONATION_TOKEN_ADDRESS,
    abi: DonationTokenABI,
  },
  limitedDonation: {
    address: LIMITED_DONATION_ADDRESS,
    abi: LimitedDonationABI,
  },
} as const; 