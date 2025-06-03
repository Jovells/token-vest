# Frequently Asked Questions (FAQ)

## General Questions

### What is the Multi-Token Vesting Platform?
The Multi-Token Vesting Platform is a decentralized application that allows for the creation and management of token vesting schedules for any ERC20 token. It uses KRNL (Kernel) technology to verify vesting eligibility and enforce vesting rules on-chain.

### Which networks are supported?
Currently, the platform is deployed on Sepolia testnet. Support for mainnet and other networks may be added in the future.

### What tokens can I use?
You can create vesting schedules for any ERC20 token. The platform includes a demo VEST token for testing purposes.

## Vesting Schedules

### How do vesting schedules work?
Each token address has one vesting schedule that applies to all eligible addresses. The schedule defines:
- **Total Amount**: How many tokens each eligible user can vest
- **Start Time**: When vesting begins
- **Cliff Duration**: Period before any tokens become vested
- **Vesting Duration**: Total time over which tokens vest linearly

### Who can create vesting schedules?
Anyone can create or modify vesting schedules for any token. The platform has open permissions for schedule management.

### Can I edit an existing vesting schedule?
Yes, you can edit existing vesting schedules through the admin interface. However, be careful as changes affect all eligible users.

### What happens if I create multiple schedules for the same token?
Only one schedule per token address is supported. Creating a new schedule for an existing token will overwrite the previous schedule.

## Eligibility and Claims

### How does eligibility work?
Only addresses specifically added to a token's eligible addresses list can claim tokens from that vesting schedule. You must be on the list to participate.

### How often can I claim tokens?
You can claim your vested tokens as frequently as you want, up to the amount that has vested according to the schedule.

### What happens if I'm not eligible?
If you're not on the eligible addresses list for a token's vesting schedule, you cannot claim any tokens from that schedule. The admin can add you to the list if appropriate.

### Can I claim more than what's vested?
No, the KRNL kernel verifies that you can only claim up to the amount that has vested according to the schedule.

## Deposits and Withdrawals

### How do token deposits work?
Anyone can deposit tokens into the claim contract to fund vesting schedules. Deposited tokens are tracked per user and can only be withdrawn by the depositor.

### Can I withdraw my deposited tokens?
Yes, only you can withdraw tokens that you have deposited. The system tracks your deposits separately from the vesting claims.

### What's the difference between deposits and claims?
- **Deposits**: Tokens you put into the contract to fund vesting schedules
- **Claims**: Tokens you receive based on vesting schedules (if you're eligible)

## Technical Questions

### What is KRNL?
KRNL is a kernel-based authorization system that verifies vesting eligibility off-chain and provides cryptographic proof for on-chain verification.

### How secure is the platform?
The platform uses established smart contract patterns and KRNL's proven authorization system. However, as with all DeFi applications, use at your own risk and only with funds you can afford to lose.

### What wallet do I need?
You need a Web3 wallet like MetaMask that supports Sepolia testnet. Make sure to add Sepolia network to your wallet.

### How do I get test tokens?
You can mint demo VEST tokens directly through the interface, or use a Sepolia faucet for ETH to pay for gas fees.

## Admin Features

### Who can access admin features?
Admin features are open to everyone. There are no access restrictions on creating or managing vesting schedules.

### How do I add eligible addresses?
In the admin panel, you can enter addresses manually (comma-separated) or import them from a CSV file.

### What's the vesting calculator?
The calculator helps you preview how vesting will work with different parameters, showing exactly how much will be vested at any given time.

### Can I export schedule data?
Yes, you can export vesting schedule information to CSV format for backup or analysis purposes.

## Troubleshooting

### Why can't I claim tokens?
Check that:
1. You're connected to Sepolia testnet
2. You're eligible for the token's vesting schedule
3. Tokens have actually vested (check the vesting progress)
4. You have enough ETH for gas fees

### Why don't I see any tokens?
Make sure:
1. You're connected to the correct network (Sepolia)
2. Vesting schedules exist for the tokens you're looking for
3. You're looking in the right section (User vs Admin view)

### Transaction failed - what do I do?
Common solutions:
1. Increase gas limit or gas price
2. Check you have enough ETH for gas
3. Ensure you've approved the contract to spend your tokens (for deposits)
4. Wait a moment and try again if the network is congested

### How do I get help?
- Check this FAQ first
- Review the README.md for setup instructions
- Check the DEPLOYMENT_GUIDE.md for technical details
- Look at the contract code for specific implementation details

## Best Practices

### Creating Vesting Schedules
- Double-check all parameters before creating
- Ensure eligible addresses are correct
- Consider the cliff and vesting periods carefully
- Test with small amounts first

### Managing Tokens
- Keep track of your deposits vs claims
- Only deposit tokens you're willing to lock in the contract
- Regularly check vesting progress if you're eligible
- Be mindful of gas costs for frequent claims

### Security
- Always verify contract addresses
- Don't share your private keys or seed phrases
- Be cautious with large amounts on testnet
- Understand that smart contracts can have bugs

## Token-Specific Information

### VEST Token (Demo)
- Symbol: VEST
- Purpose: Demonstration and testing
- Features: Public minting available
- Network: Sepolia testnet only

### Adding Custom Tokens
You can add any ERC20 token by entering its contract address. The platform will attempt to read the token's metadata automatically.

---

*This FAQ is regularly updated. If you have questions not covered here, please refer to the documentation or create an issue in the project repository.* 