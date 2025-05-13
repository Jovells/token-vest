// Script to deploy the Transaction Limit Kernel
const hre = require("hardhat");

async function main() {
  console.log("Deploying Transaction Limit Kernel...");

  // Deploy the kernel contract
  const TransactionLimitKernel = await hre.ethers.getContractFactory("TransactionLimitKernel");
  const kernel = await TransactionLimitKernel.deploy();
  await kernel.waitForDeployment();

  const kernelAddress = await kernel.getAddress();
  console.log(`Transaction Limit Kernel deployed to: ${kernelAddress}`);
  
  console.log("\n----------------------------------------------------");
  console.log("Next steps:");
  console.log("1. Register the kernel with KRNL using the CLI:");
  console.log(`   krnl register-kernel --address ${kernelAddress} --network sepolia`);
  console.log("2. Save the kernel ID returned by the CLI");
  console.log("3. Update the .env file with the kernel address and ID");
  console.log("----------------------------------------------------\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 