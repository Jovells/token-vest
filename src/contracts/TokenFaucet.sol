// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DonationToken.sol";

/**
 * @title TokenFaucet
 * @dev Allows users to request DonationTokens with a cooldown period
 */
contract TokenFaucet is Ownable {
    // The token being distributed
    DonationToken public token;
    
    // Amount of tokens distributed per request
    uint256 public amountPerRequest;
    
    // Cooldown period between requests (in seconds)
    uint256 public requestCooldown;
    
    // Mapping to track when a user last requested tokens
    mapping(address => uint256) public lastRequestTime;
    
    // Events
    event TokensRequested(address indexed user, uint256 amount);
    event FaucetConfigUpdated(uint256 newAmount, uint256 newCooldown);
    event FaucetRefilled(uint256 amount);
    
    /**
     * @dev Constructor to initialize the faucet
     * @param _tokenAddress Address of the DonationToken contract
     * @param _amountPerRequest Amount of tokens to distribute per request
     * @param _requestCooldown Cooldown period between requests (in seconds)
     */
    constructor(
        address _tokenAddress,
        uint256 _amountPerRequest,
        uint256 _requestCooldown
    ) Ownable(msg.sender) {
        token = DonationToken(_tokenAddress);
        amountPerRequest = _amountPerRequest;
        requestCooldown = _requestCooldown;
    }
    
    /**
     * @dev Allow a user to request tokens from the faucet
     * @return success True if the request was successful
     */
    function requestTokens() external returns (bool) {
        // Check if the user is on cooldown
        require(
            block.timestamp >= lastRequestTime[msg.sender] + requestCooldown,
            "TokenFaucet: Cooldown period not over yet"
        );
        
        // Check if the faucet has enough tokens
        require(
            token.balanceOf(address(this)) >= amountPerRequest,
            "TokenFaucet: Insufficient tokens in faucet"
        );
        
        // Update the last request time
        lastRequestTime[msg.sender] = block.timestamp;
        
        // Transfer tokens to the user
        require(
            token.transfer(msg.sender, amountPerRequest),
            "TokenFaucet: Token transfer failed"
        );
        
        // Emit event
        emit TokensRequested(msg.sender, amountPerRequest);
        
        return true;
    }
    
    /**
     * @dev Returns the time remaining until a user can request tokens again
     * @param user Address of the user
     * @return timeRemaining Time remaining in seconds, 0 if can request now
     */
    function timeUntilRequest(address user) external view returns (uint256) {
        uint256 lastRequest = lastRequestTime[user];
        
        // If user never requested or cooldown is over, return 0
        if (lastRequest == 0 || block.timestamp >= lastRequest + requestCooldown) {
            return 0;
        }
        
        // Return time remaining
        return (lastRequest + requestCooldown) - block.timestamp;
    }
    
    /**
     * @dev Update the faucet configuration (only owner)
     * @param _amountPerRequest New amount per request
     * @param _requestCooldown New cooldown period
     */
    function updateFaucetConfig(
        uint256 _amountPerRequest,
        uint256 _requestCooldown
    ) external onlyOwner {
        amountPerRequest = _amountPerRequest;
        requestCooldown = _requestCooldown;
        
        emit FaucetConfigUpdated(_amountPerRequest, _requestCooldown);
    }
    
    /**
     * @dev Allows the owner to refill the faucet by transferring tokens from their account
     * @param amount Amount of tokens to refill
     */
    function refillFaucet(uint256 amount) external onlyOwner {
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "TokenFaucet: Refill transfer failed"
        );
        
        emit FaucetRefilled(amount);
    }
    
    /**
     * @dev Returns the current token balance of the faucet
     * @return balance Token balance
     */
    function getFaucetBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
} 