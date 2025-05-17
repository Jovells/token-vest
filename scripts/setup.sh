#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${GREEN}[✓] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

print_error() {
    echo -e "${RED}[✗] $1${NC}"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please create one with the required variables."
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
required_vars=(
    "SEPOLIA_RPC_URL"
    "PRIVATE_KEY"
    "TOKEN_AUTHORITY_PUBLIC_KEY"
    "ETHERSCAN_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "$var is not set in .env file"
        exit 1
    fi
done

# Step 1: Deploy Kernel
print_status "Step 1: Deploying Transaction Limit Kernel..."
npx hardhat run scripts/deploy-kernel.js --network sepolia

# Wait for deployment to complete
sleep 5

# Step 2: Register Kernel
print_status "Step 2: Registering Kernel..."
# Note: This step requires manual intervention with KRNL CLI
print_warning "Please register your kernel using the KRNL CLI and update the .env file with:"
print_warning "TRANSACTION_LIMIT_KERNEL_ID=<your_kernel_id>"
print_warning "TRANSACTION_LIMIT_KERNEL_ADDRESS=<your_kernel_address>"
read -p "Press Enter after you've registered the kernel and updated the .env file..."

# Step 3: Deploy Donation Token and Limited Donation Contract
print_status "Step 3: Deploying Donation Token and Limited Donation Contract..."
npx hardhat run scripts/deploy-donation.js --network sepolia

# Wait for deployment to complete
sleep 5
read -p "Press Enter after you've  updated the .env file... wit Donation Token address"



# Step 5: Verify Contracts
print_status "Step 5: Verifying Contracts..."
npx hardhat run scripts/verify-kernel.js --network sepolia
npx hardhat run scripts/verify-donation.js --network sepolia

# Step 6: Generate ABIs
print_status "Step 6: Generating ABIs..."
npx hardhat run scripts/generate-abis.js

# Step 7: Update Frontend Environment Variables
print_status "Step 7: Updating Frontend Environment Variables..."

# Create frontend .env file
cat > src/frontend/.env << EOL
# Contract Addresses
VITE_DONATION_TOKEN_ADDRESS=$DONATION_TOKEN_ADDRESS
VITE_LIMITED_DONATION_ADDRESS=$LIMITED_DONATION_ADDRESS

# KRNL Configuration
VITE_KRNL_ENTRY_ID=$KRNL_ENTRY_ID
VITE_KRNL_ACCESS_TOKEN=$KRNL_ACCESS_TOKEN
VITE_TRANSACTION_LIMIT_KERNEL_ID=$TRANSACTION_LIMIT_KERNEL_ID

EOL

# Step 8: Install Frontend Dependencies
print_status "Step 8: Installing Frontend Dependencies..."
cd src/frontend || exit
npm install
cd ../..


# Step 10: Final Checks
print_status "Step 10: Performing Final Checks..."

# Check if all required addresses are set
required_addresses=(
    "DONATION_TOKEN_ADDRESS"
    "LIMITED_DONATION_ADDRESS"
    "TRANSACTION_LIMIT_KERNEL_ADDRESS"
)

for addr in "${required_addresses[@]}"; do
    if [ -z "${!addr}" ]; then
        print_error "$addr is not set in .env file"
        exit 1
    fi
done

print_status "Setup completed successfully!"
print_status "You can now start the frontend with:"
print_status "cd src/frontend && npm run dev"

# Print important information
echo -e "\n${YELLOW}Important Information:${NC}"
echo "Donation Token Address: $DONATION_TOKEN_ADDRESS"
echo "Limited Donation Address: $LIMITED_DONATION_ADDRESS"
echo "Transaction Limit Kernel Address: $TRANSACTION_LIMIT_KERNEL_ADDRESS"
echo "Transaction Limit Kernel ID: $TRANSACTION_LIMIT_KERNEL_ID" 