// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {KRNL, KrnlPayload, KernelParameter, KernelResponse} from "./KRNL.sol";

/**
 * @title TokenClaimContract
 * @dev A multi-token vesting claim contract that uses the Token Vesting Kernel to verify claims
 * @notice This contract holds tokens and allows users to claim vested amounts based on kernel verification
 */
contract TokenClaimContract is KRNL, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // The ID of the Token Vesting Kernel in the KRNL registry
    uint256 public vestingKernelId;
    
    
    // Mapping of depositor => token => amount deposited
    mapping(address => mapping(address => uint256)) public userDeposits;
    
    // Mapping of user => token => amount claimed
    mapping(address => mapping(address => uint256)) public userClaims;
    
    // Mapping of token => total amount deposited
    mapping(address => uint256) public totalDeposits;
    
    // Mapping of token => total amount claimed
    mapping(address => uint256) public totalClaims;
    
    // Array to track tokens that have ever had deposits (for enumeration)
    address[] private _tokensWithDeposits;
    mapping(address => bool) private _tokenExists;
    
    // Events
    event TokensDeposited(address indexed depositor, address indexed token, uint256 amount);
    event TokensClaimed(address indexed claimer, address indexed token, uint256 amount);
    event TokensWithdrawn(address indexed withdrawer, address indexed token, uint256 amount);
    event KernelUpdated(uint256 indexed oldKernelId, uint256 indexed newKernelId);
    event KernelAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event EmergencyWithdrawal(address indexed token, uint256 amount, address indexed to);
    
    /**
     * @dev Constructor to initialize the contract
     * @param _tokenAuthorityPublicKey Address of the token authority public key
     * @param _vestingKernelId ID of the Token Vesting Kernel in the KRNL registry
     */
    constructor(
        address _tokenAuthorityPublicKey,
        uint256 _vestingKernelId
    ) KRNL(_tokenAuthorityPublicKey) {
        vestingKernelId = _vestingKernelId;
    }
    
    /**
     * @dev Deposit tokens into the contract for vesting distribution
     * @param token Address of the ERC20 token to deposit
     * @param amount Amount of tokens to deposit
     */
    function depositTokens(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(msg.sender) >= amount, "Insufficient token balance");
        require(tokenContract.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        
        // Add token to enumeration list if not already present
        if (!_tokenExists[token]) {
            _tokensWithDeposits.push(token);
            _tokenExists[token] = true;
        }
        
        // Transfer tokens to this contract
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update tracking
        userDeposits[msg.sender][token] += amount;
        totalDeposits[token] += amount;
        
        emit TokensDeposited(msg.sender, token, amount);
    }
    
    /**
     * @dev Claim vested tokens using KRNL kernel verification
     * @param krnlPayload The KRNL payload for authorization
     * @param token Address of the token to claim
     * @param amount Amount to claim
     */
    function claimTokens(
        KrnlPayload memory krnlPayload,
        address token,
        uint256 amount
    ) 
        external 
        nonReentrant
        onlyAuthorized(krnlPayload, abi.encode(token, amount))
    {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalDeposits[token] > 0, "No deposits for this token");
        
        // Decode response from kernel to get vested amount
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
        
        require(vestedAmount > 0, "No tokens vested yet");
        
        // Calculate how much user can claim (vested - already claimed)
        uint256 alreadyClaimed = userClaims[msg.sender][token];
        uint256 claimable = vestedAmount > alreadyClaimed ? vestedAmount - alreadyClaimed : 0;
        
        require(claimable >= amount, "Claiming more than vested amount");
        
        // Check if contract has enough tokens
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        // Update claimed amounts
        userClaims[msg.sender][token] += amount;
        totalClaims[token] += amount;
        
        // Transfer tokens to user
        tokenContract.safeTransfer(msg.sender, amount);
        
        emit TokensClaimed(msg.sender, token, amount);
    }
    
    /**
     * @dev Withdraw deposited tokens (only depositor can withdraw their deposits)
     * @param token Address of the token to withdraw
     * @param amount Amount to withdraw
     */
    function withdrawTokens(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(userDeposits[msg.sender][token] >= amount, "Insufficient deposit balance");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        // Update deposit tracking
        userDeposits[msg.sender][token] -= amount;
        totalDeposits[token] -= amount;
        
        // Transfer tokens back to depositor
        tokenContract.safeTransfer(msg.sender, amount);
        
        emit TokensWithdrawn(msg.sender, token, amount);
    }
    
    /**
     * @dev Get user's claimed amount for a token
     * @param user User address
     * @param token Token address
     * @return Amount already claimed by the user
     * @notice Use off-chain calculation with kernel data to determine actual claimable amount
     */
    function getUserClaimedAmount(address user, address token) external view returns (uint256) {
        return userClaims[user][token];
    }
    
    /**
     * @dev Get user's total claims for a token
     * @param user User address
     * @param token Token address
     * @return Total amount claimed
     */
    function getUserClaims(address user, address token) external view returns (uint256) {
        return userClaims[user][token];
    }
    
    /**
     * @dev Get user's total deposits for a token
     * @param user User address
     * @param token Token address
     * @return Total amount deposited
     */
    function getUserDeposits(address user, address token) external view returns (uint256) {
        return userDeposits[user][token];
    }
    
    
    /**
     * @dev Get contract's balance for a specific token
     * @param token Token address
     * @return Contract's token balance
     */
    function getContractBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @dev Update the vesting kernel ID (only owner)
     * @param _newKernelId New kernel ID
     */
    function updateKernelId(uint256 _newKernelId) external onlyOwner {
        uint256 oldKernelId = vestingKernelId;
        vestingKernelId = _newKernelId;
        
        emit KernelUpdated(oldKernelId, _newKernelId);
    }
    
    
    /**
     * @dev Emergency withdrawal function (only owner)
     * @param token Token address
     * @param amount Amount to withdraw
     * @param to Address to send tokens to
     */
    function emergencyWithdraw(address token, uint256 amount, address to) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(to != address(0), "Invalid recipient address");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        tokenContract.safeTransfer(to, amount);
        
        emit EmergencyWithdrawal(token, amount, to);
    }
} 