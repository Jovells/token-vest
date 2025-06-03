# Building a KRNL-Powered Token Vesting Platform: Complete Tutorial

## Overview

This comprehensive tutorial will guide you through building a production-ready **KRNL-powered token vesting platform**. You'll learn how to implement KRNL kernels, integrate cross-chain verification, and create a modern React frontend that leverages KRNL's powerful capabilities.

> **🎯 Learning Goal**: Master KRNL integration patterns by building a real-world application with complete full-stack implementation.

## What We're Building

### KRNL Architecture
- **TokenVestingKernel**: On-chain KRNL kernel on Base Sepolia
- **TokenClaimContract**: KRNL-integrated claiming contract on Sepolia  
- **Cross-Chain Verification**: Secure vesting verification across networks
- **React Frontend**: Modern UI with KRNL SDK integration

### Why KRNL?
- **Decentralized Verification**: No central authority needed
- **Cross-Chain Security**: Secure operations across multiple networks
- **Transparent Logic**: All verification logic is on-chain and auditable
- **Production Ready**: Industrial-strength security patterns

## Prerequisites

### Knowledge Requirements
- Basic Solidity and React knowledge
- Understanding of blockchain concepts
- Familiarity with TypeScript (recommended)

### Technical Setup
- **Node.js 18+** and npm
- **MetaMask** configured for testnets
- **KRNL Platform Account** - [Sign up here](https://app.platform.krnl.xyz)
- **Test ETH** on Sepolia and Base Sepolia

### Required API Keys
- Infura/Alchemy project ID
- Etherscan API key
- BaseScan API key

## Part 1: Understanding KRNL Integration

### KRNL Concepts

**KRNL** (Kernel) is a decentralized operating system that enables secure, verifiable computation across blockchains. Key concepts:

1. **Kernels**: On-chain smart contracts that perform verification logic
2. **Token Authority**: KRNL's verification mechanism for kernel responses
3. **Cross-Chain Verification**: Secure data reading across multiple networks
4. **Kernel Responses**: Verified results from kernel execution

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Claim Contract │    │  Vesting Kernel │
│   (Sepolia)     │◄──►│   (Sepolia)     │◄──►│ (Base Sepolia)  │
│   KRNL SDK      │    │   KRNL Base     │    │   Pure Logic    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              ▲
                              │
                       ┌──────▼──────┐
                       │    KRNL     │
                       │  Platform   │
                       │(Cross-Chain)│
                       └─────────────┘
```

## Part 2: Project Setup

### 1. Initialize Project Structure

```bash
mkdir krnl-vesting-platform
cd krnl-vesting-platform

# Initialize package.json
npm init -y

# Install Hardhat and core dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts @oasisprotocol/sapphire-contracts

# Initialize Hardhat
npx hardhat init
```

### 2. Configure Multi-Network Hardhat

Create `hardhat.config.js` for cross-chain deployment:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
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
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};
```

### 3. Environment Configuration

Create `.env` with KRNL configuration:

```bash
# Private Keys
PRIVATE_KEY=your_private_key_here

# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# API Keys for Verification
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key

# KRNL Configuration (Get from platform.krnl.xyz)
TOKEN_AUTHORITY_PUBLIC_KEY=your_token_authority_public_key
VESTING_KERNEL_ID=1
```

## Part 3: Smart Contract Development

### 1. KRNL Base Contract

Create `contracts/KRNL.sol` - the foundation for KRNL integration:

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// KRNL payload structure
struct KrnlPayload {
    bytes auth;
    bytes kernelResponses;
    bytes kernelParams;
}

struct KernelParameter {
    uint8 resolverType;
    bytes parameters;
    string err;
}

struct KernelResponse {
    uint256 kernelId;
    bytes result;
    string err;
}

/**
 * @title KRNL Base Contract
 * @dev Base contract for KRNL integration
 * @notice All KRNL-integrated contracts must inherit from this
 */
contract KRNL is Ownable {
    error UnauthorizedTransaction();

    address public tokenAuthorityPublicKey;
    mapping(bytes => bool) public executed;

    /**
     * @dev Modifier to protect functions with KRNL verification
     * @param krnlPayload The KRNL payload containing verification data
     * @param params The function parameters to verify
     */
    modifier onlyAuthorized(
        KrnlPayload memory krnlPayload,
        bytes memory params
    ) {
        if (!_isAuthorized(krnlPayload, params)) {
            revert UnauthorizedTransaction();
        }
        _;
    }

    constructor(address _tokenAuthorityPublicKey) Ownable(msg.sender) {
        tokenAuthorityPublicKey = _tokenAuthorityPublicKey;
    }

    function setTokenAuthorityPublicKey(
        address _tokenAuthorityPublicKey
    ) external onlyOwner {
        tokenAuthorityPublicKey = _tokenAuthorityPublicKey;
    }

    /**
     * @dev Internal function to verify KRNL authorization
     * @param payload The KRNL payload
     * @param functionParams The encoded function parameters
     * @return True if authorized
     */
    function _isAuthorized(
        KrnlPayload memory payload,
        bytes memory functionParams
    ) internal view returns (bool) {
        (
            bytes memory kernelResponseSignature,
            bytes32 kernelParamObjectDigest,
            bytes memory signatureToken,
            uint256 nonce,
            bool finalOpinion
        ) = abi.decode(
                payload.auth,
                (bytes, bytes32, bytes, uint256, bool)
            );

        if (finalOpinion == false) {
            revert("Final opinion reverted");
        }

        bytes32 kernelResponsesDigest = keccak256(
            abi.encodePacked(payload.kernelResponses, msg.sender)
        );

        address recoveredAddress = ECDSA.recover(
            kernelResponsesDigest,
            kernelResponseSignature
        );

        if (recoveredAddress != tokenAuthorityPublicKey) {
            revert("Invalid signature for kernel responses");
        }

        bytes32 _kernelParamsDigest = keccak256(
            abi.encodePacked(payload.kernelParams, msg.sender)
        );

        bytes32 functionParamsDigest = keccak256(functionParams);

        if (_kernelParamsDigest != kernelParamObjectDigest) {
            revert("Invalid kernel params digest");
        }

        bytes32 dataDigest = keccak256(
            abi.encodePacked(
                functionParamsDigest,
                kernelParamObjectDigest,
                msg.sender,
                nonce,
                finalOpinion
            )
        );

        recoveredAddress = ECDSA.recover(dataDigest, signatureToken);
        if (recoveredAddress != tokenAuthorityPublicKey) {
            revert("Invalid signature for function call");
        }

        return true;
    }
}
```

### 2. TokenVestingKernel (Base Sepolia)

Create `contracts/TokenVestingKernel.sol` - the KRNL kernel:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TokenVestingKernel
 * @notice KRNL kernel for managing token vesting schedules
 * @dev This contract serves as the verification source for KRNL
 */
contract TokenVestingKernel {
    struct VestingSchedule {
        uint256 totalAmount;      // Total tokens to vest per user
        uint256 startTime;        // Vesting start timestamp
        uint256 cliffDuration;    // Cliff period in seconds
        uint256 vestingDuration;  // Total vesting duration
        bool isActive;            // Schedule status
        address creator;          // Schedule creator
        address[] eligibleAddresses; // Eligible users
    }

    // One vesting schedule per token address
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(address => mapping(address => bool)) public isEligible;
    address[] public tokensWithSchedules;
    mapping(address => bool) public tokenExists;

    event VestingScheduleCreated(
        address indexed token,
        address indexed creator,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        address[] eligibleAddresses
    );

    /**
     * @notice Create vesting schedule for a token
     * @dev This is called by admins to set up vesting
     * @param token The ERC20 token address
     * @param totalAmount Total tokens to vest per user
     * @param startTime When vesting begins
     * @param cliffDuration Cliff period in seconds
     * @param vestingDuration Total vesting duration
     * @param eligibleAddresses Array of eligible addresses
     */
    function setVestingSchedule(
        address token,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        address[] calldata eligibleAddresses
    ) external {
        require(token != address(0), "Invalid token address");
        require(totalAmount > 0, "Total amount must be greater than 0");
        require(vestingDuration > 0, "Vesting duration must be greater than 0");
        require(eligibleAddresses.length > 0, "Must provide eligible addresses");

        VestingSchedule storage schedule = vestingSchedules[token];
        
        // Clear existing eligible addresses
        if (schedule.isActive) {
            for (uint256 i = 0; i < schedule.eligibleAddresses.length; i++) {
                isEligible[token][schedule.eligibleAddresses[i]] = false;
            }
            delete schedule.eligibleAddresses;
        }
        
        // Add to enumeration if new
        if (!schedule.isActive && !tokenExists[token]) {
            tokensWithSchedules.push(token);
            tokenExists[token] = true;
        }
        
        // Update schedule
        schedule.totalAmount = totalAmount;
        schedule.startTime = startTime;
        schedule.cliffDuration = cliffDuration;
        schedule.vestingDuration = vestingDuration;
        schedule.isActive = true;
        schedule.creator = msg.sender;
        
        // Set eligible addresses
        for (uint256 i = 0; i < eligibleAddresses.length; i++) {
            schedule.eligibleAddresses.push(eligibleAddresses[i]);
            isEligible[token][eligibleAddresses[i]] = true;
        }

        emit VestingScheduleCreated(
            token, 
            msg.sender, 
            totalAmount, 
            startTime, 
            cliffDuration, 
            vestingDuration, 
            eligibleAddresses
        );
    }

    /**
     * @notice Get vested amount for a user
     * @dev This is the main function called by KRNL for verification
     * @param token The token address
     * @param user The user address
     * @return The amount vested at current timestamp
     */
    function getVestedAmount(address token, address user) 
        public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[token];
        
        // Check eligibility first
        if (!isEligible[token][user]) {
            return 0;
        }
        
        if (!schedule.isActive || schedule.totalAmount == 0) {
            return 0;
        }

        // Before start time
        if (block.timestamp < schedule.startTime) {
            return 0;
        }

        // During cliff period
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        // Calculate time elapsed since cliff ended
        uint256 timeElapsed = block.timestamp - (schedule.startTime + schedule.cliffDuration);
        
        // If vesting complete
        if (timeElapsed >= schedule.vestingDuration) {
            return schedule.totalAmount;
        }

        // Calculate proportional vested amount
        return (schedule.totalAmount * timeElapsed) / schedule.vestingDuration;
    }

    /**
     * @notice Get complete vesting schedule
     * @param token The token address
     * @return The vesting schedule struct
     */
    function getVestingSchedule(address token) 
        external view returns (VestingSchedule memory) {
        return vestingSchedules[token];
    }

    /**
     * @notice Check if address is eligible for vesting
     * @param token The token address
     * @param user The user address
     * @return True if eligible
     */
    function isAddressEligible(address token, address user) 
        external view returns (bool) {
        return isEligible[token][user];
    }
}
```

### 3. TokenClaimContract (Sepolia) - KRNL Integration

Create `contracts/TokenClaimContract.sol` - the KRNL-integrated contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {KRNL, KrnlPayload, KernelResponse} from "./KRNL.sol";

/**
 * @title TokenClaimContract
 * @notice KRNL-integrated contract for claiming vested tokens
 * @dev Demonstrates proper KRNL integration patterns
 */
contract TokenClaimContract is KRNL, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // The ID of the vesting kernel in KRNL registry
    uint256 public vestingKernelId;
    
    // Multi-token tracking
    mapping(address => mapping(address => uint256)) public userDeposits;
    mapping(address => mapping(address => uint256)) public userClaims;
    mapping(address => uint256) public totalDeposits;
    mapping(address => uint256) public totalClaims;
    
    // Token enumeration
    address[] private _tokensWithDeposits;
    mapping(address => bool) private _tokenExists;
    
    event TokensDeposited(address indexed depositor, address indexed token, uint256 amount);
    event TokensClaimed(address indexed claimer, address indexed token, uint256 amount);
    event TokensWithdrawn(address indexed withdrawer, address indexed token, uint256 amount);

    /**
     * @dev Constructor initializes KRNL integration
     * @param _tokenAuthorityPublicKey KRNL token authority address
     * @param _vestingKernelId ID of the vesting kernel
     */
    constructor(
        address _tokenAuthorityPublicKey,
        uint256 _vestingKernelId
    ) KRNL(_tokenAuthorityPublicKey) {
        vestingKernelId = _vestingKernelId;
    }
    
    /**
     * @notice Deposit tokens for vesting distribution
     * @param token Token address
     * @param amount Amount to deposit
     */
    function depositTokens(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(tokenContract.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        
        // Add to enumeration if new
        if (!_tokenExists[token]) {
            _tokensWithDeposits.push(token);
            _tokenExists[token] = true;
        }
        
        // Transfer tokens
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update tracking
        userDeposits[msg.sender][token] += amount;
        totalDeposits[token] += amount;
        
        emit TokensDeposited(msg.sender, token, amount);
    }
    
    /**
     * @notice Claim vested tokens with KRNL verification
     * @dev This is the core KRNL integration function
     * @param krnlPayload KRNL payload for authorization (MUST be first parameter)
     * @param token Token address to claim
     * @param amount Amount to claim
     */
    function claimTokens(
        KrnlPayload memory krnlPayload,  // CRITICAL: Must be first parameter
        address token,
        uint256 amount
    ) external 
      nonReentrant
      onlyAuthorized(krnlPayload, abi.encode(token, amount))  // Parameter encoding must match exactly
    {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalDeposits[token] > 0, "No deposits for this token");
        
        // KRNL Integration: Decode kernel responses
        KernelResponse[] memory kernelResponses = abi.decode(
            krnlPayload.kernelResponses, 
            (KernelResponse[])
        );
        
        uint256 vestedAmount = 0;
        
        // Find our vesting kernel response
        for (uint i = 0; i < kernelResponses.length; i++) {
            if (kernelResponses[i].kernelId == vestingKernelId) {
                // IMPORTANT: Check for errors first
                if (bytes(kernelResponses[i].err).length > 0) {
                    revert("Kernel error: Vesting verification failed");
                }
                
                // Decode the verified vested amount
                vestedAmount = abi.decode(kernelResponses[i].result, (uint256));
                break;
            }
        }
        
        require(vestedAmount > 0, "No tokens vested yet");
        
        // Calculate claimable amount
        uint256 alreadyClaimed = userClaims[msg.sender][token];
        uint256 claimable = vestedAmount > alreadyClaimed ? 
                           vestedAmount - alreadyClaimed : 0;
        
        require(claimable >= amount, "Claiming more than vested");
        
        // Verify contract has enough tokens
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        // Update state
        userClaims[msg.sender][token] += amount;
        totalClaims[token] += amount;
        
        // Transfer tokens
        tokenContract.safeTransfer(msg.sender, amount);
        
        emit TokensClaimed(msg.sender, token, amount);
    }
    
    /**
     * @notice Withdraw deposited tokens (only depositor)
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function withdrawTokens(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(userDeposits[msg.sender][token] >= amount, "Insufficient deposits");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        // Update state
        userDeposits[msg.sender][token] -= amount;
        totalDeposits[token] -= amount;
        
        // Transfer tokens
        tokenContract.safeTransfer(msg.sender, amount);
        
        emit TokensWithdrawn(msg.sender, token, amount);
    }

    // View functions for frontend integration
    function getUserClaims(address user, address token) external view returns (uint256) {
        return userClaims[user][token];
    }
    
    function getUserDeposits(address user, address token) external view returns (uint256) {
        return userDeposits[user][token];
    }
    
    function getContractBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
```

### 4. Demo ERC20 Token

Create `contracts/VestedToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VestedToken
 * @notice Demo ERC20 token for testing KRNL integration
 */
contract VestedToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    constructor(uint256 initialSupply) ERC20("VestedToken", "VEST") Ownable(msg.sender) {
        require(initialSupply <= MAX_SUPPLY, "Exceeds max supply");
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    // Demo function for easy testing
    function mintDemo(uint256 amount) external {
        require(amount <= 1000 * 10**18, "Demo limited to 1000 tokens");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(msg.sender, amount);
    }
}
```

## Part 4: Deployment Scripts

### 1. Deploy TokenVestingKernel (Base Sepolia)

Create `scripts/deploy-vesting-kernel.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying TokenVestingKernel to Base Sepolia...");
  
  const TokenVestingKernel = await hre.ethers.getContractFactory("TokenVestingKernel");
  const kernel = await TokenVestingKernel.deploy();
  
  await kernel.waitForDeployment();
  const address = await kernel.getAddress();
  
  console.log("TokenVestingKernel deployed to:", address);
  
  // Save address for frontend
  const fs = require('fs');
  const deployments = {
    tokenVestingKernel: address,
    network: "baseSepolia",
    chainId: 84532
  };
  
  fs.writeFileSync(
    'deployments-base-sepolia.json', 
    JSON.stringify(deployments, null, 2)
  );
  
  console.log("Deployment info saved to deployments-base-sepolia.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 2. Deploy Token Contracts (Sepolia)

Create `scripts/deploy-sepolia-contracts.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to Sepolia...");
  
  // Deploy VestedToken
  const VestedToken = await hre.ethers.getContractFactory("VestedToken");
  const token = await VestedToken.deploy(hre.ethers.parseEther("1000000")); // 1M initial supply
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("VestedToken deployed to:", tokenAddress);
  
  // Deploy TokenClaimContract
  const TokenClaimContract = await hre.ethers.getContractFactory("TokenClaimContract");
  const claimContract = await TokenClaimContract.deploy(
    process.env.TOKEN_AUTHORITY_PUBLIC_KEY,
    process.env.VESTING_KERNEL_ID || 1
  );
  await claimContract.waitForDeployment();
  const claimAddress = await claimContract.getAddress();
  console.log("TokenClaimContract deployed to:", claimAddress);
  
  // Save deployment info
  const fs = require('fs');
  const deployments = {
    vestedToken: tokenAddress,
    tokenClaimContract: claimAddress,
    network: "sepolia",
    chainId: 11155111
  };
  
  fs.writeFileSync(
    'deployments-sepolia.json', 
    JSON.stringify(deployments, null, 2)
  );
  
  console.log("Deployment info saved to deployments-sepolia.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Part 5: Frontend Development

### 1. React + Vite Setup

```bash
# Create frontend
mkdir src/frontend
cd src/frontend
npm create vite@latest . -- --template react-ts
npm install

# Install Web3 and KRNL dependencies
npm install wagmi viem @tanstack/react-query krnl-sdk
npm install @radix-ui/react-* lucide-react tailwindcss

# Install additional UI dependencies
npm install sonner framer-motion class-variance-authority
```

### 2. KRNL Hook Implementation

Create `src/frontend/src/hooks/useContractOperations.ts`:

```typescript
import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { ethers } from 'krnl-sdk'
import { toast } from 'sonner'

// KRNL configuration
const KRNL_ENTRY_ID = import.meta.env.VITE_KRNL_ENTRY_ID
const KRNL_ACCESS_TOKEN = import.meta.env.VITE_KRNL_ACCESS_TOKEN
const VESTING_KERNEL_ID = import.meta.env.VITE_VESTING_KERNEL_ID

export function useContractOperations() {
  const [isExecutingKernel, setIsExecutingKernel] = useState(false)
  const { address } = useAccount()

  const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL)
  const abiCoder = new ethers.AbiCoder()

  /**
   * Execute KRNL kernel for vesting verification
   * This is the core KRNL integration function
   */
  const executeKernel = async (token: string, user: string, amount: string) => {
    const parsedAmount = parseEther(amount)
    if (!address) throw "Address not found"
    
    setIsExecutingKernel(true)
    try {
      // KRNL parameter encoding - matches kernel function signature
      const kernelParams = abiCoder.encode(["address", "address"], [token, user])
      const functionParams = abiCoder.encode(["address", "uint256"], [token, parsedAmount])
      
      // KRNL request structure
      const kernelRequestData = {
        senderAddress: address,
        kernelPayload: {
          [VESTING_KERNEL_ID]: {
            functionParams: kernelParams
          }
        }
      }
      
      console.log('Executing KRNL kernel with:', {
        kernelParams: { token, user },
        functionParams: { token, amount: parsedAmount.toString() },
        VESTING_KERNEL_ID
      })
      
      // Execute kernel through KRNL SDK
      // @ts-expect-error - KRNL SDK type definitions
      const krnlPayload = await provider.executeKernels(
        KRNL_ENTRY_ID, 
        KRNL_ACCESS_TOKEN, 
        kernelRequestData, 
        functionParams
      )
      
      console.log('KRNL kernel execution successful')
      return { krnlPayload }
    } catch (err) {
      console.error('KRNL kernel execution error:', err)
      throw err
    } finally {
      setIsExecutingKernel(false)
    }
  }

  /**
   * Claim tokens with KRNL verification
   * Demonstrates full KRNL integration flow
   */
  const claimTokens = async (
    selectedToken: string, 
    amount: string, 
    isEligible: boolean, 
    isSepolia: boolean
  ) => {
    if (!isSepolia || !selectedToken || !amount) {
      throw new Error('Please connect to Sepolia network, select a token and enter claim amount')
    }

    if (!isEligible) {
      throw new Error('You are not eligible to claim tokens for this vesting schedule')
    }

    const parsedAmount = parseEther(amount)

    try {
      // Step 1: Execute KRNL kernel for verification
      toast.loading('Verifying eligibility with KRNL...', { id: 'verify-kernel' })
      const { krnlPayload } = await executeKernel(selectedToken, address!, amount)
      if (!krnlPayload) {
        throw new Error('Failed to get KRNL payload')
      }
      toast.dismiss('verify-kernel')

      // Step 2: Simulate contract call first
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(sepolia.rpcUrls.default.http[0])
      })

      const args = [{
        auth: krnlPayload.auth as `0x${string}`,
        kernelResponses: krnlPayload.kernel_responses as `0x${string}`,
        kernelParams: krnlPayload.kernel_params as `0x${string}`
      }, selectedToken as `0x${string}`, parsedAmount] as const

      await publicClient.simulateContract({
        address: contracts.tokenClaimContract.address,
        abi: contracts.tokenClaimContract.abi,
        functionName: 'claimTokens',
        account: address,
        args
      })

      // Step 3: Execute actual claim
      toast.loading('Requesting claim transaction...', { id: 'claim-approval' })
      await claim({
        address: contracts.tokenClaimContract.address,
        abi: contracts.tokenClaimContract.abi,
        functionName: 'claimTokens',
        args
      })
      toast.dismiss('claim-approval')
      toast.loading('Claiming tokens...', { id: 'claim-pending' })
    } catch (err) {
      toast.dismiss('verify-kernel')
      toast.dismiss('claim-approval')
      console.error('Claim error:', err)
      throw err
    }
  }

  return {
    isExecutingKernel,
    executeKernel,
    claimTokens,
    // ... other functions
  }
}
```

### 3. Frontend Environment Configuration

Create `src/frontend/.env`:

```bash
# KRNL Integration Configuration
VITE_KRNL_ENTRY_ID=your_entry_id_from_krnl_platform
VITE_KRNL_ACCESS_TOKEN=your_access_token_from_krnl_platform
VITE_VESTING_KERNEL_ID=1
VITE_TOKEN_AUTHORITY_PUBLIC_KEY=0x...

# Network Configuration
VITE_RPC_URL=https://sepolia.base.org
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Contract Addresses (Updated after deployment)
VITE_VESTED_TOKEN_ADDRESS=0x...
VITE_TOKEN_CLAIM_CONTRACT_ADDRESS=0x...
VITE_TOKEN_VESTING_KERNEL_ADDRESS=0x...
```

### 4. Component Architecture & Chain Switching

The platform uses a **modular component architecture** that separates concerns and makes chain switching seamless across different network requirements.

#### Architecture Benefits

**Modular Design:**
- **ScheduleForm Component**: Encapsulates all Base Sepolia logic, chain switching, templates, and form handling
- **Admin Page**: Clean layout and orchestration without complex state management  
- **Separation of Concerns**: Each component has a single, focused responsibility
- **Reusability**: Components can be easily reused across different pages

**Chain Switching Integration:**
- **Base Sepolia**: Admin operations (vesting schedule creation) via `ScheduleForm`
- **Sepolia**: User operations (token claims, deposits, withdrawals) via dedicated components
- **Automatic Prompts**: Users guided to switch networks when needed
- **Consistent UX**: Same switching pattern across all components

#### Component Structure

```
src/frontend/src/components/
├── admin/
│   └── schedule-form.tsx     # Complete Base Sepolia integration
├── user/
│   ├── token-claim.tsx       # Sepolia claims with KRNL verification  
│   ├── token-operations.tsx  # Sepolia deposits/withdrawals
│   └── token-info.tsx        # Vesting information display
└── token-selector.tsx        # Multi-token selection
```

#### KRNL Claim Component (Main Feature)

Create `src/frontend/src/components/user/token-claim.tsx`:

```typescript
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Loader2, Zap, Shield, ChevronRight } from 'lucide-react'
import { useSwitchChain } from 'wagmi'
import { sepolia } from 'viem/chains'

export function TokenClaim() {
  const [claimAmount, setClaimAmount] = useState('')
  const { switchChain } = useSwitchChain()
  
  const { selectedToken } = useTokenContext()
  const { isEligible, vestedAmount } = useVesting(selectedToken)
  const { isSepolia, userClaims } = useTokenData(selectedToken)
  const { claimTokens, isExecutingKernel, isClaiming } = useContractOperations()

  const handleSwitchToSepolia = async () => {
    try {
      await switchChain({ chainId: sepolia.id })
    } catch (error) {
      console.error('Failed to switch to Sepolia:', error)
    }
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Coins className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg">Claim Vested Tokens</span>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  KRNL Powered
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Cross-Chain Verified
                </Badge>
              </div>
            </div>
          </div>
          {!isSepolia && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleSwitchToSepolia}
              className="animate-pulse"
            >
              Switch to Sepolia
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KRNL Feature Highlight */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">KRNL Integration Showcase</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Token claims are verified through KRNL kernels deployed on Base Sepolia. 
            This demonstrates secure cross-chain verification where vesting schedules on Base Sepolia 
            control token claims on Sepolia through KRNL's kernel architecture.
          </p>
        </div>

        {/* Network Warning with Chain Switching */}
        {!isSepolia && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                <Coins className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Switch to Sepolia network to claim tokens
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSwitchToSepolia}
                className="text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                Switch Network
              </Button>
            </div>
          </motion.div>
        )}

        {/* Claim Form with KRNL Process Info */}
        <div className="space-y-4">
          {/* Claim input and buttons */}
          <Button
            onClick={handleClaim}
            disabled={!claimAmount || isLoading || !isEligible || !isSepolia}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isExecutingKernel ? 'Verifying with KRNL Kernel...' : 'Processing Claim...'}
              </>
            ) : (
              <>
                <Coins className="mr-2 h-5 w-5" />
                Claim Tokens via KRNL
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          
          {/* KRNL Process Information */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <div className="font-medium mb-2">KRNL Claim Process:</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>1. Verify eligibility through Base Sepolia kernel</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>2. Cross-chain verification via KRNL protocol</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>3. Execute token transfer on Sepolia</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### Admin Chain Switching

Update `src/frontend/src/components/admin/schedule-form.tsx` with Base Sepolia switching:

```typescript
import { useSwitchChain } from 'wagmi'
import { baseSepolia } from 'viem/chains'

export function ScheduleForm() {
  const { isBaseSepolia } = useVesting('')
  const { switchChain } = useSwitchChain()

  const handleSwitchToBaseSepolia = async () => {
    try {
      await switchChain({ chainId: baseSepolia.id })
    } catch (error) {
      console.error('Failed to switch to Base Sepolia:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Create Vesting Schedule</span>
          </div>
          {!isBaseSepolia && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleSwitchToBaseSepolia}
              className="animate-pulse"
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              Switch to Base Sepolia
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Network Warning with Switch Button */}
        {!isBaseSepolia && (
          <motion.div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Please switch to Base Sepolia network to create vesting schedules
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSwitchToBaseSepolia}
                className="text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                Switch Network
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Rest of form */}
      </CardContent>
    </Card>
  )
}
```

#### Modular Admin Page Implementation

Update `src/frontend/src/pages/admin.tsx` to use the modular approach:

```typescript
import { motion } from 'framer-motion'
import { Settings, Target, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TokenSelector } from '@/components/token-selector'
import { ScheduleForm } from '@/components/admin/schedule-form'
import { useTokenContext } from '@/contexts/token-context'
import { useToken } from '@/hooks/useToken'
import { useVesting } from '@/hooks/useVesting'
import { formatEther } from 'viem'
import { formatDate } from '@/lib/utils'

export function Admin() {
  const { selectedToken } = useTokenContext()
  const { getTokenSymbol } = useToken()
  const { vestingSchedule, scheduleExists, isCreatedByUser, getVestingProgress } = useVesting(selectedToken || '')

  return (
    <div className="space-y-8">
      {/* Token Selector */}
      <TokenSelectorCard />

      {selectedToken && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Modular Schedule Creation */}
          <AdminCard
            title="Create Vesting Schedule"
            description="Set up a new token vesting schedule on Base Sepolia"
            icon={<Calendar className="h-5 w-5 text-white" />}
          >
            <ScheduleForm />
          </AdminCard>
          
          {/* Schedule Information Display */}
          <AdminCard
            title="Schedule Information"
            description="View current vesting schedule details"
            icon={<Settings className="h-5 w-5 text-white" />}
          >
            {scheduleExists ? (
              <ActiveScheduleDisplay />
            ) : (
              <NoScheduleDisplay />
            )}
          </AdminCard>
        </div>
      )}
    </div>
  )
}
```

## Part 6: KRNL Platform Integration

### 1. Register Your Kernel

Following the [KRNL Workshop pattern](https://docs.krnl.xyz/workshop/speeds-workshop):

1. **Deploy TokenVestingKernel** to Base Sepolia
2. **Register with KRNL Platform** at [app.platform.krnl.xyz](https://app.platform.krnl.xyz)
3. **Configure Token Authority** 
4. **Get Entry ID and Access Token** for frontend

### 2. Testing the Integration

```bash
# 1. Deploy contracts
npm run deploy:vesting-kernel
npm run deploy:sepolia-contracts

# 2. Verify contracts
npm run verify:all

# 3. Start frontend
cd src/frontend && npm run dev

# 4. Test flow:
# - Create vesting schedule (Admin)
# - Deposit tokens
# - Claim with KRNL verification
```

## Part 7: Key Learning Points

### KRNL Integration Best Practices

1. **Parameter Order**: `KrnlPayload` must always be the first parameter
2. **Parameter Encoding**: Must match function signature exactly
3. **Error Handling**: Always check kernel errors before processing results
4. **Cross-Chain**: Design for multi-network verification
5. **Security**: Never skip KRNL verification in protected functions

### Common Patterns

```solidity
// ✅ CORRECT: Proper KRNL integration
function protectedFunction(
    KrnlPayload memory krnlPayload,  // FIRST parameter
    address token,
    uint256 amount
) external onlyAuthorized(krnlPayload, abi.encode(token, amount)) {
    // Process kernel responses
    KernelResponse[] memory responses = abi.decode(
        krnlPayload.kernelResponses, (KernelResponse[])
    );
    
    for (uint i = 0; i < responses.length; i++) {
        if (responses[i].kernelId == MY_KERNEL_ID) {
            // Check errors first
            if (bytes(responses[i].err).length > 0) {
                revert("Kernel verification failed");
            }
            // Process verified result
            uint256 result = abi.decode(responses[i].result, (uint256));
        }
    }
}
```

## Conclusion

You've built a complete KRNL-powered token vesting platform that demonstrates:

- **Real KRNL Integration**: Production-ready kernel implementation
- **Cross-Chain Architecture**: Secure multi-network operations
- **Modern Frontend**: React with KRNL SDK integration
- **Security Best Practices**: Proper verification and error handling

### Next Steps

1. **Extend Functionality**: Add more complex vesting schedules
2. **Production Deployment**: Deploy to mainnet networks
3. **Additional Kernels**: Integrate multiple KRNL kernels
4. **Advanced Features**: Add governance, staking, or other features

### Resources

- **KRNL Documentation**: [docs.krnl.xyz](https://docs.krnl.xyz)
- **KRNL Platform**: [app.platform.krnl.xyz](https://app.platform.krnl.xyz)
- **Speed's Workshop**: [KRNL Workshop](https://docs.krnl.xyz/workshop/speeds-workshop)
- **Source Code**: Complete implementation available in this [repository](https://github.com/Jovells/token-vest.git)

**✨ Try the live demo: [https://token-vest-tau.vercel.app](https://token-vest-tau.vercel.app)**

---

**Built with ❤️ using KRNL technology** 