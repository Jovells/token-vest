# TokenVestingKernel Usage Guide

## Overview

The `TokenVestingKernel` is an on-chain smart contract that manages token vesting schedules for any ERC20 token. It follows a simplified architecture where each token address has exactly one vesting schedule, and only eligible addresses can participate in that schedule.

## Core Concepts

### Vesting Schedule Structure
Each vesting schedule contains:
- **Total Amount**: Tokens to be vested per eligible user
- **Start Time**: When vesting begins (Unix timestamp)
- **Cliff Duration**: Period before any tokens vest (in seconds)
- **Vesting Duration**: Total time for complete vesting after cliff (in seconds)
- **Eligible Addresses**: List of addresses that can claim tokens
- **Creator**: Address that created the schedule

### Key Features
- **One Schedule Per Token**: Each ERC20 token address maps to exactly one vesting schedule
- **Open Permissions**: Anyone can create or modify vesting schedules
- **Eligible Addresses**: Only specific addresses can claim tokens for each schedule
- **Linear Vesting**: Tokens vest linearly after the cliff period
- **Real-time Calculation**: Vested amounts calculated on-demand

## Contract Interface

### Core Functions

#### `setVestingSchedule()`
Creates or updates a vesting schedule for a token.

```solidity
function setVestingSchedule(
    address token,
    uint256 totalAmount,
    uint256 startTime,
    uint256 cliffDuration,
    uint256 vestingDuration,
    address[] calldata eligibleAddresses
) external
```

**Parameters:**
- `token`: ERC20 token contract address
- `totalAmount`: Total tokens to vest per eligible user
- `startTime`: Unix timestamp when vesting begins
- `cliffDuration`: Cliff period in seconds (no vesting during this time)
- `vestingDuration`: Total vesting duration after cliff in seconds
- `eligibleAddresses`: Array of addresses eligible to claim tokens

**Example:**
```solidity
// Create a 1-year vesting schedule with 6-month cliff
// 1000 tokens per user, starting January 1, 2024
address[] memory eligible = new address[](2);
eligible[0] = 0x1234...;
eligible[1] = 0x5678...;

kernel.setVestingSchedule(
    0xTokenAddress,
    1000 * 10**18,        // 1000 tokens (assuming 18 decimals)
    1704067200,           // January 1, 2024 00:00:00 UTC
    15552000,             // 6 months cliff (180 days)
    31536000,             // 1 year vesting duration (365 days)
    eligible
);
```

#### `getVestedAmount()`
Returns the amount of tokens vested for a user at the current time.

```solidity
function getVestedAmount(address token, address user) public view returns (uint256)
```

**Returns:** Amount of tokens vested (0 if user is not eligible)

**Example:**
```solidity
uint256 vested = kernel.getVestedAmount(tokenAddress, userAddress);
```

#### `addEligibleAddress()`
Adds a new eligible address to an existing vesting schedule.

```solidity
function addEligibleAddress(address token, address eligibleAddress) external
```

#### `removeEligibleAddress()`
Removes an address from the eligible list.

```solidity
function removeEligibleAddress(address token, address eligibleAddress) external
```

### Query Functions

#### `getVestingSchedule()`
Returns the complete vesting schedule for a token.

```solidity
function getVestingSchedule(address token) external view returns (VestingSchedule memory)
```

#### `getEligibleAddresses()`
Returns all eligible addresses for a token's vesting schedule.

```solidity
function getEligibleAddresses(address token) external view returns (address[] memory)
```

#### `isAddressEligible()`
Checks if an address is eligible for a token's vesting schedule.

```solidity
function isAddressEligible(address token, address user) external view returns (bool)
```

#### `getAllTokens()`
Returns all tokens that have vesting schedules.

```solidity
function getAllTokens() external view returns (address[] memory)
```

#### `hasActiveSchedule()`
Checks if a token has an active vesting schedule.

```solidity
function hasActiveSchedule(address token) external view returns (bool)
```

#### `getVestingProgress()`
Returns vesting progress as a percentage (scaled by 1000 for precision).

```solidity
function getVestingProgress(address token) external view returns (uint256)
```

**Returns:** Progress percentage scaled by 1000 (100000 = 100.000%)

## Usage Examples

### Example 1: Employee Token Vesting

```solidity
// Setup 4-year employee vesting with 1-year cliff
address[] memory employees = new address[](3);
employees[0] = 0xEmployee1;
employees[1] = 0xEmployee2;
employees[2] = 0xEmployee3;

kernel.setVestingSchedule(
    companyTokenAddress,
    10000 * 10**18,       // 10,000 tokens per employee
    block.timestamp,      // Start immediately
    365 days,             // 1-year cliff
    3 * 365 days,         // 3 years vesting after cliff (4 years total)
    employees
);
```

### Example 2: Investor Token Release

```solidity
// Setup investor token release with 6-month cliff, 2-year vesting
address[] memory investors = new address[](5);
// ... populate investor addresses

kernel.setVestingSchedule(
    projectTokenAddress,
    50000 * 10**18,       // 50,000 tokens per investor
    1704067200,           // Specific start date
    180 days,             // 6-month cliff
    2 * 365 days,         // 2-year vesting
    investors
);
```

### Example 3: Community Rewards

```solidity
// Setup community rewards with no cliff, 1-year vesting
address[] memory community = new address[](100);
// ... populate community addresses

kernel.setVestingSchedule(
    rewardTokenAddress,
    1000 * 10**18,        // 1,000 tokens per member
    block.timestamp,      // Start immediately
    0,                    // No cliff
    365 days,             // 1-year linear vesting
    community
);
```

## Integration Patterns

### With TokenClaimContract

The kernel is designed to work with the `TokenClaimContract` through KRNL integration:

```solidity
// In TokenClaimContract
function claimTokens(
    KrnlPayload memory krnlPayload,
    address token,
    uint256 amount
) external onlyAuthorized(krnlPayload, abi.encode(token, msg.sender)) {
    // Kernel response contains vested amount for verification
    KernelResponse[] memory responses = abi.decode(krnlPayload.kernelResponses, (KernelResponse[]));
    
    for (uint i = 0; i < responses.length; i++) {
        if (responses[i].kernelId == VESTING_KERNEL_ID) {
            uint256 vestedAmount = abi.decode(responses[i].result, (uint256));
            // Verify claim against vested amount
            // ...
        }
    }
}
```

### Frontend Integration

```javascript
// Check if user is eligible
const isEligible = await vestingKernel.isAddressEligible(tokenAddress, userAddress);

// Get vested amount
const vestedAmount = await vestingKernel.getVestedAmount(tokenAddress, userAddress);

// Get complete schedule
const schedule = await vestingKernel.getVestingSchedule(tokenAddress);

// Calculate vesting progress
const progress = await vestingKernel.getVestingProgress(tokenAddress);
const progressPercent = progress / 1000; // Convert from scaled value
```

## Common Use Cases

### 1. Employee Stock Options
- **Cliff**: 1 year (standard for employee retention)
- **Vesting**: 3-4 years total
- **Amount**: Based on role and equity allocation

### 2. Investor Token Lockup
- **Cliff**: 6-12 months (prevent immediate selling)
- **Vesting**: 1-3 years
- **Amount**: Based on investment amount and token price

### 3. Advisor Compensation
- **Cliff**: 3-6 months
- **Vesting**: 1-2 years
- **Amount**: Based on advisory agreement

### 4. Community Incentives
- **Cliff**: 0-3 months
- **Vesting**: 6-12 months
- **Amount**: Based on participation level

### 5. Team Allocation
- **Cliff**: 6-12 months
- **Vesting**: 2-4 years
- **Amount**: Based on team member role

## Best Practices

### Schedule Design
1. **Appropriate Cliff**: Use cliffs to ensure commitment
2. **Reasonable Duration**: Balance retention with fairness
3. **Clear Start Times**: Use specific timestamps for coordination
4. **Proper Amounts**: Consider token economics and dilution

### Eligible Address Management
1. **Verify Addresses**: Double-check all addresses before adding
2. **Regular Updates**: Add/remove addresses as needed
3. **Documentation**: Keep records of who should be eligible
4. **Security**: Use multi-sig for critical address changes

### Integration Security
1. **Validate Inputs**: Always check token addresses and amounts
2. **Handle Errors**: Properly handle kernel response errors
3. **Access Control**: Implement appropriate permissions in claiming contracts
4. **Audit Integration**: Review KRNL integration code carefully

### Monitoring and Maintenance
1. **Track Progress**: Monitor vesting progress regularly
2. **Update Schedules**: Modify schedules when business needs change
3. **Eligible Address Hygiene**: Keep eligible lists current
4. **Event Monitoring**: Watch for schedule creation/modification events

## Events

The kernel emits several events for monitoring:

```solidity
event VestingScheduleCreated(
    address indexed token,
    address indexed creator,
    uint256 totalAmount,
    uint256 startTime,
    uint256 cliffDuration,
    uint256 vestingDuration,
    address[] eligibleAddresses
);

event VestingScheduleUpdated(
    address indexed token,
    address indexed updater,
    uint256 totalAmount,
    uint256 startTime,
    uint256 cliffDuration,
    uint256 vestingDuration,
    address[] eligibleAddresses
);

event EligibleAddressAdded(
    address indexed token,
    address indexed eligibleAddress,
    address indexed addedBy
);

event EligibleAddressRemoved(
    address indexed token,
    address indexed eligibleAddress,
    address indexed removedBy
);
```

## Security Considerations

### Open Permissions
- Anyone can create/modify schedules
- Consider governance for critical tokens
- Monitor for malicious schedule modifications

### Eligible Address Security
- Validate all addresses before adding
- Use checksummed addresses
- Consider multi-sig for address management

### Integration Security
- Properly validate kernel responses
- Handle edge cases (zero amounts, invalid tokens)
- Implement reentrancy protection in claiming contracts

## Troubleshooting

### Common Issues

**Q: `getVestedAmount()` returns 0 for eligible user**
- Check if current time is past start time + cliff duration
- Verify user is in eligible addresses list
- Confirm schedule is active

**Q: Cannot add eligible address**
- Ensure schedule exists and is active
- Check that address is not already eligible
- Verify address is not zero address

**Q: Schedule creation fails**
- Check all parameters are valid (non-zero amounts, valid timestamps)
- Ensure at least one eligible address is provided
- Verify token address is valid

**Q: Vesting calculation seems incorrect**
- Confirm cliff period has passed
- Check vesting duration and start time
- Verify linear vesting calculation: `(totalAmount * timeElapsed) / vestingDuration`

### Gas Optimization Tips

1. **Batch Operations**: Add multiple eligible addresses in single transaction
2. **Efficient Queries**: Use view functions for off-chain calculations
3. **Minimal Updates**: Only update schedules when necessary
4. **Event Filtering**: Use indexed parameters for efficient event filtering

## Migration and Upgrades

### Schedule Migration
If you need to migrate schedules:
1. Export current schedule data
2. Deactivate old schedules
3. Create new schedules with updated parameters
4. Update eligible addresses as needed

### Contract Upgrades
The kernel is not upgradeable by design for security. For major changes:
1. Deploy new kernel contract
2. Update KRNL registry with new kernel ID
3. Update claiming contracts to use new kernel
4. Migrate schedules to new contract

## Conclusion

The TokenVestingKernel provides a flexible, secure foundation for token vesting systems. Its simple one-schedule-per-token architecture makes it easy to understand and integrate, while the eligible address system provides necessary access control. Combined with the TokenClaimContract and KRNL integration, it forms a complete token vesting solution suitable for various use cases from employee compensation to investor token releases. 