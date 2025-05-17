// Script to verify the Transaction Limit Kernel contract on Etherscan
const { Network } = require("ethers");
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const kernelAddress = process.env.TRANSACTION_LIMIT_KERNEL_ADDRESS;
  
  if (!kernelAddress) {
    console.error("Error: TRANSACTION_LIMIT_KERNEL_ADDRESS must be set in .env file");
    process.exit(1);
  }

  console.log(`Verifying Transaction Limit Kernel at address: ${kernelAddress}`);

  try {
    // Verify the contract with no constructor arguments
    await hre.run("verify:verify", {
      address: kernelAddress,
      constructorArguments: [],
      apiKey: process.env.ETHERSCAN_API_KEY,
    });
    
    console.log("Transaction Limit Kernel verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Error during verification:", error);
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 