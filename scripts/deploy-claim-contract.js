const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TokenClaimContract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Constructor parameters
  const tokenAuthorityPublicKey = process.env.TOKEN_AUTHORITY_PUBLIC_KEY || deployer.address;
  const vestingKernelId = process.env.VESTING_KERNEL_ID || "1"; // Default kernel ID

  if (!vestingKernelId) {
    throw new Error("VITE_TOKEN_VESTING_KERNEL_ADDRESS not found in environment. Deploy TokenVestingKernel first.");
  }

  console.log("Constructor parameters:");
  console.log(`Token Authority Public Key: ${tokenAuthorityPublicKey}`);
  console.log(`Vesting Kernel ID: ${vestingKernelId}`);

  const TokenClaimContract = await ethers.getContractFactory("TokenClaimContract");
  
  // Deploy the contract with constructor arguments
  const tokenClaimContract = await TokenClaimContract.deploy(
    tokenAuthorityPublicKey,
    vestingKernelId,
  );
  await tokenClaimContract.waitForDeployment();

  const contractAddress = await tokenClaimContract.getAddress();
  console.log("TokenClaimContract deployed to:", contractAddress);

  // Verify the deployment
  const kernelId = await tokenClaimContract.vestingKernelId();
  
  console.log(`Configured Vesting Kernel ID: ${kernelId}`);

  // Save the address to environment or config file
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_TOKEN_CLAIM_CONTRACT_ADDRESS=${contractAddress}`);
  
  return contractAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((address) => {
    console.log(`\nDeployment completed: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 