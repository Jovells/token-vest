// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MockKRNLAuth
 * @dev Mock contract for testing KRNL authorization without valid signatures
 */
contract MockKRNLAuth {
    bool private authResult;
    
    /**
     * @dev Constructor
     */
    constructor() {
        authResult = true; // Default to success
    }
    
    /**
     * @dev Set the result to return for signature verification
     * @param _result The result value to return
     */
    function setAuthResult(bool _result) external {
        authResult = _result;
    }
    
    /**
     * @dev Overrides the ECDSA.recover to always return this contract's address
     * @param digest The message digest to recover
     * @param signature The signature to use in recovery
     * @return The address of this contract (always)
     */
    function recover(bytes32 digest, bytes memory signature) external view returns (address) {
        return address(this);
    }
} 