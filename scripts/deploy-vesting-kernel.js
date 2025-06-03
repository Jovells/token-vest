const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔵 Deploying TokenVestingKernel to Base Sepolia...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📋 Deployment Configuration:");
  console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("-".repeat(50));

  try {
    // Verify we're on Base Sepolia
    if (network.chainId !== 84532n) {
      throw new Error(`Wrong network! Expected Base Sepolia (84532), got ${network.chainId}. Use --network baseSepolia`);
    }

    // Deploy TokenVestingKernel
    console.log("\n🚀 Deploying TokenVestingKernel...");
    const TokenVestingKernel = await ethers.getContractFactory("TokenVestingKernel");
  const tokenVestingKernel = await TokenVestingKernel.deploy();
  await tokenVestingKernel.waitForDeployment();
    const kernelAddress = await tokenVestingKernel.getAddress();
    
    const receipt = await ethers.provider.getTransactionReceipt(tokenVestingKernel.deploymentTransaction().hash);
    const gasUsed = receipt.gasUsed;
    
    console.log("✅ TokenVestingKernel deployed successfully!");
    console.log("   Address:", kernelAddress);
    console.log("   Gas used:", gasUsed.toString());
    console.log("   Transaction hash:", tokenVestingKernel.deploymentTransaction().hash);

    // Save deployment information
    const deploymentInfo = {
      network: {
        name: "Base Sepolia",
        chainId: network.chainId.toString(),
        deployedAt: new Date().toISOString(),
        deployer: deployer.address
      },
      contract: {
        name: "TokenVestingKernel",
        address: kernelAddress,
        transactionHash: tokenVestingKernel.deploymentTransaction().hash,
        gasUsed: gasUsed.toString()
      }
    };

    // Save to file
    fs.writeFileSync(
      path.join(__dirname, '../deployment-base-sepolia-kernel.json'), 
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 BASE SEPOLIA DEPLOYMENT COMPLETED!");
    console.log("=".repeat(60));
    
    console.log("\n📋 Important Information:");
    console.log("Contract Address:", kernelAddress);
    console.log("Network: Base Sepolia (Chain ID: 84532)");
    console.log("Explorer:", `https://sepolia.basescan.org/address/${kernelAddress}`);
    
    console.log("\n🔧 Next Steps:");
    console.log("1. Save this kernel address for Sepolia deployment:");
    console.log(`   BASE_SEPOLIA_KERNEL_ADDRESS=${kernelAddress}`);
    console.log("2. Add the above line to your .env file");
    console.log("3. Deploy remaining contracts to Sepolia:");
    console.log("   npx hardhat run scripts/deploy-all.js --network sepolia");
    console.log("4. Register this kernel with KRNL platform");

    console.log("\n📁 Files Generated:");
    console.log("- deployment-base-sepolia-kernel.json (Deployment details)");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 