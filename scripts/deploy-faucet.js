// Script to deploy the TokenFaucet contract
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  try {
    // Check for required environment variables
    const donationTokenAddress = process.env.DONATION_TOKEN_ADDRESS;
    
    if (!donationTokenAddress) {
      console.error("Error: DONATION_TOKEN_ADDRESS must be set in .env file");
      process.exit(1);
    }
    
    console.log("Deploying TokenFaucet...");
    console.log("Network:", hre.network.name);
    console.log("RPC URL:", hre.network.config.url);
    
    // Get the deployer's address and balance
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", hre.ethers.formatEther(balance), "ETH");
    
    // Amount per request: 10 tokens with 18 decimals
    const amountPerRequest = hre.ethers.parseEther("10");
    
    // Cooldown: 1 hour in seconds
    const requestCooldown = 3600;
    
    console.log("\nDeploying TokenFaucet contract...");
    console.log("Constructor arguments:");
    console.log("- Token address:", donationTokenAddress);
    console.log("- Amount per request:", hre.ethers.formatEther(amountPerRequest), "tokens");
    console.log("- Request cooldown:", requestCooldown, "seconds");
    
    // Deploy the faucet contract with explicit gas settings
    const TokenFaucet = await hre.ethers.getContractFactory("TokenFaucet");
    console.log("\nContract factory created, deploying...");
    
    const faucet = await TokenFaucet.deploy(
      donationTokenAddress,
      amountPerRequest,
      requestCooldown,
      {
        gasLimit: 5000000,
        gasPrice: hre.ethers.parseUnits("0.1", "gwei")
      }
    );
    
    console.log("Deployment transaction sent, waiting for confirmation...");
    console.log("Transaction hash:", faucet.deploymentTransaction().hash);
    
    await faucet.waitForDeployment();
    
    const faucetAddress = await faucet.getAddress();
    console.log(`\nTokenFaucet deployed to: ${faucetAddress}`);
    
    // Get the DonationToken contract to fund the faucet
    console.log("\nGetting DonationToken contract...");
    const DonationToken = await hre.ethers.getContractFactory("DonationToken");
    const token = await DonationToken.attach(donationTokenAddress);
    
    // Fund the faucet with 100 tokens
    const fundingAmount = hre.ethers.parseEther("10000000");
    console.log(`\nFunding the faucet with ${hre.ethers.formatEther(fundingAmount)} tokens...`);
    
    try {
      // Approve the faucet to take tokens
      console.log("Approving tokens for faucet...");
      const approveTx = await token.approve(faucetAddress, fundingAmount, {
        gasLimit: 5000000,
        gasPrice: hre.ethers.parseUnits("0.1", "gwei")
      });
      console.log("Approval transaction sent, waiting for confirmation...");
      console.log("Transaction hash:", approveTx.hash);
      await approveTx.wait();
      console.log("Approval transaction complete");
      
      // Refill the faucet
      console.log("\nRefilling faucet...");
      const refillTx = await faucet.refillFaucet(fundingAmount, {
        gasLimit: 5000000,
        gasPrice: hre.ethers.parseUnits("0.1", "gwei")
      });
      console.log("Refill transaction sent, waiting for confirmation...");
      console.log("Transaction hash:", refillTx.hash);
      await refillTx.wait();
      console.log("Faucet funded successfully!");
    } catch (error) {
      console.error("Error funding faucet:", error.message);
      console.log("You will need to manually fund the faucet after deployment.");
    }
    
    // Update .env file with new contract address
    console.log("\nUpdating environment variables...");
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env');

    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update or add the contract address
      envContent = envContent.replace(/^TOKEN_FAUCET_ADDRESS=.*$/m, `TOKEN_FAUCET_ADDRESS=${faucetAddress}`);
      
      // If the variable doesn't exist yet, add it
      if (!envContent.includes('TOKEN_FAUCET_ADDRESS=')) {
        envContent += `\nTOKEN_FAUCET_ADDRESS=${faucetAddress}`;
      }
      
      // Write the updated content back to .env
      fs.writeFileSync(envPath, envContent);
      console.log("Environment variables updated successfully!");
    } else {
      console.warn("Warning: .env file not found. Unable to update environment variables.");
    }
    
    // Also update frontend .env
    const frontendEnvPath = path.join(__dirname, '..', 'src', 'frontend', '.env');
    if (!fs.existsSync(path.dirname(frontendEnvPath))) {
      fs.mkdirSync(path.dirname(frontendEnvPath), { recursive: true });
    }
    
    let frontendEnvContent = '';
    if (fs.existsSync(frontendEnvPath)) {
      frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
    }
    
    // Update or add the contract address
    const envVarName = 'VITE_TOKEN_FAUCET_ADDRESS';
    if (!frontendEnvContent.includes(envVarName)) {
      frontendEnvContent += `\n${envVarName}=${faucetAddress}`;
    } else {
      // Update existing env var
      const regex = new RegExp(`${envVarName}=.*`);
      frontendEnvContent = frontendEnvContent.replace(regex, `${envVarName}=${faucetAddress}`);
    }
    
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log("Frontend environment variables updated!");
    
    
    console.log("\n----------------------------------------------------");
    console.log("Deployment complete!");
    console.log(`TokenFaucet: ${faucetAddress}`);
    console.log("ABIs have been generated and updated in the frontend.");
    console.log("----------------------------------------------------\n");
  } catch (error) {
    console.error("Deployment failed with error:", error);
    if (error.transaction) {
      console.error("Transaction hash:", error.transaction.hash);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed with error:", error);
    process.exit(1);
  }); 