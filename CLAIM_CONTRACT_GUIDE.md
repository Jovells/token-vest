# TokenClaimContract Usage Guide

## Overview

The `TokenClaimContract` is a multi-token vesting claim contract that integrates with the `TokenVestingKernel` through the KRNL platform. It serves as the secure interface for users to deposit tokens, claim vested amounts, and withdraw their deposits. The contract supports any ERC20 token and provides comprehensive tracking of deposits and claims.

## Core Architecture

### Key Components
- **KRNL Integration**: Uses KRNL for secure kernel verification
- **Multi-Token Support**: Works with any ERC20 token
- **Deposit Tracking**: Tracks deposits per user per token
- **Claim Verification**: Verifies claims against kernel vesting data
- **Withdrawal Protection**: Only depositors can withdraw their tokens

### Contract Inheritance
```solidity
contract TokenClaimContract is KRNL, ReentrancyGuard
```

The contract inherits from:
- `KRNL`: Provides kernel integration and authorization
- `ReentrancyGuard`: Protects against reentrancy attacks

## Contract Interface

### Constructor

```solidity
constructor(
    address _tokenAuthorityPublicKey,
    uint256 _vestingKernelId,
    address _vestingKernelAddress
) KRNL(_tokenAuthorityPublicKey)
```

**Parameters:**
- `_tokenAuthorityPublicKey`: Address of the token authority public key for KRNL
- `_vestingKernelId`: ID of the TokenVestingKernel in the KRNL registry
- `_vestingKernelAddress`: Address of the TokenVestingKernel contract

### Core Functions

#### `depositTokens()`
Deposits tokens into the contract for vesting distribution.

```solidity
function depositTokens(address token, uint256 amount) external nonReentrant
```

**Parameters:**
- `token`: Address of the ERC20 token to deposit
- `amount`: Amount of tokens to deposit

**Requirements:**
- Token address must be valid (non-zero)
- Amount must be greater than 0
- User must have sufficient token balance
- User must have approved the contract to spend tokens

**Example:**
```solidity
// Approve the contract to spend tokens
IERC20(tokenAddress).approve(claimContractAddress, amount);

// Deposit tokens
claimContract.depositTokens(tokenAddress, 1000 * 10**18);
```

#### `claimTokens()`
Claims vested tokens using KRNL kernel verification.

```solidity
function claimTokens(
    KrnlPayload memory krnlPayload,
    address token,
    uint256 amount
) external nonReentrant onlyAuthorized(krnlPayload, abi.encode(token, msg.sender))
```

**Parameters:**
- `krnlPayload`: The KRNL payload containing kernel responses
- `token`: Address of the token to claim
- `amount`: Amount to claim

**KRNL Integration:**
The function uses the `onlyAuthorized` modifier which:
1. Verifies the KRNL payload signature
2. Calls the vesting kernel with `(token, msg.sender)` parameters
3. Receives the vested amount from the kernel
4. Validates the claim against the vested amount

**Example Usage:**
```javascript
// Frontend: Prepare KRNL payload
const krnlPayload = await prepareKrnlPayload(
    vestingKernelId,
    [token, userAddress],
    userPrivateKey
);

// Call claim function
await claimContract.claimTokens(krnlPayload, tokenAddress, claimAmount);
```

#### `withdrawTokens()`
Withdraws deposited tokens (only depositors can withdraw their deposits).

```solidity
function withdrawTokens(address token, uint256 amount) external nonReentrant
```

**Parameters:**
- `token`: Address of the token to withdraw
- `amount`: Amount to withdraw

**Security:**
- Only the original depositor can withdraw their tokens
- Cannot withdraw more than deposited
- Protects against unauthorized withdrawals

### Query Functions

#### `getUserDeposits()`
Returns the total amount a user has deposited for a specific token.

```solidity
function getUserDeposits(address user, address token) external view returns (uint256)
```

#### `getUserClaims()`
Returns the total amount a user has claimed for a specific token.

```solidity
function getUserClaims(address user, address token) external view returns (uint256)
```

#### `getUserClaimedAmount()`
Alias for `getUserClaims()` - returns amount already claimed by the user.

```solidity
function getUserClaimedAmount(address user, address token) external view returns (uint256)
```

#### `getTotalDeposits()`
Returns the total amount deposited for a specific token across all users.

```solidity
function getTotalDeposits(address token) external view returns (uint256)
```

#### `getTotalClaims()`
Returns the total amount claimed for a specific token across all users.

```solidity
function getTotalClaims(address token) external view returns (uint256)
```

#### `getSupportedTokens()`
Returns an array of all tokens that have been deposited.

```solidity
function getSupportedTokens() external view returns (address[] memory)
```

#### `isTokenSupported()`
Checks if a token has been deposited and is supported.

```solidity
function isTokenSupported(address token) external view returns (bool)
```

## Usage Patterns

### Basic Deposit and Claim Flow

```solidity
// 1. User approves tokens
IERC20(tokenAddress).approve(claimContractAddress, depositAmount);

// 2. User deposits tokens
claimContract.depositTokens(tokenAddress, depositAmount);

// 3. Time passes, tokens vest according to schedule

// 4. User claims vested tokens (requires KRNL payload)
claimContract.claimTokens(krnlPayload, tokenAddress, claimAmount);
```

### Multi-Token Management

```solidity
// Deposit multiple tokens
address[] tokens = [tokenA, tokenB, tokenC];
uint256[] amounts = [1000e18, 2000e18, 500e18];

for (uint i = 0; i < tokens.length; i++) {
    IERC20(tokens[i]).approve(claimContract, amounts[i]);
    claimContract.depositTokens(tokens[i], amounts[i]);
}

// Query all supported tokens
address[] memory supportedTokens = claimContract.getSupportedTokens();
```

### Withdrawal Pattern

```solidity
// Check deposit balance
uint256 deposited = claimContract.getUserDeposits(userAddress, tokenAddress);

// Withdraw partial amount
uint256 withdrawAmount = deposited / 2;
claimContract.withdrawTokens(tokenAddress, withdrawAmount);

// Withdraw remaining
uint256 remaining = claimContract.getUserDeposits(userAddress, tokenAddress);
claimContract.withdrawTokens(tokenAddress, remaining);
```

## KRNL Integration Details

### Authorization Flow

1. **Payload Preparation**: Frontend prepares KRNL payload with kernel parameters
2. **Signature Verification**: Contract verifies payload signature
3. **Kernel Execution**: KRNL calls vesting kernel with `(token, user)` parameters
4. **Response Processing**: Contract processes kernel response
5. **Claim Validation**: Contract validates claim against vested amount

### Kernel Response Handling

```solidity
// Inside claimTokens function
KernelResponse[] memory kernelResponses = abi.decode(krnlPayload.kernelResponses, (KernelResponse[]));
uint256 vestedAmount = 0;

// Find the response for our vesting kernel
for (uint i = 0; i < kernelResponses.length; i++) {
    if (kernelResponses[i].kernelId == vestingKernelId) {
        // Check if there's an error
        if (bytes(kernelResponses[i].err).length > 0) {
            revert("Kernel error: Vesting verification failed");
        }
        
        // Decode the result (vested amount for this user and token)
        vestedAmount = abi.decode(kernelResponses[i].result, (uint256));
        break;
    }
}
```

### Error Handling

The contract handles various error scenarios:
- **Kernel Errors**: Reverts if kernel returns an error
- **Invalid Responses**: Validates kernel response format
- **Missing Responses**: Ensures kernel response exists for the vesting kernel ID

## Security Considerations

### Access Control
- **Deposit Protection**: Only token holders can deposit their own tokens
- **Withdrawal Protection**: Only depositors can withdraw their deposits
- **Claim Authorization**: Claims require valid KRNL authorization

### Reentrancy Protection
All state-changing functions use the `nonReentrant` modifier:
```solidity
function depositTokens(address token, uint256 amount) external nonReentrant
function claimTokens(...) external nonReentrant onlyAuthorized(...)
function withdrawTokens(address token, uint256 amount) external nonReentrant
```

### Input Validation
```solidity
// Token address validation
require(token != address(0), "Invalid token address");

// Amount validation
require(amount > 0, "Amount must be greater than 0");

// Balance checks
require(tokenContract.balanceOf(msg.sender) >= amount, "Insufficient token balance");
require(tokenContract.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
```

### Safe Token Transfers
Uses OpenZeppelin's `SafeERC20` for secure token operations:
```solidity
using SafeERC20 for IERC20;

// Safe transfer from user to contract
tokenContract.safeTransferFrom(msg.sender, address(this), amount);

// Safe transfer from contract to user
tokenContract.safeTransfer(msg.sender, amount);
```

## Integration Examples

### Frontend Integration

```typescript
import { ethers } from 'ethers';

class TokenClaimManager {
    constructor(
        private contract: ethers.Contract,
        private signer: ethers.Signer
    ) {}

    async depositTokens(tokenAddress: string, amount: bigint) {
        // Approve tokens first
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
        await tokenContract.approve(this.contract.address, amount);
        
        // Deposit tokens
        return await this.contract.depositTokens(tokenAddress, amount);
    }

    async claimTokens(tokenAddress: string, amount: bigint, krnlPayload: any) {
        return await this.contract.claimTokens(krnlPayload, tokenAddress, amount);
    }

    async getUserBalance(userAddress: string, tokenAddress: string) {
        const deposits = await this.contract.getUserDeposits(userAddress, tokenAddress);
        const claims = await this.contract.getUserClaims(userAddress, tokenAddress);
        
        return {
            deposited: deposits,
            claimed: claims,
            available: deposits - claims
        };
    }

    async getSupportedTokens() {
        return await this.contract.getSupportedTokens();
    }
}
```

### Admin Dashboard Integration

```typescript
class AdminDashboard {
    async getContractStats(claimContract: ethers.Contract) {
        const supportedTokens = await claimContract.getSupportedTokens();
        
        const stats = [];
        for (const token of supportedTokens) {
            const totalDeposits = await claimContract.getTotalDeposits(token);
            const totalClaims = await claimContract.getTotalClaims(token);
            
            stats.push({
                token,
                totalDeposits,
                totalClaims,
                available: totalDeposits - totalClaims
            });
        }
        
        return stats;
    }
}
```

## Events and Monitoring

### Contract Events

```solidity
event TokensDeposited(address indexed depositor, address indexed token, uint256 amount);
event TokensClaimed(address indexed claimer, address indexed token, uint256 amount);
event TokensWithdrawn(address indexed withdrawer, address indexed token, uint256 amount);
event KernelUpdated(uint256 indexed oldKernelId, uint256 indexed newKernelId);
event KernelAddressUpdated(address indexed oldAddress, address indexed newAddress);
event EmergencyWithdrawal(address indexed token, uint256 amount, address indexed to);
```

### Event Monitoring

```typescript
// Listen for deposits
claimContract.on('TokensDeposited', (depositor, token, amount) => {
    console.log(`${depositor} deposited ${amount} of token ${token}`);
});

// Listen for claims
claimContract.on('TokensClaimed', (claimer, token, amount) => {
    console.log(`${claimer} claimed ${amount} of token ${token}`);
});

// Listen for withdrawals
claimContract.on('TokensWithdrawn', (withdrawer, token, amount) => {
    console.log(`${withdrawer} withdrew ${amount} of token ${token}`);
});
```

## Best Practices

### For Users

1. **Approve Before Deposit**: Always approve the contract before depositing
2. **Check Balances**: Verify deposit and claim balances regularly
3. **Understand Vesting**: Know your vesting schedule before claiming
4. **Secure KRNL**: Keep KRNL credentials secure for claiming

### For Developers

1. **Error Handling**: Implement comprehensive error handling
2. **Gas Optimization**: Batch operations when possible
3. **Event Monitoring**: Monitor contract events for user activity
4. **Security Audits**: Audit integration code thoroughly

### For Administrators

1. **Monitor Deposits**: Track total deposits vs available tokens
2. **Kernel Updates**: Keep vesting kernel address updated
3. **Emergency Procedures**: Have emergency withdrawal procedures
4. **User Support**: Provide clear documentation for users

## Common Use Cases

### Employee Token Distribution

```solidity
// Company deposits tokens for employee vesting
// Employees claim based on their vesting schedule

// 1. Company deposits tokens
companyMultisig.depositTokens(companyToken, totalEmployeeAllocation);

// 2. Employees claim over time
employee.claimTokens(krnlPayload, companyToken, vestedAmount);
```

### Investor Token Release

```solidity
// Project deposits investor tokens
// Investors claim based on release schedule

// 1. Project deposits tokens
projectTreasury.depositTokens(projectToken, totalInvestorAllocation);

// 2. Investors claim according to schedule
investor.claimTokens(krnlPayload, projectToken, vestedAmount);
```

### Community Rewards

```solidity
// Community fund deposits reward tokens
// Community members claim based on participation

// 1. Fund deposits tokens
communityFund.depositTokens(rewardToken, totalRewards);

// 2. Members claim rewards
member.claimTokens(krnlPayload, rewardToken, earnedAmount);
```

## Troubleshooting

### Common Issues

**Q: "Insufficient allowance" error during deposit**
- Ensure you've approved the contract to spend your tokens
- Check that approval amount is sufficient
- Verify token contract address is correct

**Q: "Kernel error: Vesting verification failed"**
- Check if user is eligible for the token's vesting schedule
- Verify vesting schedule exists and is active
- Ensure KRNL payload is properly formatted

**Q: "Claiming more than vested amount"**
- Check current vested amount from kernel
- Verify you haven't already claimed the maximum
- Ensure vesting schedule parameters are correct

**Q: "Insufficient deposit balance" during withdrawal**
- Check your deposit balance for the specific token
- Verify you're withdrawing the correct token
- Ensure you haven't already withdrawn the maximum

### Debugging Tips

1. **Check Token Balances**: Verify contract has sufficient tokens
2. **Validate Addresses**: Ensure all addresses are correct and checksummed
3. **Monitor Events**: Use events to track transaction success
4. **Test with Small Amounts**: Start with small amounts for testing

## Gas Optimization

### Efficient Operations

```solidity
// Batch multiple token operations
function batchDeposit(address[] tokens, uint256[] amounts) external {
    for (uint i = 0; i < tokens.length; i++) {
        depositTokens(tokens[i], amounts[i]);
    }
}

// Cache repeated calls
uint256 userDeposit = getUserDeposits(user, token);
uint256 userClaims = getUserClaims(user, token);
uint256 available = userDeposit - userClaims;
```

### Gas-Efficient Queries

```solidity
// Use view functions for off-chain calculations
// Avoid unnecessary state changes
// Batch read operations when possible
```

## Upgrades and Migration

### Contract Upgrades
The contract is not upgradeable by design for security. For major changes:
1. Deploy new contract version
2. Update frontend to use new contract
3. Migrate user deposits if necessary
4. Update KRNL integration

### Data Migration
If migration is needed:
1. Export user deposit data
2. Export claim history
3. Deploy new contract
4. Import data to new contract
5. Update user interfaces

## Conclusion

The TokenClaimContract provides a secure, flexible foundation for multi-token vesting systems. Its integration with the TokenVestingKernel through KRNL ensures secure claim verification, while its comprehensive tracking and withdrawal protection make it suitable for various token distribution scenarios. The contract's design prioritizes security, usability, and multi-token support, making it an ideal choice for employee compensation, investor token releases, and community reward programs. 