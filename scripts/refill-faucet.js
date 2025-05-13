// Script to refill the TokenFaucet contract
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  try {
    // Check for required environment variables
    const faucetAddress = process.env.TOKEN_FAUCET_ADDRESS;
    const donationTokenAddress = process.env.DONATION_TOKEN_ADDRESS;
    
    if (!faucetAddress || !donationTokenAddress) {
      console.error("Error: TOKEN_FAUCET_ADDRESS and DONATION_TOKEN_ADDRESS must be set in .env file");
      process.exit(1);
    }
    
    console.log("Refilling TokenFaucet...");
    console.log("Network:", hre.network.name);
    console.log("RPC URL:", hre.network.config.url);
    
    // Get the deployer's address and balance
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", hre.ethers.formatEther(balance), "ETH");
    
    // Get the DonationToken contract
    console.log("\nGetting DonationToken contract...");
    const DonationToken = await hre.ethers.getContractFactory("DonationToken");
    const token = await DonationToken.attach(donationTokenAddress);
    
    // Get the TokenFaucet contract
    console.log("Getting TokenFaucet contract...");
    const TokenFaucet = await hre.ethers.getContractFactory("TokenFaucet");
    const faucet = await TokenFaucet.attach(faucetAddress);
    
    // Get current faucet balance
    const currentBalance = await faucet.getFaucetBalance();
    console.log("\nCurrent faucet balance:", hre.ethers.formatEther(currentBalance), "tokens");
    
    // Amount to refill (10 million tokens)
    const refillAmount = hre.ethers.parseEther("10000000");
    console.log(`\nRefilling faucet with ${hre.ethers.formatEther(refillAmount)} tokens...`);
    
    try {
      // Mint tokens directly to the faucet
      console.log("\nMinting tokens to faucet...");
      const mintTx = await token.mint(faucetAddress, refillAmount, {
        gasLimit: 5000000,
        gasPrice: hre.ethers.parseUnits("1", "gwei")
      });
      console.log("Mint transaction sent, waiting for confirmation...");
      console.log("Transaction hash:", mintTx.hash);
      await mintTx.wait();
      
      // Get new faucet balance
      const newBalance = await faucet.getFaucetBalance();
      console.log("\nNew faucet balance:", hre.ethers.formatEther(newBalance), "tokens");
      console.log("Faucet refilled successfully!");
      
    } catch (error) {
      console.error("Error refilling faucet:", error.message);
      process.exit(1);
    }
    
  } catch (error) {
    console.error("Script failed with error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed with error:", error);
    process.exit(1);
  }); 