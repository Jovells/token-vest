// Script to generate ABI files for the frontend
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Generating ABI files for frontend...");
  
  // Create the directory if it doesn't exist
  const abiDir = path.join(__dirname, '../src/frontend/src/abis');
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }
  
  // Get the compiled artifacts for new contracts
  const tokenVestingKernelPath = path.join(__dirname, '../artifacts/src/contracts/TokenVestingKernel.sol/TokenVestingKernel.json');
  const tokenClaimContractPath = path.join(__dirname, '../artifacts/src/contracts/TokenClaimContract.sol/TokenClaimContract.json');
  const vestedTokenPath = path.join(__dirname, '../artifacts/src/contracts/VestedToken.sol/VestedToken.json');
  
  try {
    // Read the artifact files
    const tokenVestingKernelArtifact = JSON.parse(fs.readFileSync(tokenVestingKernelPath, 'utf8'));
    const tokenClaimContractArtifact = JSON.parse(fs.readFileSync(tokenClaimContractPath, 'utf8'));
    const vestedTokenArtifact = JSON.parse(fs.readFileSync(vestedTokenPath, 'utf8'));
    
    // Extract the ABIs
    const tokenVestingKernelABI = tokenVestingKernelArtifact.abi;
    const tokenClaimContractABI = tokenClaimContractArtifact.abi;
    const vestedTokenABI = vestedTokenArtifact.abi;
    
    // Generate TypeScript ABI files
    const generateTSABI = (abi, contractName) => {
      return `export default ${JSON.stringify(abi, null, 2)} as const;`;
    };
    
    // Write the ABI files as TypeScript modules
    fs.writeFileSync(
      path.join(abiDir, 'TokenVestingKernel.ts'),
      generateTSABI(tokenVestingKernelABI, 'TokenVestingKernel')
    );
    
    fs.writeFileSync(
      path.join(abiDir, 'TokenClaimContract.ts'),
      generateTSABI(tokenClaimContractABI, 'TokenClaimContract')
    );
    
    fs.writeFileSync(
      path.join(abiDir, 'VestedToken.ts'),
      generateTSABI(vestedTokenABI, 'VestedToken')
    );
    
    console.log("ABI files generated successfully!");
    console.log("- TokenVestingKernel.ts");
    console.log("- TokenClaimContract.ts");
    console.log("- VestedToken.ts");
    
  } catch (error) {
    console.error("Error generating ABI files:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 