# KRNL Demo Platform Frontend

A modern **React + TypeScript** frontend showcasing real-world **KRNL integration patterns** for secure, cross-chain token vesting operations. This frontend demonstrates how to build production-ready dApps with KRNL's powerful kernel verification system.

> **🎯 Educational Purpose**: Learn KRNL frontend integration by example with production-ready patterns.

## ✨ KRNL Frontend Integration Highlights

### Real KRNL SDK Usage
- **Kernel Execution**: Direct integration with KRNL's `executeKernels` function
- **Cross-Chain Verification**: Frontend orchestrates verification across Base Sepolia and Sepolia
- **Error Handling**: Comprehensive kernel error handling and user feedback
- **Production Patterns**: Real-world KRNL integration following best practices

### Architecture Overview
```typescript
// KRNL Integration Flow
Frontend (React) 
    ↓ (KRNL SDK)
KRNL Platform (Cross-Chain Verification)
    ↓ (Kernel Response)
TokenClaimContract (Sepolia)
    ↓ (Read Kernel Data)
TokenVestingKernel (Base Sepolia)
```

## 🏗️ Technical Stack

### Core Technologies
- **React 18** with TypeScript
- **Vite** for fast development and building
- **KRNL SDK** for kernel integration
- **Wagmi v2** for Ethereum interactions
- **Viem** for type-safe contract interactions
- **TanStack Query** for data fetching and caching

### UI Framework
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Framer Motion** for animations
- **Lucide React** for icons
- **Sonner** for toast notifications

## 🎯 KRNL Integration Features

### Core KRNL Hook: `useContractOperations`

The centerpiece of our KRNL integration:

```typescript
// src/hooks/useContractOperations.ts
export function useContractOperations() {
  const executeKernel = async (token: string, user: string, amount: string) => {
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
    
    // Execute kernel through KRNL SDK
    const krnlPayload = await provider.executeKernels(
      KRNL_ENTRY_ID, 
      KRNL_ACCESS_TOKEN, 
      kernelRequestData, 
      functionParams
    )
    
    return { krnlPayload }
  }
  
  // Full claim flow with KRNL verification
  const claimTokens = async (token, amount, isEligible, isSepolia) => {
    // Step 1: Execute KRNL kernel for verification
    const { krnlPayload } = await executeKernel(token, address, amount)
    
    // Step 2: Call contract with KRNL payload
    await claim({
      address: contracts.tokenClaimContract.address,
      abi: contracts.tokenClaimContract.abi,
      functionName: 'claimTokens',
      args: [krnlPayload, token, parsedAmount]
    })
  }
}
```

### KRNL Configuration Management

Environment-based KRNL configuration:

```typescript
// KRNL Integration Configuration
const KRNL_ENTRY_ID = import.meta.env.VITE_KRNL_ENTRY_ID
const KRNL_ACCESS_TOKEN = import.meta.env.VITE_KRNL_ACCESS_TOKEN  
const VESTING_KERNEL_ID = import.meta.env.VITE_VESTING_KERNEL_ID
const TOKEN_AUTHORITY_PUBLIC_KEY = import.meta.env.VITE_TOKEN_AUTHORITY_PUBLIC_KEY
```

### User Experience with KRNL

Real-time feedback during KRNL operations:

```typescript
// Toast notifications for KRNL flow
toast.loading('Verifying eligibility with KRNL...', { id: 'verify-kernel' })
const { krnlPayload } = await executeKernel(token, address, amount)
toast.dismiss('verify-kernel')

toast.loading('Requesting claim transaction...', { id: 'claim-approval' })
await claim({ /* contract call with KRNL payload */ })
toast.dismiss('claim-approval')
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm
- **KRNL Platform Account** - [Sign up here](https://app.platform.krnl.xyz)
- **MetaMask** configured for Sepolia and Base Sepolia

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your KRNL credentials
```

### Environment Configuration

Create `.env` with your KRNL credentials:

```bash
# 🎯 KRNL Integration (Required)
VITE_KRNL_ENTRY_ID=your_entry_id_from_krnl_platform
VITE_KRNL_ACCESS_TOKEN=your_access_token_from_krnl_platform
VITE_VESTING_KERNEL_ID=123  # Your registered kernel ID
VITE_TOKEN_AUTHORITY_PUBLIC_KEY=0x...  # From KRNL platform

# 🌐 Network Configuration
VITE_RPC_URL=https://sepolia.base.org  # For KRNL kernel calls
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# 📄 Contract Addresses (After deployment)
VITE_VESTED_TOKEN_ADDRESS=0x...
VITE_TOKEN_CLAIM_CONTRACT_ADDRESS=0x...
VITE_TOKEN_VESTING_KERNEL_ADDRESS=0x...
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🧩 Component Architecture

### Page Components
- **`dashboard.tsx`** - User interface for token management and claiming
- **`admin.tsx`** - Admin interface for creating vesting schedules
- **`layout.tsx`** - Application layout with navigation and KRNL branding

### Key Components
- **`token-selector.tsx`** - Multi-token selection interface
- **`token-actions.tsx`** - KRNL-powered claim actions
- **`token-info.tsx`** - Real-time vesting data display
- **`schedule-form.tsx`** - Admin vesting schedule creation

### KRNL Integration Components
- **`useContractOperations.ts`** - Core KRNL integration hook
- **`wagmi.config.ts`** - Multi-chain wallet configuration
- **Contract ABIs** - TypeScript-generated contract interfaces

## 🎨 UI/UX Features

### KRNL-Focused Design
- **Clear KRNL Branding**: "KRNL Demo Platform" throughout the interface
- **Kernel Integration Messaging**: Blue info boxes explaining KRNL benefits
- **Cross-Chain Awareness**: Clear indication of which network operations occur on
- **Educational Elements**: Tooltips and explanations of KRNL concepts

### User Experience Enhancements
- **Comprehensive Balance Tracking**: 5-stat dashboard showing all token states
- **Real-Time Toast Feedback**: Step-by-step KRNL operation feedback
- **Loading States**: Clear indication during KRNL kernel execution
- **Error Handling**: Comprehensive error messages for KRNL integration issues

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Adaptive Grids**: Responsive grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`)
- **Modern Styling**: Tailwind CSS with custom KRNL theme elements

## 🔧 Development Scripts

```bash
# 🚀 Development
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # ESLint checking

# 🧪 Testing (if implemented)
npm run test         # Run component tests
npm run test:watch   # Watch mode testing
```

## 📁 Project Structure

```
src/frontend/
├── src/
│   ├── components/          # React components
│   │   ├── admin/           # Admin interface components
│   │   ├── user/            # User dashboard components
│   │   └── ui/              # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   │   └── useContractOperations.ts  # KRNL integration hook
│   ├── pages/               # Page components
│   │   ├── dashboard.tsx    # User dashboard
│   │   └── admin.tsx        # Admin panel
│   ├── config/              # Configuration files
│   │   └── wagmi.ts         # Wagmi + KRNL configuration
│   ├── abis/                # Contract ABI files (generated)
│   ├── lib/                 # Utility functions
│   │   └── utils.ts         # Helper functions including KRNL utilities
│   └── styles/              # Global styles
└── public/                  # Static assets
```

## 🔍 KRNL Integration Deep Dive

### Parameter Encoding Patterns

Correct KRNL parameter encoding (critical for security):

```typescript
// For kernel execution (what the kernel receives)
const kernelParams = abiCoder.encode(["address", "address"], [token, user])

// For contract authorization (what gets verified)
const functionParams = abiCoder.encode(["address", "uint256"], [token, amount])

// These MUST match exactly with the contract function signature
```

### Error Handling Best Practices

```typescript
// Always check for KRNL errors before processing
if (bytes(kernelResponse.err).length > 0) {
  throw new Error(`KRNL verification failed: ${kernelResponse.err}`)
}

// Decode verified result only after error check
const vestedAmount = abi.decode(kernelResponse.result, (uint256))
```

### Contract Simulation

Always simulate before executing KRNL-verified transactions:

```typescript
// Simulate contract call first
await publicClient.simulateContract({
  address: contracts.tokenClaimContract.address,
  abi: contracts.tokenClaimContract.abi,
  functionName: 'claimTokens',
  account: address,
  args: [krnlPayload, token, amount]
})

// Then execute actual transaction
await writeContract({ /* same args */ })
```

## 🚨 Common KRNL Integration Issues

### Environment Variable Problems
```bash
Error: KRNL_ENTRY_ID is undefined
```
**Solution**: Ensure all KRNL environment variables are properly set in `.env`

### Parameter Encoding Mismatches
```bash
Error: Invalid kernel params digest
```
**Solution**: Verify parameter encoding matches contract function signature exactly

### Network Configuration Issues
```bash
Error: Cannot connect to KRNL platform
```
**Solution**: Check RPC URLs and ensure wallet is connected to correct networks

## 🌟 Learning KRNL Patterns

### For Frontend Developers
- **KRNL SDK Integration**: How to integrate `krnl-sdk` in React applications
- **Cross-Chain UX**: Managing multi-network user experiences
- **Error Handling**: Comprehensive error management for kernel operations
- **Real-Time Feedback**: Providing clear user feedback during KRNL operations

### For dApp Builders
- **Production Patterns**: Real-world KRNL integration techniques
- **Security Considerations**: Proper parameter encoding and validation
- **Performance**: Efficient kernel execution and response handling
- **User Experience**: Making complex cross-chain operations feel simple

## 🔗 Resources

### KRNL Platform
- **KRNL Documentation**: [docs.krnl.xyz](https://docs.krnl.xyz)
- **KRNL Platform**: [app.platform.krnl.xyz](https://app.platform.krnl.xyz)

### Frontend Technologies
- **React Documentation**: [react.dev](https://react.dev)
- **Vite Documentation**: [vitejs.dev](https://vitejs.dev)
- **Wagmi Documentation**: [wagmi.sh](https://wagmi.sh)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)

---

**🎓 Educational Note**: This frontend demonstrates production-ready KRNL integration patterns. Use it to learn how to build secure, cross-chain dApps with KRNL's powerful verification system.

**Built with ❤️ by [Jovells](https://linktr.ee/jovells) • Powered by [KRNL](https://krnl.xyz)**
