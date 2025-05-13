// Script to deploy the DonationToken and LimitedDonation contracts
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // Check for required environment variables
  const tokenAuthorityKey = process.env.TOKEN_AUTHORITY_PUBLIC_KEY;
  const kernelId = process.env.TRANSACTION_LIMIT_KERNEL_ID;
  const kernelAddress = process.env.TRANSACTION_LIMIT_KERNEL_ADDRESS;
  
  if (!tokenAuthorityKey || !kernelId || !kernelAddress) {
    console.error("Error: TOKEN_AUTHORITY_PUBLIC_KEY, TRANSACTION_LIMIT_KERNEL_ID, and TRANSACTION_LIMIT_KERNEL_ADDRESS must be set in .env file");
    process.exit(1);
  }
  
  console.log("Deploying DonationToken...");
  
  // Initial supply: 1,000,000 tokens with 18 decimals
  const initialSupply = hre.ethers.parseEther("1000000");
  
  // Deploy the token contract
  const DonationToken = await hre.ethers.getContractFactory("DonationToken");
  const token = await DonationToken.deploy(initialSupply);
  await token.waitForDeployment();
  
  const tokenAddress = await token.getAddress();
  console.log(`DonationToken deployed to: ${tokenAddress}`);
  
  // Get deployer address to use as initial charity address
  const [deployer] = await hre.ethers.getSigners();
  const charityAddress = deployer.address;
  
  console.log("\nDeploying LimitedDonation contract...");
  
  // Deploy the donation contract
  const LimitedDonation = await hre.ethers.getContractFactory("LimitedDonation");
  const donation = await LimitedDonation.deploy(
    tokenAuthorityKey,
    kernelId,
    kernelAddress,
    tokenAddress,
    charityAddress
  );
  await donation.waitForDeployment();
  
  const donationAddress = await donation.getAddress();
  console.log(`LimitedDonation deployed to: ${donationAddress}`);
  
  console.log("\n----------------------------------------------------");
  console.log("Next steps:");
  console.log("1. Update the .env file with the contract addresses:");
  console.log(`   DONATION_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`   LIMITED_DONATION_ADDRESS=${donationAddress}`);
  console.log("2. Set up the frontend to interact with these contracts");
  console.log("----------------------------------------------------\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 