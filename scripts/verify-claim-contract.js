const { run } = require("hardhat");

async function main() {
  const contractAddress = process.env.VITE_TOKEN_CLAIM_CONTRACT_ADDRESS;
  const tokenAuthorityPublicKey = process.env.TOKEN_AUTHORITY_PUBLIC_KEY;
  const vestingKernelId = process.env.VESTING_KERNEL_ID || "1";
  const vestingKernelAddress = process.env.VITE_TOKEN_VESTING_KERNEL_ADDRESS;
  
  if (!contractAddress) {
    throw new Error("VITE_TOKEN_CLAIM_CONTRACT_ADDRESS not found in environment");
  }
  
  if (!tokenAuthorityPublicKey) {
    throw new Error("TOKEN_AUTHORITY_PUBLIC_KEY not found in environment");
  }
  
  if (!vestingKernelAddress) {
    throw new Error("VITE_TOKEN_VESTING_KERNEL_ADDRESS not found in environment");
  }

  console.log("Verifying TokenClaimContract at:", contractAddress);
  console.log("Constructor arguments:");
  console.log(`- Token Authority Public Key: ${tokenAuthorityPublicKey}`);
  console.log(`- Vesting Kernel ID: ${vestingKernelId}`);
  console.log(`- Vesting Kernel Address: ${vestingKernelAddress}`);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [
        tokenAuthorityPublicKey,
        vestingKernelId,
        vestingKernelAddress
      ],
    });
    console.log("TokenClaimContract verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("TokenClaimContract is already verified!");
    } else {
      console.error("Verification failed:", error);
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  }); 