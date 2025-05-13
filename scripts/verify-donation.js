// Script to verify the DonationToken and LimitedDonation contracts on Etherscan
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // Check for required environment variables
  const tokenAddress = process.env.DONATION_TOKEN_ADDRESS;
  const donationAddress = process.env.LIMITED_DONATION_ADDRESS;
  const tokenAuthorityKey = process.env.TOKEN_AUTHORITY_PUBLIC_KEY;
  const kernelId = process.env.TRANSACTION_LIMIT_KERNEL_ID;
  const kernelAddress = process.env.TRANSACTION_LIMIT_KERNEL_ADDRESS;
  const initialSupply = hre.ethers.parseEther("1000000"); // 1,000,000 tokens with 18 decimals
  
  // Check if all required environment variables are set
  if (!tokenAddress || !donationAddress || !tokenAuthorityKey || !kernelId || !kernelAddress) {
    console.error("Error: The following environment variables must be set:");
    console.error("- DONATION_TOKEN_ADDRESS");
    console.error("- LIMITED_DONATION_ADDRESS");
    console.error("- TOKEN_AUTHORITY_PUBLIC_KEY");
    console.error("- TRANSACTION_LIMIT_KERNEL_ID");
    console.error("- TRANSACTION_LIMIT_KERNEL_ADDRESS");
    process.exit(1);
  }
  
  // Verify the DonationToken contract
  console.log(`Verifying DonationToken at address: ${tokenAddress}`);
  try {
    await hre.run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [initialSupply],
    });
    console.log("DonationToken verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("DonationToken is already verified!");
    } else {
      console.error("Error during DonationToken verification:", error);
    }
  }
  
  // Verify the LimitedDonation contract
  console.log(`\nVerifying LimitedDonation at address: ${donationAddress}`);
  try {
    // Get the charity address from the contract
    const LimitedDonation = await hre.ethers.getContractFactory("LimitedDonation");
    const limitedDonation = await LimitedDonation.attach(donationAddress);
    const charityAddress = await limitedDonation.charityAddress();
    
    await hre.run("verify:verify", {
      address: donationAddress,
      constructorArguments: [
        tokenAuthorityKey,
        kernelId,
        kernelAddress,
        tokenAddress,
        charityAddress
      ],
    });
    console.log("LimitedDonation verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("LimitedDonation is already verified!");
    } else {
      console.error("Error during LimitedDonation verification:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 