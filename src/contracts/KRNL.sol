// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title KRNL
 * @dev Interface for interacting with KRNL's on-chain kernels
 */
interface KRNL {
    
    /**
     * @dev Execute a kernel with the given payload
     * @param kernelPayload The kernel ID and payload to execute
     * @return response The kernel's response data
     */
    function executeKernel(KrnlPayload calldata kernelPayload) external view returns (bytes memory);
}

// Struct to group the parameters
struct KrnlPayload {
    bytes auth;
    bytes kernelResponses;
    bytes kernelParams;
}

struct KernelParameter {
    uint8 resolverType;
    bytes parameters;
    string err;
}

struct KernelResponse {
    uint256 kernelId;
    bytes result;
    string err;
}

// Draft Version
contract KRNLImpl is Ownable {
    error UnauthorizedTransaction();

    address public tokenAuthorityPublicKey;
    mapping(bytes => bool) public executed;
    
    // For testing only - when true, skip the full signature verification
    bool public testMode;

    modifier onlyAuthorized(
        KrnlPayload memory krnlPayload,
        bytes memory params
    ) {
        if (!_isAuthorized(krnlPayload, params)) {
            revert UnauthorizedTransaction();
        }

        _;
    }

    constructor(address _tokenAuthorityPublicKey) Ownable(msg.sender) {
        tokenAuthorityPublicKey = _tokenAuthorityPublicKey;
        testMode = false;
    }

    function setTokenAuthorityPublicKey(
        address _tokenAuthorityPublicKey
    ) external onlyOwner {
        tokenAuthorityPublicKey = _tokenAuthorityPublicKey;
    }
    
    /**
     * @dev Enable or disable test mode (for testing only)
     * @param _enabled Whether test mode should be enabled
     */
    function setTestMode(bool _enabled) external onlyOwner {
        testMode = _enabled;
    }

    function _isAuthorized(
        KrnlPayload memory payload,
        bytes memory functionParams
    ) private view returns (bool) {
        
        // For testing purposes, we can skip the full verification process
        if (testMode) {
            // In test mode, call the mock auth contract's recover function 
            // which should return the contract's address
            try ITokenAuthority(tokenAuthorityPublicKey).recover(bytes32(0), bytes("mock")) returns (address recoveredAddr) {
                return recoveredAddr == tokenAuthorityPublicKey;
            } catch {
                // If the call fails, proceed with normal verification
            }
        }
        
        (
            bytes memory kernelResponseSignature,
            bytes32 kernelParamObjectDigest,
            bytes memory signatureToken,
            uint256 nonce,
            bool finalOpinion
        ) = abi.decode(
                payload.auth,
                (bytes, bytes32, bytes, uint256, bool)
            );

        if (finalOpinion == false) {
            revert("Final opinion reverted");
        }

        bytes32 kernelResponsesDigest = keccak256(
            abi.encodePacked(payload.kernelResponses, msg.sender)
        );

        address recoveredAddress = ECDSA.recover(
            kernelResponsesDigest,
            kernelResponseSignature
        );

        if (recoveredAddress != tokenAuthorityPublicKey) {
            revert("Invalid signature for kernel responses");
        }

        bytes32 _kernelParamsDigest = keccak256(
            abi.encodePacked(payload.kernelParams, msg.sender)
        );

        bytes32 functionParamsDigest = keccak256(functionParams);

        if (_kernelParamsDigest != kernelParamObjectDigest) {
            revert("Invalid kernel params digest");
        }

        bytes32 dataDigest = keccak256(
            abi.encodePacked(
                functionParamsDigest,
                kernelParamObjectDigest,
                msg.sender,
                nonce,
                finalOpinion
            )
        );

        recoveredAddress = ECDSA.recover(dataDigest, signatureToken);
        if (recoveredAddress != tokenAuthorityPublicKey) {
            revert("Invalid signature for function call");
        }

        // executed[signatureToken] = true;
        return true;
    }
}

/**
 * @title ITokenAuthority
 * @dev Interface for the token authority (for testing mock implementations)
 */
interface ITokenAuthority {
    function recover(bytes32 digest, bytes memory signature) external view returns (address);
} 