# Transaction Limit Kernel & Limited Donation dApp

A project demonstrating the integration of a custom on-chain KRNL kernel with a donation dApp on the Base testnet.

## Project Overview

This project consists of two main components:

1. **Transaction Limit Kernel**: An Kernel that tracks a user's total token transactions within a 24-hour window, ensuring they don't exceed 100 tokens.

2. **Limited Donation dApp**: A web-based application allowing users to donate a custom ERC20 token ("DonationToken") to a charity pool, with the 100-token limit per user per 24 hours enforced by the Transaction Limit Kernel.

## Smart Contracts

- `TransactionLimitKernel.sol`: The on-chain kernel that implements the KRNL interface
- `DonationToken.sol`: A custom ERC20 token for donations
- `LimitedDonation.sol`: The main donation contract that integrates with the kernel using KRNLImpl
- `KRNL.sol`: Contains the interface and implementation for KRNL integration (KRNLImpl)

## Transaction Limit Mechanism

The transaction limit is enforced through a two-step process:

1. **Checking Limits**: The kernel verifies whether a transaction would exceed the user's daily limit (100 tokens per 24 hours).
2. **Recording Transactions**: After a successful donation, the LimitedDonation contract calls the kernel's `recordTransaction` function to update the user's daily total.

This approach ensures that users cannot bypass the limit by making multiple transactions, as each transaction is properly recorded and tracked in the kernel.

## KRNL Integration

The project follows the KRNL platform integration standard:
- All contracts needing kernel integration inherit from `KRNLImpl`
- Protected functions have the `KrnlPayload` parameter as the first argument
- Authorization is managed through the `onlyAuthorized` modifier
- Kernel responses are properly decoded as arrays and checked for errors

## Prerequisites

- Node.js and npm
- Hardhat
- MetaMask or another Ethereum wallet with BaseSeplia ETH
- KRNL CLI for kernel registration

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.env.example` and fill in:
- Your BaseSeplia RPC URL
- Your private key (for deployment)
- KRNL API key (for kernel registration)
- Token Authority Public Key (for KRNL authorization)
- Etherscan API key (for contract verification)

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Run Tests

```bash
npm test
```

### 5. Deploy the Kernel

```bash
npm run deploy:kernel
```

### 6. Register the Kernel with KRNL

After deploying the kernel, register it with KRNL using the CLI:

```bash
krnl register-kernel --address YOUR_KERNEL_ADDRESS --network BaseSeplia
```

Save the kernel ID returned by the CLI and update your `.env` file with:
- `TOKEN_AUTHORITY_PUBLIC_KEY`: The public key of the token authority 
- `TRANSACTION_LIMIT_KERNEL_ID`: The ID returned by the registration process
- `TRANSACTION_LIMIT_KERNEL_ADDRESS`: The address of the deployed kernel

### 7. Deploy the Donation Contracts

```bash
npm run deploy:donation
```

Update your `.env` file with the deployed contract addresses.

### 8. Verify Contracts on Etherscan

After deployment, verify your contracts to make them accessible and interactive on Etherscan:

```bash
# Verify the Transaction Limit Kernel
npm run verify:kernel

# Verify the Donation contracts
npm run verify:donation
```

Alternatively, you can use the built-in verification command directly:

```bash
npx hardhat verify --network BaseSeplia DEPLOYED_CONTRACT_ADDRESS [CONSTRUCTOR_ARGUMENTS]
```

For example:
```bash
# Verify TransactionLimitKernel
npx hardhat verify --network BaseSeplia KERNEL_ADDRESS

# Verify DonationToken
npx hardhat verify --network BaseSeplia TOKEN_ADDRESS "1000000000000000000000000"

# Verify LimitedDonation
npx hardhat verify --network BaseSeplia DONATION_ADDRESS TOKEN_AUTHORITY_KEY KERNEL_ID KERNEL_ADDRESS TOKEN_ADDRESS CHARITY_ADDRESS
```

### 9. Set Up the Frontend

Navigate to the frontend directory and install dependencies:

```bash
cd src/frontend
npm install
npm run dev
```

## Development & Testing

For testing purposes, the contracts include:
- `MockKRNLAuth.sol`: A mock implementation for testing authentication
- Test mode in `KRNLImpl` to bypass signature verification in tests

When deploying to production, ensure that test mode is disabled.

## Usage

1. Connect your wallet to the dApp
2. Get some DonationTokens (there will be a faucet in the UI)
3. Make donations to the charity pool
4. The Transaction Limit Kernel will enforce the 100-token per day limit

## License

MIT 