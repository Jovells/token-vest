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
  
  // Get the compiled artifacts
  const donationTokenPath = path.join(__dirname, '../artifacts/src/contracts/DonationToken.sol/DonationToken.json');
  const limitedDonationPath = path.join(__dirname, '../artifacts/src/contracts/LimitedDonation.sol/LimitedDonation.json');
  const tokenFaucetPath = path.join(__dirname, '../artifacts/src/contracts/TokenFaucet.sol/TokenFaucet.json');
  
  try {
    // Read the artifact files
    const donationTokenArtifact = JSON.parse(fs.readFileSync(donationTokenPath, 'utf8'));
    const limitedDonationArtifact = JSON.parse(fs.readFileSync(limitedDonationPath, 'utf8'));
    
    // Extract the ABIs
    const donationTokenABI = donationTokenArtifact.abi;
    const limitedDonationABI = limitedDonationArtifact.abi;
    
    // Write the ABI files
    fs.writeFileSync(
      path.join(abiDir, 'DonationToken.json'),
      JSON.stringify(donationTokenABI, null, 2)
    );
    
    fs.writeFileSync(
      path.join(abiDir, 'LimitedDonation.json'),
      JSON.stringify(limitedDonationABI, null, 2)
    );
    
    // Try to read and write the TokenFaucet ABI if it exists
    try {
      const tokenFaucetArtifact = JSON.parse(fs.readFileSync(tokenFaucetPath, 'utf8'));
      const tokenFaucetABI = tokenFaucetArtifact.abi;
      
      fs.writeFileSync(
        path.join(abiDir, 'TokenFaucet.json'),
        JSON.stringify(tokenFaucetABI, null, 2)
      );
      console.log("TokenFaucet ABI generated successfully!");
      
      // Generate index.js file to export all ABIs
      const indexPath = path.join(abiDir, 'index.js');
      const indexContent = `import DonationTokenABI from './DonationToken.json';
import LimitedDonationABI from './LimitedDonation.json';
import TokenFaucetABI from './TokenFaucet.json';

export {
  DonationTokenABI,
  LimitedDonationABI,
  TokenFaucetABI
};
`;
      fs.writeFileSync(indexPath, indexContent);
      
    } catch (faucetError) {
      console.warn("TokenFaucet contract not found or not compiled yet:", faucetError.message);
      
      // Generate index.js file without the TokenFaucet
      const indexPath = path.join(abiDir, 'index.js');
      const indexContent = `import DonationTokenABI from './DonationToken.json';
import LimitedDonationABI from './LimitedDonation.json';

export {
  DonationTokenABI,
  LimitedDonationABI
};
`;
      fs.writeFileSync(indexPath, indexContent);
    }
    
    console.log("ABI files generated successfully!");
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