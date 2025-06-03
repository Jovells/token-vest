# KRNL Demo Platform Deployment Guide

A comprehensive guide for deploying the **KRNL-powered Token Vesting Platform** across Base Sepolia and Sepolia networks. This guide demonstrates real-world KRNL integration patterns and cross-chain deployment strategies.

> **🎯 Goal**: Deploy a complete KRNL demonstration platform that showcases kernel integration, cross-chain operations, and secure token vesting.

## 🏗️ Architecture Overview

### Cross-Chain KRNL Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│    Base Sepolia     │    │      KRNL           │    │      Sepolia        │
│                     │    │    Platform         │    │                     │
│ TokenVestingKernel  │◄──►│  Cross-Chain        │◄──►│ TokenClaimContract  │
│   (KRNL Kernel)     │    │   Verification      │    │  (KRNL Integration) │
│                     │    │                     │    │   VestedToken       │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Network Responsibilities

| Network | Chain ID | Purpose | Components |
|---------|----------|---------|------------|
| **Base Sepolia** | 84532 | KRNL Kernel Operations | TokenVestingKernel (kernel logic) |
| **Sepolia** | 11155111 | Token Operations | TokenClaimContract, VestedToken |
| **KRNL Platform** | Cross-Chain | Verification Engine | Token Authority, Kernel Registry |

## 🔧 Prerequisites

### Development Environment
- **Node.js 18+** with npm
- **Hardhat** development framework
- **Git** for version control

### Blockchain Setup
- **MetaMask** configured for both networks
- **Test ETH** on both chains:
  - [Sepolia Faucet](https://faucets.chain.link/sepolia)
  - [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

### KRNL Platform Account
1. **Sign up** at [app.platform.krnl.xyz](https://app.platform.krnl.xyz)
2. **Create Token Authority** 
3. **Register Kernel** (after deployment)
4. **Get credentials** (Entry ID, Access Token)

### API Keys Required
- **Infura/Alchemy Project ID** for Sepolia RPC
- **Etherscan API Key** for Sepolia verification  
- **BaseScan API Key** for Base Sepolia verification

## 🚀 Step-by-Step Deployment

### Phase 1: Environment Setup

#### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd token-vesting-kernel

# Install root dependencies
npm install

# Install frontend dependencies  
cd src/frontend && npm install && cd ../..
```

#### 2. Configure Environment Variables

Create `.env` in the project root:

```bash
# 🔑 Private Keys (KEEP SECURE)
PRIVATE_KEY=your_private_key_without_0x_prefix

# 🌐 RPC Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# 🔍 Contract Verification  
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key

# 🎯 KRNL Configuration (Get from platform.krnl.xyz)
TOKEN_AUTHORITY_PUBLIC_KEY=0x...  # From KRNL platform
VESTING_KERNEL_ID=1               # Will be assigned after kernel registration
```

#### 3. Verify Hardhat Configuration

Check `hardhat.config.js` for proper network setup:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY], 
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      baseSepolia: process.env.BASESCAN_API_KEY
    },
    customChains: [{
      network: "baseSepolia",
      chainId: 84532,
      urls: {
        apiURL: "https://api-sepolia.basescan.org/api",
        browserURL: "https://sepolia.basescan.org"
      }
    }]
  }
};
```

### Phase 2: Smart Contract Deployment

#### 4. Compile Contracts

```bash
npm run compile
```

Expected output:
```
Compiling 4 files with 0.8.20
- contracts/KRNL.sol
- contracts/TokenVestingKernel.sol  
- contracts/TokenClaimContract.sol
- contracts/VestedToken.sol
Compilation finished successfully
```

#### 5. Deploy TokenVestingKernel (Base Sepolia)

Deploy the KRNL kernel first:

```bash
npm run deploy:vesting-kernel
```

Expected output:
```
Deploying TokenVestingKernel to Base Sepolia...
TokenVestingKernel deployed to: 0x1234567890abcdef...
Deployment info saved to deployments-base-sepolia.json
```

**⚠️ Important**: Save this address for KRNL platform registration!

#### 6. Deploy Token Contracts (Sepolia)

Deploy the claim contract and demo token:

```bash
npm run deploy:vested-token
npm run deploy:claim-contract
```

Expected output:
```
Deploying VestedToken to Sepolia...
VestedToken deployed to: 0xabcdef1234567890...

Deploying TokenClaimContract to Sepolia...
TokenClaimContract deployed to: 0x9876543210fedcba...
Deployment info saved to deployments-sepolia.json
```

#### 7. Verify All Contracts

Verify contracts on their respective block explorers:

```bash
npm run verify:all
```

This runs:
- `npm run verify:vesting-kernel` (Base Sepolia)
- `npm run verify:vested-token` (Sepolia)  
- `npm run verify:claim-contract` (Sepolia)

### Phase 3: KRNL Platform Integration

#### 8. Register Your Kernel with KRNL

1. **Go to** [app.platform.krnl.xyz](https://app.platform.krnl.xyz)
2. **Register Kernel**:
   - Name: "Token Vesting Kernel"
   - Contract Address: `0x...` (from deployment output)
   - Network: Base Sepolia
   - Function: `getVestedAmount(address,address)`
3. **Get Kernel ID** and update `.env`:
   ```bash
   VESTING_KERNEL_ID=123  # Replace with actual kernel ID
   ```

#### 9. Create KRNL Entry and Access Token

In the KRNL platform:
1. **Create Application Entry**
2. **Generate Access Token**  
3. **Note Entry ID and Access Token** for frontend config

### Phase 4: Frontend Configuration

#### 10. Configure Frontend Environment

Create `src/frontend/.env`:

```bash
# 🎯 KRNL Integration (Required)
VITE_KRNL_ENTRY_ID=your_entry_id_from_step_9
VITE_KRNL_ACCESS_TOKEN=your_access_token_from_step_9
VITE_VESTING_KERNEL_ID=123  # From step 8
VITE_TOKEN_AUTHORITY_PUBLIC_KEY=0x...  # Same as root .env

# 🌐 Network Configuration  
VITE_RPC_URL=https://sepolia.base.org  # For KRNL kernel calls
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# 📄 Contract Addresses (From deployment)
VITE_VESTED_TOKEN_ADDRESS=0x...  # From step 6
VITE_TOKEN_CLAIM_CONTRACT_ADDRESS=0x...  # From step 6  
VITE_TOKEN_VESTING_KERNEL_ADDRESS=0x...  # From step 5
```

#### 11. Generate TypeScript ABIs

Generate frontend-ready contract interfaces:

```bash
npm run generate:abis
```

This creates TypeScript ABI files in `src/frontend/src/abis/`

#### 12. Start Development Server

```bash
npm run frontend
```

The application will be available at `http://localhost:5173`

## 🧪 Testing Your Deployment

### End-to-End Testing Flow

#### 1. Test Admin Functions (Base Sepolia)

1. **Switch MetaMask** to Base Sepolia
2. **Navigate to Admin Panel** in the app
3. **Create Vesting Schedule**:
   - Token: VestedToken address
   - Total Amount: 1000 tokens
   - Cliff Duration: 1 days (for testing)
   - Vesting Duration: 30 days
   - Eligible Addresses: Your wallet address

#### 2. Test User Functions (Sepolia)

1. **Switch MetaMask** to Sepolia  
2. **Navigate to Dashboard**
3. **Mint Demo Tokens** (1000 VEST)
4. **Deposit Tokens** (500 VEST) 
5. **Wait for cliff period** (1 day in test setup)
6. **Claim Vested Tokens** with KRNL verification

#### 3. Verify KRNL Integration

Check browser console for KRNL logs:
```javascript
// Should see successful kernel execution:
"Executing KRNL kernel with: { token: '0x...', user: '0x...' }"
"KRNL kernel execution successful"
"Verifying eligibility with KRNL..." 
"Claiming tokens..."
```

## 📊 Deployment Verification Checklist

### ✅ Smart Contracts
- [ ] TokenVestingKernel deployed to Base Sepolia
- [ ] TokenClaimContract deployed to Sepolia
- [ ] VestedToken deployed to Sepolia
- [ ] All contracts verified on block explorers
- [ ] ABI files generated for frontend

### ✅ KRNL Integration  
- [ ] Kernel registered on KRNL platform
- [ ] Token Authority configured
- [ ] Entry ID and Access Token obtained
- [ ] Kernel ID updated in environment files

### ✅ Frontend Configuration
- [ ] All environment variables set
- [ ] KRNL credentials configured
- [ ] Contract addresses updated
- [ ] Development server running
- [ ] Wallet can connect to both networks

### ✅ Functionality Testing
- [ ] Can create vesting schedules (Base Sepolia)
- [ ] Can deposit tokens (Sepolia)
- [ ] KRNL kernel verification works
- [ ] Can claim vested tokens (Sepolia) 
- [ ] Cross-chain data reading functions
- [ ] Error handling works properly

## 🚨 Troubleshooting Guide

### Common Deployment Issues

#### Contract Deployment Fails
```bash
Error: insufficient funds for intrinsic transaction cost
```
**Solution**: Ensure sufficient test ETH on deployment account

#### Verification Fails
```bash
Error: Contract source code already verified
```
**Solution**: Contract already verified, or use `--force` flag

#### KRNL Integration Issues
```bash
Error: Invalid signature for kernel responses
```
**Solutions**:
- Verify Token Authority public key is correct
- Check kernel registration on KRNL platform
- Ensure Entry ID and Access Token are valid

#### Frontend Connection Problems
```bash
TypeError: Cannot read property 'executeKernels' of undefined
```
**Solutions**:
- Verify KRNL environment variables are set
- Check RPC URL configuration
- Ensure KRNL SDK is properly imported

### Network-Specific Issues

#### Base Sepolia Connection
- Use official RPC: `https://sepolia.base.org`
- Verify chain ID: 84532
- Check BaseScan for contract verification

#### Sepolia Connection  
- Use reliable RPC (Infura/Alchemy)
- Verify chain ID: 11155111
- Check Etherscan for contract verification

## 🔒 Security Considerations

### Environment Security
- **Never commit** `.env` files to version control
- **Use separate** private keys for mainnet vs testnet
- **Rotate API keys** regularly
- **Store KRNL credentials** securely

### Smart Contract Security
- **Verify all contracts** on block explorers
- **Test thoroughly** on testnets before mainnet
- **Use time locks** for admin functions in production
- **Implement proper** access controls

### KRNL Integration Security
- **Validate kernel responses** before processing
- **Check for errors** in kernel execution
- **Use proper parameter encoding** 
- **Implement fallback mechanisms**

## 📈 Production Deployment

### Mainnet Deployment Checklist

1. **Update Network Configuration**:
   - Ethereum Mainnet (Chain ID: 1)
   - Base Mainnet (Chain ID: 8453)

2. **Security Audit**:
   - Contract security review
   - KRNL integration audit
   - Frontend security assessment

3. **KRNL Production Setup**:
   - Register kernel on mainnet
   - Configure production Token Authority
   - Set up monitoring and alerts

4. **Frontend Production**:
   - Build optimized frontend
   - Configure production environment variables
   - Deploy to hosting platform (Vercel, Netlify)

5. **Monitoring Setup**:
   - Contract event monitoring
   - KRNL kernel performance tracking
   - User transaction monitoring

## 🔗 Additional Resources

### KRNL Platform Resources
- **KRNL Documentation**: [docs.krnl.xyz](https://docs.krnl.xyz)
- **KRNL Platform**: [app.platform.krnl.xyz](https://app.platform.krnl.xyz)

### Development Resources
- **Hardhat Documentation**: [hardhat.org](https://hardhat.org)
- **Wagmi Documentation**: [wagmi.sh](https://wagmi.sh)
- **Viem Documentation**: [viem.sh](https://viem.sh)

### Network Resources
- **Base Sepolia Explorer**: [sepolia.basescan.org](https://sepolia.basescan.org)
- **Sepolia Explorer**: [sepolia.etherscan.io](https://sepolia.etherscan.io)
- **Base Sepolia Faucet**: [coinbase.com/faucets](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

---

**🎯 Success!** You now have a fully deployed KRNL-powered token vesting platform demonstrating real-world kernel integration, cross-chain operations, and secure token distribution patterns.

**Next Steps**: Explore the [Developer Guide](./DEVELOPER_GUIDE.md) for advanced KRNL integration patterns and [Medium Tutorial](./MEDIUM_TUTORIAL.md) for step-by-step implementation details. 
- **Powered by [KRNL](https://krnl.xyz)** 
- **Powered by [KRNL](https://krnl.xyz)** 