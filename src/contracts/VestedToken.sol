// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VestedToken
 * @dev Demo ERC20 token for the Token Vesting Platform
 * @notice This token serves as an example for the vesting system
 */
contract VestedToken is ERC20, Ownable {
    
    // Maximum supply cap for the token (1 billion tokens)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount);
    
    /**
     * @dev Constructor that sets up the token with name and symbol
     * @param initialSupply Initial token supply to mint to deployer
     */
    constructor(uint256 initialSupply) ERC20("VestedToken", "VEST") Ownable(msg.sender) {
        require(initialSupply <= MAX_SUPPLY, "Initial supply exceeds maximum");
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
            emit TokensMinted(msg.sender, initialSupply);
        }
    }
    
    /**
     * @dev Allows the owner to mint additional tokens
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed maximum supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Public function to mint tokens for demo purposes
     * @param amount Amount of tokens to mint to caller
     * @notice Limited to 1000 tokens per call to prevent abuse
     */
    function mintDemo(uint256 amount) external {
        require(amount <= 1000 * 10**18, "Demo mint limited to 1000 tokens");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed maximum supply");
        
        _mint(msg.sender, amount);
        emit TokensMinted(msg.sender, amount);
    }
    
    /**
     * @dev Batch mint tokens to multiple addresses (owner only)
     * @param recipients Array of addresses to receive tokens
     * @param amounts Array of amounts corresponding to each recipient
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays must have same length");
        require(recipients.length > 0, "No recipients provided");
        
        uint256 totalMintAmount = 0;
        
        // Calculate total amount to ensure we don't exceed max supply
        for (uint256 i = 0; i < amounts.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            totalMintAmount += amounts[i];
        }
        
        require(totalSupply() + totalMintAmount <= MAX_SUPPLY, "Would exceed maximum supply");
        
        // Mint to each recipient
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Returns the maximum supply of tokens
     * @return The maximum supply
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
    
    /**
     * @dev Returns the remaining tokens that can be minted
     * @return The remaining mintable amount
     */
    function remainingMintable() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
} 