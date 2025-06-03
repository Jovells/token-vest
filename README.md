# A Human-Friendly Guide to Building a KRNL-Powered Token Vesting Platform

## Introduction

Ready to dive into decentralized finance with a twist? In this tutorial, we'll build a **token vesting platform** powered by **KRNL**, a cutting-edge platform that makes cross-chain verification secure and seamless. By the end, you'll have a production-ready app that manages token vesting schedules on Base Sepolia and processes claims on Sepolia, all tied together with a modern React frontend.

Whether you're new to blockchain or a seasoned developer, we've got you covered with clear explanations, practical tips, and solutions to common pitfalls. Let's get started!

## Why KRNL?

KRNL is like a universal translator for blockchains. It allows smart contracts on one chain (like Base Sepolia) to verify data on another (like Sepolia) without manual intervention. This is done through **kernels**—specialized smart contracts that handle verification tasks. For our platform:
- **Decentralized Verification**: No central authority needed.
- **Cross-Chain Security**: Secure operations across networks.
- **Transparent Logic**: All verification is on-chain and auditable.
- **Flexibility**: Separates verification from execution for better security.

## What We're Building

We're creating a token vesting platform where:
- **Admins** set vesting schedules on Base Sepolia using `TokenVestingKernel`.
- **Users** claim tokens on Sepolia via `TokenClaimContract`, with KRNL verifying eligibility.
- A **React frontend** makes it easy to interact with the contracts.
- KRNL ensures secure cross-chain communication.

Here's the architecture in simple terms:

| Component             | Network       | Purpose                                   |
|-----------------------|---------------|-------------------------------------------|
| TokenVestingKernel   | Base Sepolia  | Manages vesting schedules                |
| TokenClaimContract   | Sepolia       | Handles token claims with KRNL verification |
| React Frontend        | Sepolia       | User interface with RainbowKit wallet connection |
| KRNL Platform        | Cross-Chain   | Verifies data across networks             |

## Technology Stack

- **Solidity**: Latest version for smart contracts
- **Hardhat**: Latest version for Solidity development environment  
- **OpenZeppelin**: For ERC20 token implementation and security best practices
- **React**: With Vite for frontend development
- **Tailwind CSS**: For styling the frontend
- **RainbowKit**: Modern wallet connection interface with multi-wallet support
- **Wagmi v2**: React hooks for Ethereum interactions
- **KRNL SDK**: For kernel integration with kOS

## Prerequisites

You'll need:
- Basic knowledge of **Solidity**, **React**, and blockchain concepts.
- **Node.js 18+** and npm.
- **MetaMask** configured for Sepolia and Base Sepolia testnets.
- A **KRNL Platform account** ([KRNL Platform](https://app.platform.krnl.xyz)).
- Test ETH for both testnets (get some from testnet faucets).
- API keys for Infura/Alchemy, Etherscan, and BaseScan.

**Pro Tip**: Secure your `.env` file, as it contains sensitive data like private keys.

## Part 1: Project Setup

Let's set up the project structure and environment.

1. **Initialize the Project**:
   ```bash
   mkdir krnl-vesting-platform
   cd krnl-vesting-platform
   npm init -y
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npm install @openzeppelin/contracts @oasisprotocol/sapphire-contracts
   npx hardhat init
   ```

2. **Configure Hardhat**:
   Create `hardhat.config.js` to support Sepolia and Base Sepolia:

   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   require("dotenv").config();

   module.exports = {
     solidity: "0.8.20",
     networks: {
       sepolia: {
         url: process.env.SEPOLIA_RPC_URL,
         accounts: [process.env.PRIVATE_KEY],
         chainId: 11155111
       },
       baseSepolia: {
         url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
         accounts: [process.env.PRIVATE_KEY],
         chainId: 84532
       }
     },
     etherscan: {
       apiKey: {
         sepolia: process.env.ETHERSCAN_API_KEY,
         baseSepolia: process.env.BASESCAN_API_KEY
       }
     }
   };
   ```

3. **Set Up Environment**:
   Create `.env` with your configuration:

   ```bash
   PRIVATE_KEY=your_private_key_here
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   ETHERSCAN_API_KEY=your_etherscan_api_key
   BASESCAN_API_KEY=your_basescan_api_key
   TOKEN_AUTHORITY_PUBLIC_KEY=your_token_authority_public_key
   VESTING_KERNEL_ID=1
   ```

**Common Pitfall**: Ensure your private key and API keys are correct. A wrong key can cause deployment failures.

## Part 2: Smart Contract Development

Let's build the core smart contracts. We'll focus on the key functions for KRNL integration.

### 2.1 TokenVestingKernel.sol (Base Sepolia)

This contract manages vesting schedules, acting like a schedule keeper for token releases.

**Key Function: `getVestedAmount`**

```solidity
function getVestedAmount(address token, address user) public view returns (uint256) {
    VestingSchedule memory schedule = vestingSchedules[token];
    if (!isEligible[token][user] || !schedule.isActive || block.timestamp < schedule.startTime) {
        return 0;
    }
    if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
        return 0;
    }
    uint256 timeElapsed = block.timestamp - (schedule.startTime + schedule.cliffDuration);
    if (timeElapsed >= schedule.vestingDuration) {
        return schedule.totalAmount;
    }
    return (schedule.totalAmount * timeElapsed) / schedule.vestingDuration;
}
```

**What It Does**:
- Checks if the user is eligible and the schedule is active.
- Returns 0 if the vesting hasn't started or is in the cliff period.
- Calculates the vested amount based on time elapsed since the cliff ended.

**Common Errors**:
- **Invalid Token/User**: Ensure `token` and `user` are valid addresses.
- **Inactive Schedule**: Verify the schedule is active and has a non-zero `totalAmount`.

**Pro Tip**: Test this function with different timestamps to ensure vesting calculations are correct.

### 2.2 TokenClaimContract.sol (Sepolia)

This contract handles token claims, with KRNL verifying eligibility.

**Key Function: `claimTokens`**

```solidity
function claimTokens(
    KrnlPayload memory krnlPayload,
    address token,
    uint256 amount
) external nonReentrant onlyAuthorized(krnlPayload, abi.encode(token, amount)) {
    require(token != address(0), "Invalid token address");
    require(amount > 0, "Amount must be greater than 0");
    
    KernelResponse[] memory responses = abi.decode(
        krnlPayload.kernelResponses, (KernelResponse[])
    );
    
    uint256 vestedAmount = 0;
    for (uint i = 0; i < responses.length; i++) {
        if (responses[i].kernelId == vestingKernelId) {
            if (bytes(responses[i].err).length > 0) {
                revert("Kernel error: Vesting verification failed");
            }
            vestedAmount = abi.decode(responses[i].result, (uint256));
            break;
        }
    }
    
    require(vestedAmount > 0, "No tokens vested yet");
    uint256 claimable = vestedAmount - userClaims[msg.sender][token];
    require(claimable >= amount, "Claiming more than vested");
    
    userClaims[msg.sender][token] += amount;
    totalClaims[token] += amount;
    IERC20(token).safeTransfer(msg.sender, amount);
}
```

**What It Does**:
- Takes a `KrnlPayload` (must be first parameter) for KRNL verification.
- Uses the `onlyAuthorized` modifier to ensure KRNL approves the transaction.
- Decodes kernel responses to get the vested amount from `getVestedAmount`.
- Checks if the requested `amount` is claimable and transfers tokens.

**Common Errors**:
- **Parameter Order**: `krnlPayload` must be the first parameter.
- **Encoding Mismatch**: `abi.encode(token, amount)` must match `claimTokens`'s signature (`address`, `uint256`).
- **Kernel Errors**: Always check `responses[i].err` to avoid processing invalid results.
- **Insufficient Balance**: Ensure the contract has enough tokens to transfer.

**Pro Tip**: Simulate the transaction using a tool like Hardhat to verify KRNL responses before executing.

## Part 3: Frontend Development

Let's build the React frontend to interact with our contracts, focusing on KRNL integration.

### 3.1 Setting Up the Frontend

```bash
mkdir src/frontend
cd src/frontend
npm create vite@latest . -- --template react-ts
npm install wagmi viem @tanstack/react-query krnl-sdk
npm install @radix-ui/react-* lucide-react tailwindcss sonner framer-motion class-variance-authority
```

### 3.2 Key Function: `executeKernel`

The `executeKernel` function is the core of KRNL integration in the frontend. It prepares data for KRNL and retrieves verified results.

```typescript
const executeKernel = async (token: string, user: string, amount: string) => {
    const parsedAmount = parseEther(amount);
    if (!address) throw "Address not found";
    
    const kernelParams = abiCoder.encode(["address", "address"], [token, user]);
    const functionParams = abiCoder.encode(["address", "uint256"], [token, parsedAmount]);
    
    const kernelRequestData = {
        senderAddress: address,
        kernelPayload: {
            [VESTING_KERNEL_ID]: { functionParams: kernelParams }
        }
    };
    
    const krnlPayload = await provider.executeKernels(
        KRNL_ENTRY_ID,
        KRNL_ACCESS_TOKEN,
        kernelRequestData,
        functionParams
    );
    
    return { krnlPayload };
}
```

**Step-by-Step Breakdown**:
1. **Parse Amount**: Converts the `amount` to a uint256 using `parseEther`.
2. **Encode Kernel Parameters**: Encodes `token` and `user` for `getVestedAmount` (`["address", "address"]`).
3. **Encode Function Parameters**: Encodes `token` and `parsedAmount` for `claimTokens` (`["address", "uint256"]`).
4. **Build Kernel Request**: Specifies the kernel ID and parameters.
5. **Execute Kernel**: Calls `executeKernels` with KRNL credentials and returns the payload.

**Common Errors**:
- **Encoding Issues**: Ensure `kernelParams` and `functionParams` match the function signatures exactly.
- **KRNL Credentials**: Verify `KRNL_ENTRY_ID` and `KRNL_ACCESS_TOKEN` in `.env`.
- **Network Mismatch**: Ensure the wallet is on Sepolia for claims.

**Known Issue**: TypeScript may warn about `functionParams` types in `kernelRequestData`. This is a known KRNL SDK bug; ignore it if your parameters are correctly encoded.

**Pro Tip**: Log `kernelParams` and `functionParams` to verify encoding. Use the KRNL platform logs to debug execution failures.

### 3.3 Environment Configuration

Create `src/frontend/.env`:

```bash
VITE_KRNL_ENTRY_ID=your_entry_id
VITE_KRNL_ACCESS_TOKEN=your_access_token
VITE_VESTING_KERNEL_ID=1
VITE_TOKEN_AUTHORITY_PUBLIC_KEY=0x...
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
VITE_VESTED_TOKEN_ADDRESS=0x...
VITE_TOKEN_CLAIM_CONTRACT_ADDRESS=0x...
VITE_TOKEN_VESTING_KERNEL_ADDRESS=0x...
```

## Part 4: KRNL Platform Integration

To use KRNL:
1. Deploy `TokenVestingKernel` to Base Sepolia (`npm run deploy:vesting-kernel`).
2. Register the kernel on [KRNL Platform](https://app.platform.krnl.xyz).
3. Configure the token authority.
4. Obtain `KRNL_ENTRY_ID` and `KRNL_ACCESS_TOKEN` for your `.env`.

**Testing Flow**:

| Step               | Action                                      | Expected Outcome                     |
|--------------------|---------------------------------------------|--------------------------------------|
| Deploy Contracts   | Run deployment scripts                      | Contracts deployed with addresses    |
| Register Kernel    | Use KRNL platform interface                 | Obtain entry ID and access token     |
| Test Frontend      | Start frontend, create schedule, claim tokens | Successful cross-chain verification  |

## Part 5: Key Learning Points

- **KRNL Best Practices**:
  - Place `KrnlPayload` first in protected functions.
  - Match parameter encoding to function signatures.
  - Always check kernel errors before processing results.
- **Cross-Chain Design**: Use Base Sepolia for verification and Sepolia for execution.
- **Common Errors**:
  - Incorrect parameter encoding causes "UnauthorizedTransaction" reverts.
  - Ensure correct network connectivity.
- **TypeScript Warning**: Ignore `functionParams` type warnings in `kernelRequestData` (KRNL SDK issue).

## Conclusion

You've built a secure, KRNL-powered token vesting platform! This project showcases decentralized verification and cross-chain functionality. Try extending it with governance or staking features, or explore more KRNL kernels.

**Resources**:
- [KRNL Documentation](https://docs.krnl.xyz)
- [KRNL Platform](https://app.platform.krnl.xyz)
- [Source Code](https://github.com/Jovells/token-vest.git)
- [Live Demo](https://token-vest-tau.vercel.app)

Happy building, and let KRNL unlock your Web3 potential!