const { run } = require("hardhat");

async function main() {
  const contractAddress = process.env.VITE_TOKEN_VESTING_KERNEL_ADDRESS;
  
  if (!contractAddress) {
    throw new Error("VITE_TOKEN_VESTING_KERNEL_ADDRESS not found in environment");
  }

  console.log("Verifying TokenVestingKernel at:", contractAddress);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // No constructor arguments
    });
    console.log("TokenVestingKernel verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("TokenVestingKernel is already verified!");
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