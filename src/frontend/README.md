# Limited Donation dApp Frontend

A sleek, minimalist React frontend for the Limited Donation dApp that integrates with the Transaction Limit Kernel on Sepolia testnet.

## Features

- Connect wallet using MetaMask or other Web3 providers
- View token balance and donation history
- Make donations with the custom DonationToken
- Enforced daily donation limit of 100 tokens per user
- Modern UI with Tailwind CSS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example` and fill in the contract addresses:

```
VITE_DONATION_TOKEN_ADDRESS=0x...
VITE_LIMITED_DONATION_ADDRESS=0x...
```

3. Start the development server:

```bash
npm run dev
```

## Build for Production

```bash
npm run build
```

## Design

The UI is designed with a sleek, minimalist approach using:

- Tailwind CSS for styling
- Custom color palette with primary, secondary, and accent colors
- Responsive layout that works on mobile and desktop
- React Icons for visual elements
