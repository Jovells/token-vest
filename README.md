# TokenVest - KRNL Demo Platform

A comprehensive **KRNL integration demonstration** showcasing real-world kernel implementation for token vesting and claiming. This platform demonstrates how to build secure, cross-chain token distribution systems using KRNL's powerful kernel architecture.

> **🎯 Educational Purpose**: This platform serves as a practical example for developers learning KRNL integration patterns.

## 🌐 Live Demo

**✨ Try the live demo: [https://token-vest-tau.vercel.app](https://token-vest-tau.vercel.app)**

Experience the full KRNL integration in action:
- Create token vesting schedules on Base Sepolia
- Claim tokens on Sepolia with cross-chain verification
- See real-time KRNL kernel execution
- Test with demo tokens or your own ERC20s

> **Note**: You'll need MetaMask configured for both Sepolia and Base Sepolia testnet networks.

## 🚀 What is KRNL?

**KRNL** is a kernel operating system that enables secure, verifiable computation across blockchains. This demo platform showcases:

- **On-Chain Kernels**: TokenVestingKernel deployed on Base Sepolia for vesting logic
- **Cross-Chain Verification**: Secure claim verification across Sepolia and Base Sepolia
- **Real-World Implementation**: Production-ready KRNL integration patterns
- **Developer Education**: Clear examples of KRNL best practices

## ✨ KRNL Integration Highlights

### Core KRNL Implementation
```solidity
contract TokenClaimContract is KRNL {
    // CORRECT: KrnlPayload parameter comes first
    function claimTokens(
        KrnlPayload memory krnlPayload,
        address token,
        uint256 amount
    ) external onlyAuthorized(krnlPayload, abi.encode(token, amount)) {
        // Decode kernel responses
        KernelResponse[] memory responses = abi.decode(
            krnlPayload.kernelResponses, (KernelResponse[])
        );
        
        // Find vesting kernel response and verify eligibility
        for (uint i = 0; i < responses.length; i++) {
            if (responses[i].kernelId == VESTING_KERNEL_ID) {
                // Check for errors first
                if (bytes(responses[i].err).length > 0) {
                    revert("Kernel verification failed");
                }
                
                // Decode vested amount
                uint256 vestedAmount = abi.decode(responses[i].result, (uint256));
                // Process claim with kernel-verified amount
            }
        }
    }
}
```

### KRNL Architecture Benefits
- **Security**: All claims verified through KRNL kernels before execution
- **Cross-Chain**: Seamless data verification across multiple networks
- **Decentralization**: No central authority needed for vesting verification
- **Transparency**: All verification logic is on-chain and auditable

## 🏗️ Architecture Overview

### Network Distribution (Cross-Chain)
| Network | Chain ID | Purpose | Contracts |
|---------|----------|---------|-----------|
| **Base Sepolia** | 84532 | Vesting Management | TokenVestingKernel (KRNL Kernel) |
| **Sepolia** | 11155111 | Token Operations | TokenClaimContract, VestedToken |

### KRNL Flow
```
1. Admin creates vesting schedule → Base Sepolia (TokenVestingKernel)
2. User initiates claim → Sepolia (TokenClaimContract)  
3. KRNL verifies eligibility → Cross-chain kernel verification
4. Tokens transferred → Sepolia (if verification passes)
```

### Smart Contract Architecture

#### TokenVestingKernel.sol (Base Sepolia) - The KRNL Kernel
```solidity
contract TokenVestingKernel {
    struct VestingSchedule {
        uint256 totalAmount;      // Total tokens to vest per user
        uint256 startTime;        // Vesting start timestamp  
        uint256 cliffDuration;    // Cliff period in seconds
        uint256 vestingDuration;  // Total vesting duration
        bool isActive;            // Schedule status
        address creator;          // Schedule creator
        address[] eligibleAddresses; // Eligible users list
    }
    
    // One vesting schedule per token (simplified architecture)
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(address => mapping(address => bool)) public isEligible;
    
    // Main kernel function - called by KRNL for verification
    function getVestedAmount(address token, address user) 
        public view returns (uint256) {
        // Returns vested amount for KRNL verification
        // Checks eligibility and calculates based on time
    }
}
```

#### TokenClaimContract.sol (Sepolia) - KRNL Integration
```solidity
contract TokenClaimContract is KRNL, ReentrancyGuard {
    // KRNL integration with proper parameter encoding
    function claimTokens(
        KrnlPayload memory krnlPayload,  // MUST be first parameter
        address token,
        uint256 amount
    ) external onlyAuthorized(krnlPayload, abi.encode(token, amount)) {
        // KRNL handles all verification automatically
        // Contract can trust the kernel responses
    }
    
    // Multi-token support with comprehensive tracking
    mapping(address => mapping(address => uint256)) public userDeposits;
    mapping(address => mapping(address => uint256)) public userClaims;
}
```

### Frontend KRNL Integration
```typescript
// KRNL SDK integration for frontend
import { ethers } from 'krnl-sdk'

// Execute kernel verification before contract call
const { krnlPayload } = await executeKernel(token, user, amount)

// Call contract with KRNL payload
await claimContract.claimTokens(krnlPayload, token, amount)
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **MetaMask** configured for Sepolia and Base Sepolia
- **Test ETH** on both networks
- **KRNL Platform Account** - [Sign up here](https://app.platform.krnl.xyz)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd token-vesting-kernel
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd src/frontend && npm install && cd ../..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your KRNL credentials and RPC URLs
   ```

### KRNL Configuration

Create your KRNL configuration in `.env`:

```bash
# KRNL Platform Configuration (Required)
TOKEN_AUTHORITY_PUBLIC_KEY=0x...  # From KRNL platform
VESTING_KERNEL_ID=123             # Your registered kernel ID

# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# API Keys for Contract Verification  
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
```

Frontend KRNL configuration in `src/frontend/.env`:

```bash
# KRNL Integration (Required for frontend)
VITE_KRNL_ENTRY_ID=your_entry_id
VITE_KRNL_ACCESS_TOKEN=your_access_token  
VITE_VESTING_KERNEL_ID=123
VITE_TOKEN_AUTHORITY_PUBLIC_KEY=0x...

# Contract Addresses (After deployment)
VITE_VESTED_TOKEN_ADDRESS=0x...
VITE_TOKEN_CLAIM_CONTRACT_ADDRESS=0x...
VITE_TOKEN_VESTING_KERNEL_ADDRESS=0x...
```

### Deployment (Cross-Chain)

1. **Compile contracts**
   ```bash
   npm run compile
   ```

2. **Deploy TokenVestingKernel to Base Sepolia**
   ```bash
   npm run deploy:vesting-kernel
   # Note the deployed address for frontend config
   ```

3. **Deploy token contracts to Sepolia**
   ```bash
   npm run deploy:vested-token
   npm run deploy:claim-contract
   ```

4. **Verify contracts**
   ```bash
   npm run verify:all
   ```

5. **Generate ABIs for frontend**
   ```bash
   npm run generate:abis
   ```

6. **Start the frontend**
   ```bash
   npm run frontend
   ```

## 📖 KRNL Integration Guide

### For Developers Learning KRNL

This platform demonstrates key KRNL concepts:

#### 1. Kernel Registration Pattern
Follow the KRNL development pattern:
- Deploy your kernel contract (TokenVestingKernel)
- Register it with KRNL platform
- Configure Token Authority

#### 2. Smart Contract Integration
```solidity
// Always inherit from KRNL base contract
contract TokenClaimContract is KRNL {
    constructor(address _tokenAuthorityPublicKey) KRNL(_tokenAuthorityPublicKey) {
        // Initialize with your Token Authority
    }
    
    // Protected functions use onlyAuthorized modifier
    function claimTokens(
        KrnlPayload memory krnlPayload,  // ALWAYS first parameter
        address token,
        uint256 amount
    ) external onlyAuthorized(krnlPayload, abi.encode(token, amount)) {
        // Your protected logic here
    }
}
```

#### 3. Frontend KRNL SDK Usage
```typescript
// Execute kernel before contract interaction
const kernelRequestData = {
    senderAddress: userAddress,
    kernelPayload: {
        [VESTING_KERNEL_ID]: {
            functionParams: encodedParams
        }
    }
}

const krnlPayload = await provider.executeKernels(
    ENTRY_ID, 
    ACCESS_TOKEN, 
    kernelRequestData, 
    functionParams
)

// Use payload in contract call
await contract.claimTokens(krnlPayload, token, amount)
```

### Learning Resources

- **KRNL Documentation**: [docs.krnl.xyz](https://docs.krnl.xyz)
- **Platform Registration**: [app.platform.krnl.xyz](https://app.platform.krnl.xyz)

## 🎯 Demo Platform Features

### Token Claims
- **Cross-Chain Verification**: Claims verified through KRNL kernels on Base Sepolia
- **Real-Time Eligibility**: Instant kernel-based eligibility verification
- **Secure Process**: Multi-step KRNL verification before token transfer
- **User Experience**: Prominent interface highlighting KRNL integration
- **Chain Switching**: Automatic network switching with user-friendly prompts

### Token Management
- **Deposit Operations**: Deposit tokens to make them available for claims (Sepolia)
- **Withdraw Operations**: Remove deposited tokens from the claim pool (Sepolia)
- **Balance Tracking**: Real-time tracking of deposits and claims

### Admin Features (Base Sepolia)
- **Schedule Creation**: Create vesting schedules on Base Sepolia using KRNL kernels
- **Template System**: Quick templates for common vesting patterns
- **Chain Switching**: Automatic prompts to switch to Base Sepolia for admin operations
- **Multi-token Support**: Manage schedules for any ERC20 token
- **Real-time Monitoring**: Live schedule tracking across chains

### KRNL Integration Showcase
- **Kernel-Verified Claims**: Primary feature showcasing KRNL's cross-chain capabilities
- **Secure Architecture**: Proper KRNL integration patterns and best practices
- **Error Handling**: Comprehensive kernel error handling examples
- **Performance**: Efficient kernel execution and response processing
- **Network Management**: Smart chain switching for optimal user experience

## 🔧 Development

### Available Scripts

```bash
# Contract Development
npm run compile                    # Compile contracts
npm run deploy:vesting-kernel     # Deploy kernel to Base Sepolia  
npm run deploy:vested-token       # Deploy token to Sepolia
npm run deploy:claim-contract     # Deploy claim contract to Sepolia
npm run verify:all                # Verify all contracts

# Frontend Development
npm run generate:abis             # Generate TypeScript ABIs
npm run frontend                  # Start development server (Vite)

# Testing
npm test                          # Run contract tests
npm run test:frontend            # Run frontend tests
```

### Project Structure

```
├── src/contracts/              # Smart contracts
│   ├── TokenVestingKernel.sol  # KRNL kernel (Base Sepolia)
│   ├── TokenClaimContract.sol  # KRNL integration (Sepolia)
│   ├── VestedToken.sol         # Demo ERC20 (Sepolia)
│   └── KRNL.sol               # KRNL base contract
├── src/frontend/               # React + KRNL SDK
│   ├── src/hooks/             # KRNL integration hooks
│   ├── src/components/        # UI components
│   │   ├── user/             # User components
│   │   │   ├── token-claim.tsx    # KRNL claim feature (main)
│   │   │   ├── token-operations.tsx # Deposit/withdraw
│   │   │   └── token-info.tsx     # Vesting information
│   │   └── admin/            # Admin components
│   └── src/config/           # KRNL and network config
├── scripts/                   # Deployment scripts
└── docs/                     # Documentation
```

## 🌟 Why This Demo Platform?

### For KRNL Developers
- **Real Implementation**: Production-ready KRNL integration patterns
- **Cross-Chain Example**: Practical multi-network KRNL usage with automatic chain switching
- **Best Practices**: Security patterns and error handling
- **Complete Stack**: Full-stack KRNL application example

### For dApp Builders  
- **KRNL SDK Integration**: Frontend integration with KRNL kernels
- **Multi-Chain UI**: User experience across multiple networks with seamless switching
- **Error Handling**: Comprehensive error management patterns
- **Modern Stack**: React + TypeScript + Tailwind + KRNL

### For Smart Contract Developers
- **KRNL Base Contract**: Proper inheritance and modifier usage
- **Kernel Response Handling**: Decoding and processing kernel responses  
- **Parameter Encoding**: Correct parameter encoding for KRNL authorization
- **Cross-Chain Architecture**: Designing for KRNL's cross-chain capabilities

## 🔗 Links & Resources

- **KRNL Platform**: [krnl.xyz](https://krnl.xyz)
- **KRNL Documentation**: [docs.krnl.xyz](https://docs.krnl.xyz)  
- **KRNL Workshop**: [Speed's Workshop](https://docs.krnl.xyz/workshop/speeds-workshop)
- **Created by**: [Jovells](https://linktr.ee/jovells)

## 📚 Additional Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Cross-chain deployment instructions
- [Developer Guide](./DEVELOPER_GUIDE.md) - KRNL integration development
- [Kernel Guide](./KERNEL_GUIDE.md) - TokenVestingKernel implementation
- [Claim Contract Guide](./CLAIM_CONTRACT_GUIDE.md) - KRNL integration patterns
- [FAQ](./FAQ.md) - Common KRNL integration questions

---

**Built with ❤️ by [Jovells](https://linktr.ee/jovells) • Powered by [KRNL](https://krnl.xyz)**

> 🎓 **Educational Note**: This platform demonstrates KRNL integration patterns for developers. Use it to learn kernel implementation, cross-chain verification, and secure dApp architecture with KRNL technology.