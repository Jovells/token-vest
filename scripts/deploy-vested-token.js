const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying VestedToken...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const VestedToken = await ethers.getContractFactory("VestedToken");
  
  // Deploy the contract (no constructor arguments needed)
  const initialSupply = BigInt(100_000_000) * BigInt(10 ** 18); // 100 million tokens
  const vestedToken = await VestedToken.deploy(initialSupply);
  await vestedToken.waitForDeployment();

  const contractAddress = await vestedToken.getAddress();
  console.log("VestedToken deployed to:", contractAddress);

  // Get token details
  const name = await vestedToken.name();
  const symbol = await vestedToken.symbol();
  const decimals = await vestedToken.decimals();
  
  console.log(`Token Name: ${name}`);
  console.log(`Token Symbol: ${symbol}`);
  console.log(`Token Decimals: ${decimals}`);

  // Save the address to environment or config file
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_VESTED_TOKEN_ADDRESS=${contractAddress}`);
  
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