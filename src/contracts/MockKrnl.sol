// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KRNL.sol";

/**
 * @title MockKrnl
 * @dev Mock implementation of the KRNL interface for testing
 */
contract MockKrnl is KRNL {
    // Flag to control the response (true = within limit, false = exceeded limit)
    bool private responseValue;
    
    /**
     * @dev Constructor for the mock KRNL contract
     */
    constructor() {
        responseValue = true;
    }
    
    /**
     * @dev Set the response value for testing
     * @param _response The boolean value to return
     */
    function setResponse(bool _response) external {
        responseValue = _response;
    }
    
    /**
     * @dev Implements the required executeKernel function from KRNL interface
     * @param kernelPayload The kernel ID and payload to execute
     * @return response The kernel's response data
     */
    function executeKernel(KrnlPayload calldata kernelPayload) external view returns (bytes memory) {
        // Mock implementation - just return encoded response value
        return abi.encode(responseValue);
    }
    
    /**
     * @dev Mock implementation of the kernel validation
     * @param krnlPayload The KRNL payload (ignored in this mock)
     * @param functionParams The function parameters (ignored in this mock)
     * @return True if the responseValue is true, false otherwise
     */
    function validateTransaction(
        KrnlPayload calldata krnlPayload, 
        bytes calldata functionParams
    ) external view returns (bool) {
        // Ignore the payload and parameters, just return the predefined response
        return responseValue;
    }
    
    /**
     * @dev Mock implementation to create a kernel response for testing
     * @param kernelId The kernel ID to include in the response
     * @return payload A KRNL payload with the response
     */
    function createMockKrnlPayload(uint256 kernelId) external view returns (bytes memory, bytes memory, bytes memory) {
        // Instead of returning a struct which might cause issues with ethers.js,
        // return the individual payload components
        
        // Create auth bytes
        bytes memory auth = abi.encode(
            bytes("mock_signature"), 
            bytes32(0), 
            bytes("mock_token"), 
            uint256(0), 
            true
        );
        
        // Create a mock kernel response
        KernelResponse memory response = KernelResponse({
            kernelId: kernelId,
            result: abi.encode(responseValue),
            err: ""
        });
        
        // Encode the responses array
        bytes memory kernelResponses = abi.encode(response);
        
        // Create mock kernel parameters
        bytes memory kernelParams = abi.encode(
            KernelParameter({
                resolverType: 0,
                parameters: bytes(""),
                err: ""
            })
        );
        
        // Return the individual components
        return (auth, kernelResponses, kernelParams);
    }
} 