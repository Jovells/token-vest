require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is not set");
}



/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: 1000000000, // 1 gwei
      gasMultiplier: 1.2
    }
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    // Your API key for Etherscan
    apiKey: {
      // For Ethereum networks
      mainnet: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      // For Base networks
      base: process.env.BASESCAN_API_KEY,
      baseSepolia: process.env.BASESCAN_API_KEY
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },
  sourcify: {
    // Enable sourcify verification
    enabled: true
  }
}; 