// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DonationToken
 * @dev Custom ERC20 token for the Limited Donation dApp
 */
contract DonationToken is ERC20, Ownable {
    /**
     * @dev Constructor that mints initial tokens to the deployer
     * @param initialSupply Initial token supply to mint
     */
    constructor(uint256 initialSupply) ERC20("DonationToken", "DONATE") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Allows the owner to mint additional tokens
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
} 