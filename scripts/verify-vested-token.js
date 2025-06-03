const { run } = require("hardhat");

async function main() {
  const contractAddress = process.env.VITE_VESTED_TOKEN_ADDRESS;
  
  if (!contractAddress) {
    throw new Error("VITE_VESTED_TOKEN_ADDRESS not found in environment");
  }

  console.log("Verifying VestedToken at:", contractAddress);

  const initialSupply = BigInt(100_000_000) * BigInt(10 ** 18); // 100 million tokens


  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [initialSupply], // No constructor arguments
    });
    console.log("VestedToken verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("VestedToken is already verified!");
    } else {
      console.error("Verification failed:", error);
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  }); 