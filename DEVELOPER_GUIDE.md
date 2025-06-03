# KRNL Demo Platform Developer Guide

## Table of Contents
1. [KRNL Integration Patterns](#krnl-integration-patterns)
2. [Cross-Chain Architecture](#cross-chain-architecture)
3. [Smart Contract Architecture](#smart-contract-architecture)
4. [Frontend KRNL Implementation](#frontend-krnl-implementation)
5. [Development Setup](#development-setup)
6. [Testing KRNL Integration](#testing-krnl-integration)
7. [Deployment Patterns](#deployment-patterns)
8. [Security Best Practices](#security-best-practices)
9. [KRNL API Reference](#krnl-api-reference)
10. [Common Integration Patterns](#common-integration-patterns)

## KRNL Integration Patterns

The KRNL Demo Platform showcases **production-ready KRNL integration patterns** for building secure, cross-chain applications. This guide demonstrates real-world implementation techniques for KRNL development.

### Why This Architecture Demonstrates KRNL Excellence

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Claim Contract │    │  Vesting Kernel │
│   (KRNL SDK)    │◄──►│  (KRNL Base)    │◄──►│ (Pure Logic)    │
│   Sepolia UI    │    │  Sepolia Chain  │    │ Base Sepolia    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              ▲
                              │
                       ┌──────▼──────┐
                       │    KRNL     │
                       │  Platform   │
                       │(Cross-Chain)│
                       └─────────────┘
```

### Core KRNL Design Principles
- **Kernel Separation**: Pure verification logic isolated in TokenVestingKernel
- **Cross-Chain Security**: Secure operations across Base Sepolia and Sepolia
- **Minimal Trust**: No central authority needed for vesting verification
- **Production Ready**: Industrial-strength KRNL integration patterns
- **Educational Value**: Clear examples for developers learning KRNL

## Cross-Chain Architecture

### Network Distribution

| Network | Chain ID | Purpose | Contracts |
|---------|----------|---------|-----------|
| **Base Sepolia** | 84532 | Vesting Management | TokenVestingKernel |
| **Sepolia** | 11155111 | Token Operations | VestedToken, TokenClaimContract |

### Cross-Chain Flow

```
1. Admin creates vesting schedule → Base Sepolia (TokenVestingKernel)
2. Users deposit tokens → Sepolia (TokenClaimContract)
3. Claim verification → KRNL reads from Base Sepolia
4. Token transfer → Sepolia (TokenClaimContract)
```

### Benefits of Cross-Chain Design
- **Separation of Concerns**: Vesting logic separate from token operations
- **Cost Optimization**: Use Base Sepolia for data storage, Sepolia for token transfers
- **Scalability**: Independent scaling of vesting and token operations
- **KRNL Integration**: Seamless cross-chain data verification

## Smart Contract Architecture

### Contract Overview

```
TokenVestingKernel.sol (Base Sepolia)
├── Manages vesting schedules (one per token)
├── Validates eligibility across chains
├── Returns vested amounts for verification
└── Open permissions for schedule creation

TokenClaimContract.sol (Sepolia)
├── Inherits from KRNL base contract
├── Manages token deposits and withdrawals
├── Processes claims with cross-chain verification
└── Tracks user balances per token

VestedToken.sol (Sepolia)
├── Demo ERC20 token for testing
├── Public minting functionality
└── Standard ERC20 implementation

KRNL.sol (Base Contract)
├── Base contract for cross-chain authorization
├── Handles kernel payload verification
└── Provides onlyAuthorized modifier
```

### TokenVestingKernel.sol (Base Sepolia)

```solidity
// Core data structure
struct VestingSchedule {
    uint256 totalAmount;      // Total tokens to vest per user
    uint256 startTime;        // Vesting start timestamp
    uint256 cliffDuration;    // Cliff period in seconds
    uint256 vestingDuration;  // Total vesting duration
    bool isActive;            // Schedule status
    address creator;          // Schedule creator
    address[] eligibleAddresses; // Eligible users
}

// One schedule per token address
mapping(address => VestingSchedule) public vestingSchedules;
mapping(address => mapping(address => bool)) public isEligible;

// Key functions
function setVestingSchedule(
    address token,
    uint256 totalAmount,
    uint256 startTime,
    uint256 cliffDuration,
    uint256 vestingDuration,
    address[] calldata eligibleAddresses
) external;

function getVestedAmount(address token, address user) 
    public view returns (uint256);

function addEligibleAddress(address token, address eligibleAddress) external;
function removeEligibleAddress(address token, address eligibleAddress) external;
```

### TokenClaimContract.sol (Sepolia)

```solidity
// KRNL Integration Pattern
contract TokenClaimContract is KRNL, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Multi-token tracking
    mapping(address => mapping(address => uint256)) public userDeposits;
    mapping(address => mapping(address => uint256)) public userClaims;
    mapping(address => uint256) public totalDeposits;
    mapping(address => uint256) public totalClaims;

    // CORRECT: KrnlPayload always comes first
    function claimTokens(
        KrnlPayload memory krnlPayload,
        address token,
        uint256 amount
    ) external 
      nonReentrant
      onlyAuthorized(krnlPayload, abi.encode(token, amount)) {
        
        // Decode kernel responses
        KernelResponse[] memory kernelResponses = abi.decode(
            krnlPayload.kernelResponses, 
            (KernelResponse[])
        );
        
        // Find vesting kernel response
        uint256 vestedAmount = 0;
        for (uint i = 0; i < kernelResponses.length; i++) {
            if (kernelResponses[i].kernelId == vestingKernelId) {
                if (bytes(kernelResponses[i].err).length > 0) {
                    revert("Kernel error: Vesting verification failed");
                }
                vestedAmount = abi.decode(kernelResponses[i].result, (uint256));
                break;
            }
        }
        
        // Verify claim amount
        uint256 alreadyClaimed = userClaims[msg.sender][token];
        uint256 claimable = vestedAmount > alreadyClaimed ? 
                           vestedAmount - alreadyClaimed : 0;
        
        require(claimable >= amount, "Claiming more than vested amount");
        
        // Process claim
        userClaims[msg.sender][token] += amount;
        totalClaims[token] += amount;
        
        IERC20(token).safeTransfer(msg.sender, amount);
        emit TokensClaimed(msg.sender, token, amount);
    }

    // Multi-token deposit support
    function depositTokens(address token, uint256 amount) external nonReentrant;
    function withdrawTokens(address token, uint256 amount) external nonReentrant;
}
```

## Frontend KRNL Implementation

### Technology Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Wagmi v2** for Ethereum interactions
- **Viem** for low-level Ethereum operations
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Sonner** for toast notifications

### Recent UI Enhancements
- **Contextual Token Selection**: Token selectors appear in dedicated cards where needed
- **Real-time Schedule Monitoring**: Live display of vesting schedule data in admin interface
- **Streamlined Templates**: Vesting templates integrated into creation form (minimized)
- **Enhanced Data Display**: Real-time progress tracking and creator attribution
- **Improved User Flow**: Clear guidance through token selection and action workflow

### Project Structure

```
src/frontend/src/
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── layout.tsx          # Main layout (streamlined, no token selector)
│   ├── theme-provider.tsx  # Dark/light theme support
│   ├── theme-toggle.tsx    # Theme switcher
│   ├── token-selector.tsx  # Multi-token selector (contextual)
│   ├── admin/              # Admin panel components
│   └── user/               # User dashboard components
├── pages/
│   ├── dashboard.tsx       # Enhanced user dashboard with token selector card
│   └── admin.tsx          # Improved admin panel with real-time data
├── contexts/
│   └── token-context.tsx   # Token selection state
├── hooks/
│   ├── useToken.ts         # Token utilities
│   ├── useVesting.ts       # Vesting data hooks (enhanced)
│   └── useTokenData.ts     # Token balance hooks
├── config/
│   └── wagmi.ts           # Multi-chain Wagmi config
├── lib/
│   └── utils.ts           # Utility functions
├── abis/                  # Generated contract ABIs
└── authorization.ts       # KRNL authorization helpers
```

### Enhanced Component Architecture

##### Dashboard (User Interface)
```typescript
// Enhanced dashboard with contextual token selection
export function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <WelcomeHeader />
      
      {/* Token Selector Card - Primary Action */}
      <TokenSelectorCard 
        title="Token Selection"
        description="Choose a token to view vesting details and manage claims"
      />
      
      {/* Conditional Content Based on Token Selection */}
      {selectedToken ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token Actions - Primary */}
          <TokenActionsCard />
          
          {/* Token Information - Secondary */}
          <TokenInformationCard />
        </div>
      ) : (
        <NoTokenSelectedState />
      )}
    </div>
  )
}
```

##### Admin Interface (Enhanced)
```typescript
// Enhanced admin panel with real-time schedule data
export function Admin() {
  const { vestingSchedule, scheduleExists, isCreatedByUser, getVestingProgress } = useVesting(selectedToken || '')
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div className="space-y-8">
      {/* Token Selector Card */}
      <TokenSelectorCard />
      
      {selectedToken && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Schedule with Integrated Templates */}
          <CreateScheduleCard>
            {/* Minimized Templates Section */}
            <CollapsibleTemplatesSection 
              showTemplates={showTemplates}
              onToggle={setShowTemplates}
            />
            
            {/* Schedule Creation Form */}
            <ScheduleForm />
          </CreateScheduleCard>
          
          {/* Real-time Schedule Information */}
          <ScheduleInformationCard>
            {scheduleExists ? (
              <ActiveScheduleDisplay 
                schedule={vestingSchedule}
                progress={getVestingProgress()}
                createdByUser={isCreatedByUser}
              />
            ) : (
              <NoScheduleDisplay />
            )}
          </ScheduleInformationCard>
        </div>
      )}
    </div>
  )
}
```

#### UI Design Principles

##### Token Selection Flow
```typescript
// Contextual token selection pattern
const TokenSelectorCard = ({ title, description }) => (
  <Card className="dedicated-token-selection">
    <CardHeader>
      <TargetIcon />
      <Title>{title}</Title>
      <Description>{description}</Description>
    </CardHeader>
    <CardContent>
      <TokenSelector />
    </CardContent>
  </Card>
)

// Integration in pages
// Dashboard: "Choose a token to view vesting details and manage claims"
// Admin: "Choose a token to create and manage vesting schedules"
```

##### Real-time Data Display
```typescript
// Enhanced schedule information with live data
const ScheduleInformationDisplay = () => {
  const { vestingSchedule, scheduleExists, getVestingProgress } = useVesting(selectedToken)
  
  return (
    <div>
      {scheduleExists ? (
        <ActiveScheduleView>
          <ScheduleStatus createdByUser={isCreatedByUser} />
          <ProgressMetrics progress={getVestingProgress()} />
          <ScheduleParameters schedule={vestingSchedule} />
        </ActiveScheduleView>
      ) : (
        <EmptyScheduleView />
      )}
    </div>
  )
}
```

##### Minimized Template Integration
```typescript
// Streamlined template section
const CollapsibleTemplatesSection = ({ showTemplates, onToggle }) => (
  <div className="border rounded-xl">
    <ToggleButton onClick={onToggle}>
      <CalendarIcon />
      <span>Quick Templates</span>
      {showTemplates ? <ChevronUp /> : <ChevronDown />}
    </ToggleButton>
    
    <AnimatePresence>
      {showTemplates && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <CompactTemplateGrid />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)
```

#### State Management Patterns

##### Enhanced Vesting Hook
```typescript
// Comprehensive vesting data management
export function useVesting(selectedToken: string) {
  // Real-time schedule data
  const { data: vestingSchedule } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    abi: contracts.tokenVestingKernel.abi,
    functionName: 'getVestingSchedule',
    args: [selectedToken as `0x${string}`],
    chainId: baseSepolia.id,
    query: { enabled: !!selectedToken }
  })

  // Enhanced schedule existence check
  const { data: hasActiveSchedule } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    abi: contracts.tokenVestingKernel.abi,
    functionName: 'hasActiveSchedule',
    args: [selectedToken as `0x${string}`],
    chainId: baseSepolia.id,
    query: { enabled: !!selectedToken }
  })

  // Real-time progress calculation
  const getVestingProgress = () => {
    if (!vestingSchedule?.isActive) return 0
    // Progress calculation logic...
  }

  return {
    vestingSchedule,
    scheduleExists: hasActiveSchedule || (vestingSchedule?.creator),
    isCreatedByUser: vestingSchedule?.creator?.toLowerCase() === address?.toLowerCase(),
    getVestingProgress,
    // ... other vesting data
  }
}
```

#### User Experience Improvements

##### Guided Workflow
1. **Token Selection First**: Prominent token selector cards guide users to select a token
2. **Contextual Actions**: Actions only appear after token selection
3. **Real-time Feedback**: Live data updates throughout the interface
4. **Clear Visual Hierarchy**: Primary actions (token selection, schedule creation) are prominent
5. **Minimized Distractions**: Templates are available but don't dominate the interface

##### Enhanced Information Architecture
```typescript
// Clear information hierarchy
Interface Hierarchy:
├── Token Selection (Primary Action)
├── Main Content (Conditional on Token Selection)
│   ├── Dashboard
│   │   ├── Token Actions (Primary)
│   │   └── Token Information (Secondary)
│   └── Admin
│       ├── Create Schedule (with minimized templates)
│       └── Real-time Schedule Information
```

#### Performance Optimizations

##### Real-time Data Fetching
```typescript
// Efficient cross-chain data fetching
const useRealTimeScheduleData = (tokenAddress: string) => {
  // Automatic refetching for live updates
  const { data: schedule, refetch } = useReadContract({
    address: contracts.tokenVestingKernel.address,
    functionName: 'getVestingSchedule',
    args: [tokenAddress],
    chainId: baseSepolia.id,
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 10000 // Consider data stale after 10 seconds
    }
  })

  return { schedule, refetch }
}
```

##### Optimized Animation Performance
```typescript
// Performance-optimized animations
const OptimizedMotionComponent = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.2,
      ease: "easeOut"
    }}
    // Use transform instead of layout changes for better performance
    style={{ willChange: 'transform, opacity' }}
  >
    {content}
  </motion.div>
)
```

### Multi-Chain Wagmi Configuration

```typescript
// Enhanced wagmi config for real-time cross-chain operations
export const config = createConfig({
  chains: [sepolia, baseSepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC_URL),
  },
  // Enhanced caching for better performance
  ssr: false,
  storage: createStorage({
    storage: window.localStorage,
    key: 'vesting-platform-cache',
  }),
});

// Contract configuration with enhanced error handling
export const contracts = {
  vestedToken: {
    address: VESTED_TOKEN_ADDRESS,
    abi: VestedTokenABI,
    chain: sepolia,
  },
  tokenClaimContract: {
    address: TOKEN_CLAIM_CONTRACT_ADDRESS,
    abi: TokenClaimContractABI,
    chain: sepolia,
  },
  tokenVestingKernel: {
    address: TOKEN_VESTING_KERNEL_ADDRESS,
    abi: TokenVestingKernelABI,
    chain: baseSepolia, // Cross-chain kernel
  },
} as const;
```

## Development Setup

### Enhanced Development Workflow

```bash
# Development with real-time features
npm run dev:frontend      # Start with live reload and real-time data
npm run dev:contracts     # Watch contract changes
npm run dev:full         # Full development environment
```

### UI Development Guidelines

#### Component Design Principles
1. **Contextual Placement**: Components appear where they're needed
2. **Progressive Disclosure**: Advanced features (templates) are accessible but not prominent
3. **Real-time Updates**: Data refreshes automatically to show current state
4. **Clear Visual Hierarchy**: Important actions are visually prominent
5. **Responsive Design**: Works seamlessly across all device sizes

#### State Management Best Practices
1. **Centralized Token Selection**: Token context manages global token state
2. **Real-time Data Hooks**: Custom hooks provide live data with automatic updates
3. **Optimistic Updates**: UI updates immediately with pending transaction states
4. **Error Boundaries**: Graceful error handling throughout the interface

## Credits

- **Created with ❤️ by [Jovells](https://linktr.ee/jovells)**
- **Powered by [KRNL](https://krnl.xyz)** 