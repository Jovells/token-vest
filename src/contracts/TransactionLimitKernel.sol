// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IKernel.sol";

/**
 * @title TransactionLimitKernel
 * @dev On-chain kernel that tracks and limits user transactions to 100 tokens per 24 hours
 */
contract TransactionLimitKernel is IKernel {
    // Maximum transaction amount per user in 24 hours (100 tokens with 18 decimals)
    uint256 public constant MAX_TRANSACTION_LIMIT = 100 * 10**18;
    
    // Time window for transaction limits (24 hours in seconds)
    uint256 public constant TIME_WINDOW = 24 hours;
    
    // Mapping to track user transactions: user address => timestamp => amount
    mapping(address => mapping(uint256 => uint256)) private userDailyTransactions;
    
    // Mapping to track the last transaction timestamp for each user
    mapping(address => uint256) private lastTransactionTimestamp;
    
    /**
     * @dev Execute kernel logic to check if a transaction exceeds the user's daily limit
     * @param params Encoded data containing user address and transaction amount
     * @return response Encoded boolean indicating if transaction is within limits
     */
    function execute(bytes calldata params) external view override returns (bytes memory) {
        // Decode params: [user address, transaction amount]
        (address user, uint256 amount) = abi.decode(params, (address, uint256));
        
        // Check if transaction is within limits
        bool isWithinLimit = checkTransactionLimit(user, amount);
        
        // Return encoded boolean response
        return abi.encode(isWithinLimit);
    }
    
    /**
     * @dev Check if a transaction is within the user's daily limit
     * @param user Address of the user
     * @param amount Transaction amount
     * @return True if transaction is within limits, false otherwise
     */
    function checkTransactionLimit(address user, uint256 amount) public view returns (bool) {
        uint256 currentDay = block.timestamp / TIME_WINDOW;
        uint256 lastDay = lastTransactionTimestamp[user] / TIME_WINDOW;
        
        // If this is a new day, the user can spend up to the limit
        if (currentDay > lastDay) {
            return amount <= MAX_TRANSACTION_LIMIT;
        }
        
        // Get user's total transactions for the current day
        uint256 totalToday = userDailyTransactions[user][currentDay];
        
        // Check if the new transaction would exceed the limit
        return (totalToday + amount) <= MAX_TRANSACTION_LIMIT;
    }
    
    /**
     * @dev Record a transaction for a user (called by dApps using this kernel)
     * @param user Address of the user
     * @param amount Transaction amount
     */
    function recordTransaction(address user, uint256 amount) external {
        uint256 currentDay = block.timestamp / TIME_WINDOW;
        
        // Update user's transaction total for the current day
        userDailyTransactions[user][currentDay] += amount;
        
        // Update last transaction timestamp
        lastTransactionTimestamp[user] = block.timestamp;
    }
} 