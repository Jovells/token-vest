// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IKernel
 * @dev Interface for KRNL on-chain kernels
 */
interface IKernel {
    /**
     * @dev Execute kernel logic and return a response
     * @param params The input data for the kernel execution
     * @return response The kernel's response data
     */
    function execute(bytes calldata params) external view returns (bytes memory);
} 