// Script to verify the TokenFaucet contract on Etherscan
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // Check for required environment variables
  const faucetAddress = process.env.TOKEN_FAUCET_ADDRESS;
  const donationTokenAddress = process.env.DONATION_TOKEN_ADDRESS;
  
  if (!faucetAddress) {
    console.error("Error: TOKEN_FAUCET_ADDRESS must be set in .env file");
    process.exit(1);
  }
  
  if (!donationTokenAddress) {
    console.error("Error: DONATION_TOKEN_ADDRESS must be set in .env file");
    process.exit(1);
  }
  
  console.log("Verifying TokenFaucet contract...");
  
  // Get amount per request and cooldown from the contract
  const TokenFaucet = await hre.ethers.getContractFactory("TokenFaucet");
  const faucet = await TokenFaucet.attach(faucetAddress);
  
  try {
    // Read the contract parameters for verification
    const amountPerRequest = await faucet.amountPerRequest();
    const requestCooldown = await faucet.requestCooldown();
    
    console.log(`TokenFaucet parameters:`);
    console.log(`- Token address: ${donationTokenAddress}`);
    console.log(`- Amount per request: ${hre.ethers.formatEther(amountPerRequest)} tokens`);
    console.log(`- Request cooldown: ${requestCooldown} seconds`);
    
    console.log("\nVerifying contract on Etherscan...");
    
    // Verify the contract with constructor arguments
    await hre.run("verify:verify", {
      address: faucetAddress,
      constructorArguments: [
        donationTokenAddress,
        amountPerRequest,
        requestCooldown
      ],
    });
    
    console.log("TokenFaucet verified successfully!");
  } catch (error) {
    // Check if already verified
    if (error.message.includes("Already Verified")) {
      console.log("Contract already verified!");
    } else {
      console.error("Verification error:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 