import { ethers } from "krnl-sdk";

// Function to mimic _isAuthorized in JavaScript
export async function isAuthorized(
  payload : { auth: string, kernelResponses: string, kernelParams: string }, // KrnlPayload: { auth: string, kernelResponses: string, kernelParams: string }
  functionParams: string, // bytes (hex string)
  msgSender: string // address (string, e.g., "0x...")
) {
  const tokenAuthorityPublicKey = import.meta.env.VITE_TOKEN_AUTHORITY_PUBLIC_KEY
  try {
    // Validate inputs
    if (!payload.auth || !payload.kernelResponses || !payload.kernelParams || !functionParams) {
      throw new Error("Missing payload or functionParams");
    }
    if (!ethers.isAddress(tokenAuthorityPublicKey) || !ethers.isAddress(msgSender)) {
      throw new Error("Invalid address for tokenAuthorityPublicKey or msgSender");
    }

    // Step 1: Decode payload.auth
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const authTypes = ["bytes", "bytes32", "bytes", "uint256", "bool"];
    let kernelResponseSignature, kernelParamObjectDigest, signatureToken, nonce, finalOpinion;
    try {
      [
        kernelResponseSignature,
        kernelParamObjectDigest,
        signatureToken,
        nonce,
        finalOpinion
      ] = abiCoder.decode(authTypes, payload.auth);
    } catch (error: any) {
      throw new Error("Failed to decode payload.auth: " + error.message);
    }

    // Step 2: Check finalOpinion
    if (!finalOpinion) {
      throw new Error("Final opinion reverted");
    }

    // Step 3: Compute kernelResponsesDigest
    // Solidity: keccak256(abi.encodePacked(payload.kernelResponses, msg.sender))
    const kernelResponsesPacked = ethers.solidityPacked(
      ["bytes", "address"],
      [payload.kernelResponses, msgSender]
    );
    const kernelResponsesDigest = ethers.keccak256(kernelResponsesPacked);

    // Step 4: Recover signer for kernelResponsesDigest
    let recoveredAddress;
    try {
      recoveredAddress = ethers.recoverAddress(kernelResponsesDigest, kernelResponseSignature);
      console.log({recoveredAddress2: recoveredAddress, kernelResponseSignature, kernelResponsesDigest})
    } catch (error: any) {
      throw new Error("Invalid kernelResponseSignature: " + error.message);
    }
    if (recoveredAddress.toLowerCase() !== tokenAuthorityPublicKey.toLowerCase()) {
      throw new Error("Invalid signature for kernel responses");
    }

    // Step 5: Compute _kernelParamsDigest and compare with kernelParamObjectDigest
    // Solidity: keccak256(abi.encodePacked(payload.kernelParams, msg.sender))
    const kernelParamsPacked = ethers.solidityPacked(
      ["bytes", "address"],
      [payload.kernelParams, msgSender]
    );
    const _kernelParamsDigest = ethers.keccak256(kernelParamsPacked);
    if (_kernelParamsDigest !== kernelParamObjectDigest) {
      throw new Error("Invalid kernel params digest");
    }

    // Step 6: Compute functionParamsDigest
    // Solidity: keccak256(functionParams)
    const functionParamsDigest = ethers.keccak256(functionParams);

    // Step 7: Compute dataDigest
    // Solidity: keccak256(abi.encodePacked(functionParamsDigest, kernelParamObjectDigest, msg.sender, nonce, finalOpinion))
    const dataDigestPacked = ethers.solidityPacked(
      ["bytes32", "bytes32", "address", "uint256", "bool"],
      [functionParamsDigest, kernelParamObjectDigest, msgSender, nonce, finalOpinion]
    );
    const dataDigest = ethers.keccak256(dataDigestPacked);

    // Step 8: Recover signer for dataDigest
    try {
      recoveredAddress = ethers.recoverAddress(dataDigest, signatureToken);
    } catch (error: any) {
      throw new Error("Invalid signatureToken: " + error.message);
    }
    if (recoveredAddress.toLowerCase() !== tokenAuthorityPublicKey.toLowerCase()) {
      throw new Error("Invalid signature for function call");
    }


    return true;
  } catch (error: any) {
    console.error("Authorization failed:", error.message);
    return false;
  }
}

