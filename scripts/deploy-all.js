const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting comprehensive deployment of Token Vesting Platform...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📋 Deployment Configuration:");
  console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("-".repeat(50));

  const deployedContracts = {};
  const gasUsed = {};

  try {
    // Determine deployment strategy based on network
    const isBaseSepolia = network.chainId === 84532n;
    const isSepolia = network.chainId === 11155111n;

    if (isBaseSepolia) {
      console.log("🔵 Deploying to Base Sepolia - TokenVestingKernel only");
      
      // 1. Deploy TokenVestingKernel on Base Sepolia
      console.log("\n1️⃣ Deploying TokenVestingKernel to Base Sepolia...");
      const TokenVestingKernel = await ethers.getContractFactory("TokenVestingKernel");
      const tokenVestingKernel = await TokenVestingKernel.deploy();
      await tokenVestingKernel.waitForDeployment();
      const kernelAddress = await tokenVestingKernel.getAddress();
      deployedContracts.tokenVestingKernel = kernelAddress;
      
      const kernelReceipt = await ethers.provider.getTransactionReceipt(tokenVestingKernel.deploymentTransaction().hash);
      gasUsed.tokenVestingKernel = kernelReceipt.gasUsed;
      
      console.log("✅ TokenVestingKernel deployed to Base Sepolia:", kernelAddress);
      console.log("   Gas used:", gasUsed.tokenVestingKernel.toString());

      // Base Sepolia deployment summary
      const deploymentSummary = {
        network: {
          name: "Base Sepolia",
          chainId: network.chainId.toString(),
          deployedAt: new Date().toISOString(),
          deployer: deployer.address
        },
        contracts: {
          tokenVestingKernel: kernelAddress
        },
        gasUsage: {
          tokenVestingKernel: gasUsed.tokenVestingKernel.toString()
        },
        notes: "TokenVestingKernel deployed to Base Sepolia. Deploy other contracts to Sepolia separately."
      };

      fs.writeFileSync(
        path.join(__dirname, '../deployment-base-sepolia.json'), 
        JSON.stringify(deploymentSummary, null, 2)
      );

      console.log("\n" + "=".repeat(60));
      console.log("🎉 BASE SEPOLIA DEPLOYMENT COMPLETED!");
      console.log("=".repeat(60));
      console.log("\n📋 TokenVestingKernel Address:", kernelAddress);
      console.log("\n🔧 Next Steps:");
      console.log("1. Note the kernel address for Sepolia deployment");
      console.log("2. Deploy remaining contracts to Sepolia with this kernel address");
      console.log("3. Update frontend configuration with Base Sepolia kernel address");

    } else if (isSepolia) {
      console.log("🟡 Deploying to Sepolia - VestedToken and TokenClaimContract");
      
      // Check if we have a kernel address from Base Sepolia deployment
      const kernelAddress = process.env.BASE_SEPOLIA_KERNEL_ADDRESS;
      if (!kernelAddress) {
        console.log("⚠️  Warning: BASE_SEPOLIA_KERNEL_ADDRESS not set. Please deploy TokenVestingKernel to Base Sepolia first.");
        console.log("   For now, deploying a temporary kernel to Sepolia for testing...");
        
        // Deploy temporary kernel for testing
        console.log("\n1️⃣ Deploying temporary TokenVestingKernel to Sepolia...");
        const TokenVestingKernel = await ethers.getContractFactory("TokenVestingKernel");
        const tokenVestingKernel = await TokenVestingKernel.deploy();
        await tokenVestingKernel.waitForDeployment();
        const tempKernelAddress = await tokenVestingKernel.getAddress();
        deployedContracts.tokenVestingKernel = tempKernelAddress;
        console.log("✅ Temporary TokenVestingKernel deployed to Sepolia:", tempKernelAddress);
      } else {
        deployedContracts.tokenVestingKernel = kernelAddress;
        console.log("🔗 Using Base Sepolia kernel address:", kernelAddress);
      }

      // 2. Deploy VestedToken on Sepolia
      console.log("\n2️⃣ Deploying VestedToken to Sepolia...");
      const VestedToken = await ethers.getContractFactory("VestedToken");
      const vestedToken = await VestedToken.deploy();
      await vestedToken.waitForDeployment();
      const tokenAddress = await vestedToken.getAddress();
      deployedContracts.vestedToken = tokenAddress;
      
      const tokenReceipt = await ethers.provider.getTransactionReceipt(vestedToken.deploymentTransaction().hash);
      gasUsed.vestedToken = tokenReceipt.gasUsed;
      
      console.log("✅ VestedToken deployed to Sepolia:", tokenAddress);
      console.log("   Gas used:", gasUsed.vestedToken.toString());

      // 3. Deploy TokenClaimContract on Sepolia
      console.log("\n3️⃣ Deploying TokenClaimContract to Sepolia...");
      const TOKEN_AUTHORITY_PUBLIC_KEY = process.env.TOKEN_AUTHORITY_PUBLIC_KEY || deployer.address;
      const VESTING_KERNEL_ID = process.env.VESTING_KERNEL_ID || 1;
      
      const TokenClaimContract = await ethers.getContractFactory("TokenClaimContract");
      const tokenClaimContract = await TokenClaimContract.deploy(
        TOKEN_AUTHORITY_PUBLIC_KEY,
        VESTING_KERNEL_ID,
        deployedContracts.tokenVestingKernel
      );
      await tokenClaimContract.waitForDeployment();
      const claimAddress = await tokenClaimContract.getAddress();
      deployedContracts.tokenClaimContract = claimAddress;
      
      const claimReceipt = await ethers.provider.getTransactionReceipt(tokenClaimContract.deploymentTransaction().hash);
      gasUsed.tokenClaimContract = claimReceipt.gasUsed;
      
      console.log("✅ TokenClaimContract deployed to Sepolia:", claimAddress);
      console.log("   Gas used:", gasUsed.tokenClaimContract.toString());

      // 4. Setup demo vesting schedule (only if we have a real kernel)
      if (!process.env.BASE_SEPOLIA_KERNEL_ADDRESS) {
        console.log("\n4️⃣ Setting up demo vesting schedule on temporary kernel...");
        const TokenVestingKernel = await ethers.getContractFactory("TokenVestingKernel");
        const kernelContract = TokenVestingKernel.attach(deployedContracts.tokenVestingKernel);
        
        const startTime = Math.floor(Date.now() / 1000);
        const cliffDuration = 0;
        const vestingDuration = 365 * 24 * 60 * 60;
        const totalAmount = ethers.parseEther("1000");
        const eligibleAddresses = [deployer.address];

        const setupTx = await kernelContract.setVestingSchedule(
          tokenAddress,
          totalAmount,
          startTime,
          cliffDuration,
          vestingDuration,
          eligibleAddresses
        );
        await setupTx.wait();
        
        console.log("✅ Demo vesting schedule created");
      }

      // Environment configuration for Sepolia deployment
      const envConfig = `# Generated deployment configuration
# Network: ${network.name} (Chain ID: ${network.chainId})
# Deployed: ${new Date().toISOString()}

# KRNL Configuration (REPLACE WITH YOUR VALUES)
VITE_KRNL_ENTRY_ID=your_krnl_entry_id_here
VITE_KRNL_ACCESS_TOKEN=your_krnl_access_token_here
VITE_VESTING_KERNEL_ID=${process.env.VESTING_KERNEL_ID || 1}

# RPC Configuration
VITE_RPC_URL=https://v0-0-3-rpc.node.lat
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Contract Addresses
VITE_VESTED_TOKEN_ADDRESS=${tokenAddress}
VITE_TOKEN_CLAIM_CONTRACT_ADDRESS=${claimAddress}
VITE_TOKEN_VESTING_KERNEL_ADDRESS=${deployedContracts.tokenVestingKernel}

# Network Configuration
VITE_CHAIN_ID=${network.chainId}
VITE_BASE_SEPOLIA_CHAIN_ID=84532
`;

      fs.writeFileSync(path.join(__dirname, '../src/frontend/.env.generated'), envConfig);

      // Sepolia deployment summary
      const deploymentSummary = {
        network: {
          name: network.name,
          chainId: network.chainId.toString(),
          deployedAt: new Date().toISOString(),
          deployer: deployer.address
        },
        contracts: deployedContracts,
        gasUsage: Object.fromEntries(
          Object.entries(gasUsed).map(([key, value]) => [key, value.toString()])
        ),
        configuration: {
          tokenAuthorityPublicKey: process.env.TOKEN_AUTHORITY_PUBLIC_KEY || deployer.address,
          baseSepoliaKernel: deployedContracts.tokenVestingKernel,
          crossChain: true
        }
      };

      fs.writeFileSync(
        path.join(__dirname, '../deployment-sepolia.json'), 
        JSON.stringify(deploymentSummary, null, 2)
      );

      console.log("\n" + "=".repeat(60));
      console.log("🎉 SEPOLIA DEPLOYMENT COMPLETED!");
      console.log("=".repeat(60));
      console.log("\n📋 Contract Addresses:");
      console.log("TokenVestingKernel (Base Sepolia):", deployedContracts.tokenVestingKernel);
      console.log("VestedToken (Sepolia):", tokenAddress);
      console.log("TokenClaimContract (Sepolia):", claimAddress);

    } else {
      throw new Error(`Unsupported network: ${network.name} (Chain ID: ${network.chainId}). Please use Sepolia or Base Sepolia.`);
    }

    console.log("\n🔧 Next Steps:");
    console.log("1. Update frontend configuration with deployed addresses");
    console.log("2. Register TokenVestingKernel with KRNL platform");
    console.log("3. Test cross-chain functionality");
    console.log("4. Deploy frontend to hosting platform");

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